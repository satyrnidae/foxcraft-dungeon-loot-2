// Book viewer front end, served by scripts/books/viewer.mjs. The URL hash is #<locale>/<book name>/<page>, so a page can be linked.
const $ = (id) => document.getElementById(id);
const enc = (s) => s.split('/').map(encodeURIComponent).join('/');
const fileOf = (book, name, filtered) => `files/${enc(book.locale)}/${enc(book.name)}${filtered ? '/filtered' : ''}/${name}`;
const pageName = (n) => `page_${String(n).padStart(2, '0')}.png`;

// Books of the site build that are not listed in the grid, opened from the header: the third party notices
const SITE_GROUP = 'site';
const NOTICES = 'site/third_party_notices';
const ABOUT = 'site/about';
let data = { locales: [], books: [] };
let open = null; // { book, page }
let filtered = false; // the chat filtered side, kept across books

//region Sound

// The game's book sounds, downloaded by the site build. A missing file or a browser that blocks sound before a click plays nothing
const SOUND = { flip: [1, 2, 3].map((n) => `sounds/open_flip${n}.ogg`), close: [1, 2].map((n) => `sounds/close_put${n}.ogg`) };
const playing = new Set(); // sounds still going, so muting can cut them off
let muted = false;
try { muted = localStorage.getItem('muted') === '1'; } catch { /* storage blocked, sound stays on */ }
/** Both mute buttons, the header one and the one under the close button, show the same state. */
function showMuted() {
  for (const id of ['mute', 'mute-reader']) {
    const b = $(id);
    b.textContent = muted ? '\u{1F507}' : '\u{1F508}';
    b.title = muted ? 'Unmute sounds' : 'Mute sounds';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(muted));
  }
}
function toggleMuted() {
  muted = !muted;
  if (muted) for (const a of playing) a.pause();
  try { localStorage.setItem('muted', muted ? '1' : '0'); } catch { /* nothing to remember it with */ }
  showMuted();
}
function play(kind) {
  if (muted) return;
  const files = SOUND[kind];
  const audio = new Audio(files[Math.floor(Math.random() * files.length)]);
  audio.volume = .7;
  playing.add(audio);
  audio.addEventListener('ended', () => playing.delete(audio));
  audio.addEventListener('pause', () => playing.delete(audio));
  audio.play().catch(() => {});
}

//endregion
//region Grid

// The page the last book was left on, so closing it by accident loses nothing. Opening another book replaces it. Storage can be blocked, the viewer then starts at page 1
const bookmark = (book) => {
  try { return Number(JSON.parse(localStorage.getItem('bookmarks') ?? '{}')[book.name]) || 1; } catch { return 1; }
};
const setBookmark = (book, page) => {
  try { localStorage.setItem('bookmarks', JSON.stringify({ [book.name]: page })); } catch { /* nothing to remember it with */ }
};

function renderGrid() {
  const query = $('search').value.trim().toLowerCase();
  // One cell per book name: the en_us one where there is one, else the first locale that has it
  const byName = new Map();
  for (const b of data.books) if (!byName.has(b.name) || b.locale === 'en_us') byName.set(b.name, b);
  const books = [...byName.values()].filter((b) => b.group !== SITE_GROUP && b.name.toLowerCase().includes(query));
  const groups = new Map();
  for (const b of books) {
    if (!groups.has(b.group)) groups.set(b.group, []);
    groups.get(b.group).push(b);
  }
  const grid = $('grid');
  grid.replaceChildren();
  for (const [group, list] of groups) {
    const h = document.createElement('h2');
    h.textContent = group || 'Ungrouped';
    const wrap = document.createElement('div');
    wrap.className = 'group';
    for (const b of list) wrap.append(cell(b));
    grid.append(h, wrap);
  }
  $('count').textContent = `${books.length} book${books.length === 1 ? '' : 's'}`;
}

function cell(book) {
  const el = document.createElement('button');
  el.className = 'book';
  const icon = document.createElement('div');
  icon.className = 'icon';
  // The model texture of the book, an animated PNG of the enchantment glint for a written book
  icon.style.setProperty('--icon', `url("${book.icon ?? 'icon.png'}")`);
  const label = document.createElement('span');
  label.textContent = book.id;
  el.append(icon, label);
  el.addEventListener('click', () => show(book, bookmark(book)));
  if (book.hasTooltip) {
    el.addEventListener('mouseenter', () => tip(book));
    el.addEventListener('mousemove', moveTip);
    el.addEventListener('mouseleave', () => { $('tooltip').hidden = true; });
    el.addEventListener('focus', () => { tip(book); placeTip(el.getBoundingClientRect().right, el.getBoundingClientRect().top); });
    el.addEventListener('blur', () => { $('tooltip').hidden = true; });
  }
  return el;
}

//endregion
//region Tooltip

function tip(book) {
  showTip(fileOf(book, 'tooltip.png'));
}

function showTip(url) {
  const t = $('tooltip');
  // Rendered at 3 pixels per GUI pixel, shown at 2. Sized here, not with CSS zoom, which would scale the left/top offsets too
  t.onload = () => { t.style.width = `${t.naturalWidth * 2 / 3}px`; };
  t.src = url;
  t.hidden = false;
}

function placeTip(x, y) {
  const t = $('tooltip');
  const w = t.getBoundingClientRect().width, h = t.getBoundingClientRect().height;
  // The image has a transparent margin of its own, so it sits close to the pointer
  let left = x + 8, top = y + 8;
  if (left + w > innerWidth) left = Math.max(0, x - w - 8);
  if (top + h > innerHeight) top = Math.max(0, innerHeight - h);
  t.style.left = `${left}px`;
  t.style.top = `${top}px`;
}

function moveTip(e) { placeTip(e.clientX, e.clientY); }

//endregion
//region Reader

function hashOf(book = open?.book, page = open?.page) {
  return book ? `#${book.locale}/${book.name}/${page}` : '';
}

function show(book, page, replace, silent) {
  const useFiltered = book.filteredPages > 0 && filtered;
  $('filter').hidden = book.filteredPages === 0;
  $('filter').textContent = useFiltered ? 'Filtered' : 'Unfiltered';
  $('filter').setAttribute('aria-pressed', String(useFiltered));
  const total = useFiltered ? book.filteredPages : book.pages;
  // Opening a book and turning a page in it both make the page turn sound
  const before = open;
  open = { book, page: Math.min(Math.max(1, page), total) };
  if (!silent && (!before || (before.book.name === book.name && before.page !== open.page))) play('flip');
  $('reader').hidden = false;
  $('reader-title').textContent = book.name;
  const siblings = data.books.filter((b) => b.name === book.name);
  $('reader-locale').replaceChildren(...siblings.map((b) => new Option(b.locale, b.locale)));
  $('reader-locale').value = book.locale;
  $('reader-locale').disabled = siblings.length < 2;
  const rt = $('reader-tip');
  rt.hidden = !book.hasTooltip;
  if (book.hasTooltip) {
    rt.onload = () => { rt.style.width = `${rt.naturalWidth * 2 / 3}px`; };
    rt.src = fileOf(book, 'tooltip.png');
  }
  // The filtered side only has the pages that differ, the game shows the raw side of the rest
  const filteredHas = (n) => useFiltered && n <= book.filteredPages;
  $('page').src = fileOf(book, pageName(open.page), filteredHas(open.page));
  $('page-count').textContent = `Page ${open.page} of ${book.pages}`;
  const headings = new Map(useFiltered ? book.filteredHeadings : book.headings);
  open.headings = headings;
  setSlider(book.pages, open.page, headings);
  $('prev').disabled = open.page <= 1;
  $('next').disabled = open.page >= book.pages;
  $('start').disabled = $('prev').disabled;
  $('end').disabled = $('next').disabled;
  $('chapter-prev').disabled = chapterPage(-1) === null;
  $('chapter-next').disabled = chapterPage(1) === null;
  showLinks(book, open.page, filteredHas(open.page));
  for (const n of [open.page - 1, open.page + 1]) {
    if (n >= 1 && n <= book.pages) new Image().src = fileOf(book, pageName(n), filteredHas(n));
  }
  setBookmark(book, open.page);
  const hash = hashOf();
  if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
}

/** The page of the next heading marker in a direction, or null. Backwards with no heading left goes to page 1, forwards with none left has nowhere to go. */
function chapterPage(dir) {
  if (!open) return null;
  const marks = [...(open.headings?.keys() ?? [])].filter((n) => n >= 1 && n <= open.book.pages);
  if (dir < 0) {
    const before = marks.filter((n) => n < open.page);
    return before.length ? Math.max(...before) : open.page > 1 ? 1 : null;
  }
  const after = marks.filter((n) => n > open.page);
  return after.length ? Math.min(...after) : null;
}

/** Skips to the next heading marker in a direction, if there is one. */
function skipChapter(dir) {
  const page = chapterPage(dir);
  if (page !== null) show(open.book, page);
}

/** Sets the slider to a page and draws a stop for each of the pages, the current one marked. */
function setSlider(total, page, headings = new Map()) {
  const slider = $('page-slider'), ticks = $('ticks');
  // A book of one page has one stop, in the middle: the range runs 0 to 2 around it, disabled
  slider.min = total < 2 ? '0' : '1';
  slider.max = total < 2 ? '2' : String(total);
  slider.value = total < 2 ? '1' : String(page);
  slider.disabled = total < 2;
  slider.style.setProperty('--p', total < 2 ? '0' : String((Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min))));
  if (ticks.childElementCount !== total) {
    ticks.replaceChildren(...Array.from({ length: total }, (_, n) => {
      const tick = document.createElement('i');
      // The thumb is 14 pixels wide, so its center runs from 7 pixels in to 7 pixels short of the end
      tick.style.left = total < 2 ? '50%' : `calc(7px + (100% - 14px) * ${n / (total - 1)})`;
      return tick;
    }));
  }
  [...ticks.children].forEach((tick, n) => tick.classList.toggle('on', n + 1 === page));
  // The marks are made again, the one a tip was shown for is gone without a mouseleave
  $('mark-tip').hidden = true;
  // A page with a heading gets a mark on a row of its own above the slider, one diamond per heading
  // stacked upward from the bar with an overlap, the first at the bottom and in front, each one above it drawn behind the last
  $('marks').replaceChildren(...[...headings].filter(([n]) => n <= total).map(([n, names]) => {
    const mark = document.createElement('b');
    mark.style.left = total < 2 ? '50%' : `calc(7px + (100% - 14px) * ${(n - 1) / (total - 1)})`;
    for (let k = 0; k < names.length; k++) {
      const count = names.length;
      const diamond = document.createElement('i');
      diamond.addEventListener('mouseenter', (e) => showMarkTip(names[k] || `Heading on page ${n}`, e));
      diamond.addEventListener('mousemove', moveMarkTip);
      diamond.addEventListener('click', () => { if (open && n !== open.page) show(open.book, n); });
      diamond.addEventListener('mouseleave', () => { $('mark-tip').hidden = true; });
      diamond.style.bottom = `${k * 3}px`;
      // Later pages draw over earlier ones; within a stack the lowest is in front
      diamond.style.zIndex = String(n * 100 + count - k);
      mark.append(diamond);
    }
    return mark;
  }));
  slider.title = headings.has(page) ? 'Chapter heading on this page' : '';
}

/** A mock of the game's item tooltip for a heading mark, drawn in CSS rather than by the game renderer. */
function showMarkTip(text, e) {
  const tip = $('mark-tip');
  tip.textContent = text;
  tip.hidden = false;
  moveMarkTip(e);
}

function moveMarkTip(e) {
  const tip = $('mark-tip');
  // Above and right of the cursor like the game's, kept on screen; the marks sit at the bottom of the page
  const x = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 4);
  tip.style.left = `${Math.max(4, x)}px`;
  tip.style.top = `${Math.max(4, e.clientY - 12 - tip.offsetHeight)}px`;
}

function toggleFilter() {
  if (!open || open.book.filteredPages === 0) return;
  filtered = !filtered;
  show(open.book, open.page, true);
}

//region Links

let linkAreas = [];
let linkSide = false;

/** Fetches the click and hover areas of a page, in GUI pixels of the 192 pixel book, and lays them over the image. */
async function showLinks(book, page, filteredSide) {
  linkAreas = [];
  linkSide = filteredSide;
  $('links').replaceChildren();
  const has = (filteredSide ? book.filteredLinks : book.links).includes(page);
  if (!has) return;
  try {
    const areas = await (await fetch(fileOf(book, pageName(page).replace('.png', '.links.json'), filteredSide))).json();
    if (!open || open.book !== book || open.page !== page) return;
    linkAreas = areas;
    placeLinks();
  } catch { /* the page shows without link areas */ }
}

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

/** What clicking an area does, as the game does it: a link opens, a page link turns the page, copy copies. */
function activate(area, el) {
  if (area.action === 'open_url') {
    el.href = area.value;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.title = area.value;
  } else if (area.action === 'change_page') {
    el.href = hashOf(open.book, Number(area.value));
    el.addEventListener('click', (e) => { e.preventDefault(); show(open.book, Number(area.value)); });
  } else if (area.action === 'copy_to_clipboard') {
    el.href = '#';
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(area.value);
        toast('Copied to clipboard');
      } catch {
        toast('Could not copy, the browser refused');
      }
    });
  } else if (area.action === 'run_command' || area.action === 'suggest_command') {
    // Nothing to run here; the command is shown, as the game would run or type it
    el.addEventListener('click', (e) => e.preventDefault());
    el.title = `${area.action === 'run_command' ? 'Runs' : 'Suggests'}: ${area.value}`;
  }
}

/** Pulls the side buttons in over the transparent margins of the page image, so they sit at the edge of the book itself. */
/** Puts the close button just right of the top corner of the book, or over the corner when the book fills the width. */
function placeClose(bounds, scale) {
  const box = $('page').getBoundingClientRect(), stage = document.querySelector('.stage').getBoundingClientRect(), button = $('close');
  const right = box.left - stage.left + (bounds ? bounds.right * scale : box.width);
  const top = box.top - stage.top + (bounds ? bounds.top * scale : 0);
  button.style.right = 'auto';
  button.style.left = `${Math.max(0, Math.min(right + 4, stage.width - button.offsetWidth))}px`;
  button.style.top = `${Math.max(0, top)}px`;
  const mute = $('mute-reader');
  mute.style.right = 'auto';
  mute.style.left = button.style.left;
  mute.style.top = `${Math.max(0, top) + button.offsetHeight + 4}px`;
}
/** Opaque part of the page image as fractions of its size, so clicks on the transparent margin count as outside the book. */
let pageBounds = null;
function clickedOutsideBook(e) {
  if (e.target.classList.contains('stage')) return true;
  if (e.target !== $('page') || !pageBounds) return false;
  const box = $('page').getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height;
  return x < pageBounds.left || x > pageBounds.right || y < pageBounds.top || y > pageBounds.bottom;
}
function fitSides() {
  const img = $('page'), [left, right] = document.querySelectorAll('.stage .side');
  if (!img.naturalWidth || !img.clientWidth) return;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let min = width, max = -1, top = height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 10) { min = Math.min(min, x); max = Math.max(max, x); top = Math.min(top, y); }
      }
    }
    let bottom = -1;
    for (let y = height - 1; y >= 0 && bottom < 0; y--) {
      for (let x = min; x <= max; x++) if (data[(y * width + x) * 4 + 3] > 10) { bottom = y; break; }
    }
    pageBounds = max < 0 ? null : { left: min / width, right: (max + 1) / width, top: top / height, bottom: (bottom + 1) / height };
    const scale = img.clientWidth / img.naturalWidth;
    left.style.marginRight = max < 0 ? '' : `${-min * scale}px`;
    right.style.marginLeft = max < 0 ? '' : `${-(width - 1 - max) * scale}px`;
    placeClose(max < 0 ? null : { top, right: max + 1 }, scale);
  } catch {
    // A tainted canvas leaves the buttons at the edge of the image
    pageBounds = null;
    left.style.marginRight = right.style.marginLeft = '';
    placeClose(null, 1);
  }
}

function placeLinks() {
  const img = $('page'), host = $('links');
  // The areas are made again, so the one the pointer was on is gone without a mouseleave, and its hover would stay on screen
  if (open) $('tooltip').hidden = true;
  host.replaceChildren();
  const box = img.getBoundingClientRect(), base = host.getBoundingClientRect();
  if (!box.width || !open) return;
  const k = box.width / 192;
  for (const a of linkAreas) {
    const el = document.createElement('a');
    if (a.action) activate(a, el);
    if (a.hover) {
      const url = fileOf(open.book, pageName(open.page).replace('.png', `.hover_${a.hover}.png`), linkSide);
      el.addEventListener('mouseenter', () => showTip(url));
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', () => { $('tooltip').hidden = true; });
    }
    Object.assign(el.style, { left: `${box.left - base.left + a.x * k}px`, top: `${box.top - base.top + a.y * k}px`, width: `${a.w * k}px`, height: `${a.h * k}px` });
    host.append(el);
  }
}

//endregion

function close() {
  if (open) play('close');
  open = null;
  $('reader').hidden = true;
  if (location.hash) history.pushState(null, '', location.pathname);
}

function fromHash() {
  const m = /^#([^/]+)\/(.+)\/(\d+)$/.exec(decodeURIComponent(location.hash));
  if (!m) { if (open) play('close'); open = null; $('reader').hidden = true; return; }
  const book = data.books.find((b) => b.locale === m[1] && b.name === m[2]);
  if (!book) return;
  show(book, Number(m[3]), true);
}

//endregion

//region EULA

const EULA_COOKIE = 'fdl_eula';
// Scoped to the folder the site is served from, so a GitHub Pages sub-path does not share it with the rest of the host
const cookiePath = () => location.pathname.replace(/[^/]*$/, '');
const dnt = () => [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some((v) => v === '1' || v === 'yes');
const eulaAccepted = () => document.cookie.split('; ').some((c) => c === `${EULA_COOKIE}=1`);

/** Asks for the EULA on a visit without the cookie. Do Not Track gets no cookie, so it is asked again on the next visit. */
function eulaGate() {
  if (eulaAccepted()) return;
  const dialog = $('eula'), check = $('eula-check'), ok = $('eula-ok');
  dialog.hidden = false;
  check.focus();
  check.addEventListener('change', () => { ok.disabled = !check.checked; });
  ok.addEventListener('click', () => {
    if (!check.checked) return;
    if (!dnt()) {
      document.cookie = `${EULA_COOKIE}=1; max-age=31536000; path=${cookiePath()}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    }
    dialog.hidden = true;
  });
  // Keep tab focus in the dialog, the page behind it is not usable yet
  dialog.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key !== 'Tab') return;
    const items = [dialog.querySelector('a'), check, ok].filter((el) => !el.disabled);
    const at = items.indexOf(document.activeElement);
    const next = items[(at + (e.shiftKey ? items.length - 1 : 1)) % items.length];
    e.preventDefault();
    next.focus();
  });
}

//endregion

async function main() {
  eulaGate();
  data = await (await fetch('books.json')).json();
  $('reader-locale').addEventListener('change', (e) => {
    const other = open && data.books.find((b) => b.name === open.book.name && b.locale === e.target.value);
    if (other) show(other, open.page);
  });
  $('search').addEventListener('input', renderGrid);
  $('filter').addEventListener('click', toggleFilter);
  $('prev').addEventListener('click', () => open && show(open.book, open.page - 1));
  $('start').addEventListener('click', () => open && show(open.book, 1));
  $('end').addEventListener('click', () => open && show(open.book, open.book.pages));
  $('chapter-prev').addEventListener('click', () => skipChapter(-1));
  $('chapter-next').addEventListener('click', () => skipChapter(1));
  $('next').addEventListener('click', () => open && show(open.book, open.page + 1));
  $('page-slider').addEventListener('input', (e) => open && show(open.book, Number(e.target.value)));
  $('close').addEventListener('click', close);
  for (const id of ['mute', 'mute-reader']) $(id).addEventListener('click', toggleMuted);
  showMuted();
  $('reader').addEventListener('click', (e) => { if (clickedOutsideBook(e)) close(); });
  // The wheel moves the slider while a book is open, and swallows the scroll. Trackpads send many small deltas, so a page turns for every 60 of them
  let wheel = 0;
  $('reader').addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!open) return;
    wheel = Math.sign(wheel) === Math.sign(e.deltaY) ? wheel + e.deltaY : e.deltaY;
    if (Math.abs(wheel) < 60 && Math.abs(e.deltaY) < 60) return;
    // Down goes forth, up goes back
    const page = open.page + Math.sign(wheel);
    wheel = 0;
    if (page >= 1 && page <= open.book.pages) show(open.book, page, false, true);
  }, { passive: false });
  addEventListener('hashchange', fromHash);
  addEventListener('resize', () => { placeLinks(); fitSides(); });
  $('page').addEventListener('load', () => { placeLinks(); fitSides(); });
  addEventListener('keydown', (e) => {
    if (!open) return;
    // Home and End would scroll the grid behind the book, the arrows its sideways overflow
    if (['Home', 'End', 'PageUp', 'PageDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.key === 'Escape') close();
    else if (e.key === 'f' || e.key === 'F') toggleFilter();
    else if (e.key === 'Home') show(open.book, 1);
    else if (e.key === 'End') show(open.book, open.book.pages);
    else if (e.key === 'PageUp') skipChapter(-1);
    else if (e.key === 'PageDown') skipChapter(1);
    else if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') show(open.book, open.page - 1);
    else if (e.key === 'ArrowRight' || e.key === 'c' || e.key === 'C') show(open.book, open.page + 1);
  });
  // The site-only books each have a header button, shown only when the build has the book
  for (const [button, name] of [['about', ABOUT], ['notices', NOTICES]]) {
    const book = data.books.find((b) => b.name === name);
    $(button).hidden = !book;
    if (book) $(button).addEventListener('click', () => show(book, bookmark(book)));
  }
  renderGrid();
  fromHash();
}

main();
