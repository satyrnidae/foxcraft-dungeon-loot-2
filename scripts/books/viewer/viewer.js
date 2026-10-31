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

function show(book, page, replace) {
  const useFiltered = book.filteredPages > 0 && filtered;
  $('filter').hidden = book.filteredPages === 0;
  $('filter').textContent = useFiltered ? 'Filtered' : 'Unfiltered';
  $('filter').setAttribute('aria-pressed', String(useFiltered));
  const total = useFiltered ? book.filteredPages : book.pages;
  open = { book, page: Math.min(Math.max(1, page), total) };
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
  setSlider(book.pages, open.page, new Set(useFiltered ? [...book.filteredHeadings, ...book.headings.filter((n) => n > book.filteredPages)] : book.headings));
  $('prev').disabled = open.page <= 1;
  $('next').disabled = open.page >= book.pages;
  $('first').disabled = $('prev').disabled;
  $('last').disabled = $('next').disabled;
  showLinks(book, open.page, filteredHas(open.page));
  for (const n of [open.page - 1, open.page + 1]) {
    if (n >= 1 && n <= book.pages) new Image().src = fileOf(book, pageName(n), filteredHas(n));
  }
  setBookmark(book, open.page);
  const hash = hashOf();
  if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
}

/** Sets the slider to a page and draws a stop for each of the pages, the current one marked. */
function setSlider(total, page, headings = new Set()) {
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
  // A page with a heading gets a mark on a row of its own above the slider
  $('marks').replaceChildren(...[...headings].filter((n) => n <= total).map((n) => {
    const mark = document.createElement('i');
    mark.style.left = total < 2 ? '50%' : `calc(7px + (100% - 14px) * ${(n - 1) / (total - 1)})`;
    mark.title = `Heading on page ${n}`;
    return mark;
  }));
  slider.title = headings.has(page) ? 'Chapter heading on this page' : '';
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

function placeLinks() {
  const img = $('page'), host = $('links');
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
  open = null;
  $('reader').hidden = true;
  if (location.hash) history.pushState(null, '', location.pathname);
}

function fromHash() {
  const m = /^#([^/]+)\/(.+)\/(\d+)$/.exec(decodeURIComponent(location.hash));
  if (!m) { open = null; $('reader').hidden = true; return; }
  const book = data.books.find((b) => b.locale === m[1] && b.name === m[2]);
  if (!book) return;
  show(book, Number(m[3]), true);
}

//endregion

async function main() {
  data = await (await fetch('books.json')).json();
  $('reader-locale').addEventListener('change', (e) => {
    const other = open && data.books.find((b) => b.name === open.book.name && b.locale === e.target.value);
    if (other) show(other, open.page);
  });
  $('search').addEventListener('input', renderGrid);
  $('filter').addEventListener('click', toggleFilter);
  $('prev').addEventListener('click', () => open && show(open.book, open.page - 1));
  $('first').addEventListener('click', () => open && show(open.book, 1));
  $('last').addEventListener('click', () => open && show(open.book, open.book.pages));
  $('next').addEventListener('click', () => open && show(open.book, open.page + 1));
  $('page-slider').addEventListener('input', (e) => open && show(open.book, Number(e.target.value)));
  $('close').addEventListener('click', close);
  $('reader').addEventListener('click', (e) => { if (e.target.classList.contains('stage')) close(); });
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
    if (page >= 1 && page <= open.book.pages) show(open.book, page);
  }, { passive: false });
  addEventListener('hashchange', fromHash);
  addEventListener('resize', placeLinks);
  $('page').addEventListener('load', placeLinks);
  addEventListener('keydown', (e) => {
    if (!open) return;
    // Home and End would scroll the grid behind the book, the arrows its sideways overflow
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.key === 'Escape') close();
    else if (e.key === 'f' || e.key === 'F') toggleFilter();
    else if (e.key === 'Home') show(open.book, 1);
    else if (e.key === 'End') show(open.book, open.book.pages);
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
