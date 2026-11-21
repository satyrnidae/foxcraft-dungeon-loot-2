// Just enough PNG for the viewer's icons, without a dependency: reads an 8 bit, non-interlaced PNG to RGBA, writes an animated PNG,
// and draws the enchantment glint over an icon one loop at a time.
import zlib from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** { width, height, data } of a PNG, data as RGBA bytes. Color types 0, 2, 3, 4 and 6 at 8 bits, no interlacing. */
export function decodePng(buf) {
  let at = 8;
  let header;
  let palette = null;
  let alpha = null;
  const idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at);
    const type = buf.toString('ascii', at + 4, at + 8);
    const data = buf.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), depth: data[8], color: data[9], interlace: data[12] };
    else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') alpha = data;
    else if (type === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  const { width, height, depth, color, interlace } = header;
  if (depth !== 8 || interlace) throw new Error('only 8 bit, non-interlaced PNGs');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[color];
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? rows[y * stride + x - channels] : 0;
      const b = y ? rows[(y - 1) * stride + x] : 0;
      const c = x >= channels && y ? rows[(y - 1) * stride + x - channels] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rows[y * stride + x] = (v + add) & 0xff;
    }
  }
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const p = i * channels;
    let rgba;
    if (color === 6) rgba = [rows[p], rows[p + 1], rows[p + 2], rows[p + 3]];
    else if (color === 2) rgba = [rows[p], rows[p + 1], rows[p + 2], 255];
    else if (color === 0) rgba = [rows[p], rows[p], rows[p], 255];
    else if (color === 4) rgba = [rows[p], rows[p], rows[p], rows[p + 1]];
    else rgba = [palette[rows[p] * 3], palette[rows[p] * 3 + 1], palette[rows[p] * 3 + 2], alpha && rows[p] < alpha.length ? alpha[rows[p]] : 255];
    data.set(rgba, i * 4);
  }
  return { width, height, data };
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'ascii');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

/** The zlib stream of one frame, filter 0 on every row. */
function idatOf(frame, width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) frame.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return zlib.deflateSync(raw, { level: 9 });
}

/** An animated PNG that loops forever, frames as RGBA buffers of width x height, shown at fps. The first frame is the default image. */
export function encodeApng(frames, width, height, fps) {
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])];
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  parts.push(chunk('IHDR', ihdr));
  const ac = Buffer.alloc(8);
  ac.writeUInt32BE(frames.length, 0);
  parts.push(chunk('acTL', ac));
  let seq = 0;
  frames.forEach((frame, n) => {
    const fc = Buffer.alloc(26);
    fc.writeUInt32BE(seq++, 0);
    fc.writeUInt32BE(width, 4);
    fc.writeUInt32BE(height, 8);
    fc.writeUInt16BE(1, 20);
    fc.writeUInt16BE(fps, 22);
    parts.push(chunk('fcTL', fc));
    const data = idatOf(frame, width, height);
    if (n === 0) {
      parts.push(chunk('IDAT', data));
    } else {
      const fd = Buffer.alloc(4 + data.length);
      fd.writeUInt32BE(seq++, 0);
      data.copy(fd, 4);
      parts.push(chunk('fdAT', fd));
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// The glint is the game's texture scrolled diagonally over the item, tilted 10 degrees, in the purple the game tints it, added to
// the icon where it has pixels. One loop moves it a whole texture repeat in each direction, so the end meets the start.
const TINT = [0.5, 0.25, 0.8];
const SCALE = 0.5;
const TILT = (10 * Math.PI) / 180;

/** The frames of an icon with the glint over it, RGBA buffers, the loop being `count` frames. */
export function glintFrames(icon, glint, count) {
  const { width, height } = icon;
  const frames = [];
  for (let n = 0; n < count; n++) {
    const t = n / count;
    const out = Buffer.from(icon.data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (!icon.data[i + 3]) continue;
        // The mean of a 4 by 4 block of the texture under this pixel, so it is not a hash of single texels
        const cu = (x + 0.5) / width - 0.5, cv = (y + 0.5) / height - 0.5;
        const u = (cu * Math.cos(TILT) - cv * Math.sin(TILT)) * SCALE + t;
        const v = (cu * Math.sin(TILT) + cv * Math.cos(TILT)) * SCALE + t;
        let sum = 0;
        for (let dy = 0; dy < 4; dy++) {
          for (let dx = 0; dx < 4; dx++) {
            const tx = Math.floor((u + dx / 64 / 4) * glint.width) % glint.width;
            const ty = Math.floor((v + dy / 64 / 4) * glint.height) % glint.height;
            const g = (((ty + glint.height) % glint.height) * glint.width + ((tx + glint.width) % glint.width)) * 4;
            sum += (glint.data[g] + glint.data[g + 1] + glint.data[g + 2]) / 3 / 255;
          }
        }
        const lum = sum / 16;
        for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.round(icon.data[i + c] + 255 * lum * TINT[c] * 0.6));
      }
    }
    frames.push(out);
  }
  return frames;
}
