const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const bridge = window.nova;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const island = $('#island');
const ICON_X = '<svg class="s" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const ICON_PLUS = '<svg class="s" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';

const state = {
  hover: false,
  pinned: false,
  moving: false,
  mediaFront: false, // the player showing the media is the window in front
  dragging: false,
  tab: 'media',
  media: { has: false },
  mediaAt: 0,
  vol: null,
  muted: false,
  bright: -1,
  volLockUntil: 0,
  brightLockUntil: 0,
  peekUntil: 0,
  toast: null,
  toastUntil: 0,
  timer: { total: 0, remaining: 0, endAt: 0, running: false },
  dl: { active: false, title: '', tab: false }, // IDM Nova, filled by views/downloads.js
  features: {}, // switches from the Settings window; a missing key means on
  visible: true, // false while hidden (fullscreen app, or hidden from the menu)
  reminderUntil: 0, // a dhikr / du'a / verse card is on screen until then (views/reminders.js)
  reminderSize: [500, 140],
  sceneUntil: 0, // the island is a character (views/scene.js) until then
  focusMode: false,
};
const feat = (key) => state.features[key] !== false;

// Good news: sparkles fly out of the island's edges.
function celebrate(colors = ['#ffd479', '#30d158', '#8ab4ff', '#ff6b9d']) {
  if (!feat('celebrate') || anchor.vertical) return;
  const r = island.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
    // start on the pill's outline, fly outward
    const sx = cx + Math.cos(a) * r.width / 2;
    const sy = cy + Math.sin(a) * r.height / 2;
    const dist = 18 + Math.random() * 34;
    const p = document.createElement('i');
    p.className = 'spark';
    p.style.cssText = `left:${sx}px;top:${sy}px;background:${colors[i % colors.length]};--s:${(3 + Math.random() * 3).toFixed(1)}px`;
    document.body.append(p);
    p.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(.2)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => p.remove();
  }
}

// Things worth telling the user when they come back to the computer (views call note()).
const happenings = [];
function note(icon, text) {
  happenings.push({ at: Date.now(), icon, text });
  if (happenings.length > 40) happenings.shift();
}
let internalDrag = false; // set by the shelf while dragging a file out

// Liquid glass dynamic specular reflection tracking
window.addEventListener('mousemove', (e) => {
  if (typeof feat === 'function' && feat('liquidGlass') === false) return;
  const islandEl = document.getElementById('island');
  if (!islandEl) return;
  const rect = islandEl.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
  islandEl.style.setProperty('--liquid-x', `${Math.max(0, Math.min(100, x)).toFixed(1)}%`);
  islandEl.style.setProperty('--liquid-y', `${Math.max(0, Math.min(100, y)).toFixed(1)}%`);
});

const fmt = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

// ---------------- mode ----------------
const SIZE = { idle: 1, compact: 2, toast: 3, peek: 4, reminder: 4, scene: 4, focus: 5, expanded: 6 };

function timerActive() {
  return state.timer.running || state.timer.remaining > 0;
}

function isQuranPlaying() {
  if (window.quranRadio?.state) {
    return !!(window.quranRadio.state.isRadioMode && window.quranRadio.state.isPlaying);
  }
  return false;
}

function getQuranTrackInfo() {
  if (!window.quranRadio?.state) return null;
  const s = window.quranRadio.state;
  if (!s.isRadioMode) return null;
  const reciter = (typeof window.quranRadio.getReciter === 'function')
    ? window.quranRadio.getReciter()
    : (window.quranRadio.QURAN_RECITERS?.find(r => r.id === s.reciterId) || { name: 'إذاعة القرآن الكريم', shortName: 'القرآن الكريم' });
  const surahs = window.quranRadio.SURAHS_114 || [];
  const surahObj = surahs.find(x => x.id === s.surah) || { name: 'البقرة' };

  const title = s.isLiveStream
    ? `إذاعة ${reciter.name} (بث مباشر 24 ساعة)`
    : `سورة ${surahObj.name} · ${reciter.shortName}`;
  const artist = s.isLiveStream ? 'بث إذاعي مباشر 24 ساعة' : `الآية ${s.ayah}`;
  return { title, artist };
}

// What the compact pill shows, by priority: timer, playing media, a running download.
function compactKind() {
  if (timerActive()) return 'timer';
  if (isQuranPlaying()) return 'media';
  if (feat('mediaPill') && state.media.has && state.media.playing && !state.mediaFront) return 'media';
  if (state.dl.active) return 'dl';
  return '';
}

function currentMode() {
  const now = Date.now();
  // NeuroFocus Command Bar & Single-Step Capsule
  if (state.focusMode && !anchor.vertical) return 'focus';
  // a character scene (adhan, water, focus) owns the island until it ends or is closed
  if (state.sceneUntil > now && !anchor.vertical) return 'scene';
  // a toast with a button (Join) stays under the cursor so it can be clicked
  if (state.toastAction && state.toast && now < state.toastUntil && !state.pinned) return 'toast';
  // a reminder stays put under the cursor so it can be read (hovering pauses it)
  if (state.reminderUntil > now && !state.pinned && !state.dragging) {
    return state.toast && now < state.toastUntil ? 'toast' : 'reminder';
  }
  if (!state.moving && (state.hover || state.pinned || state.dragging)) return 'expanded';
  if (state.toast && now < state.toastUntil) return 'toast';
  if (now < state.peekUntil && !state.mediaFront) return 'peek';
  if (compactKind()) return 'compact';
  return 'idle';
}

let lastMode = '';
function render() {
  const mode = currentMode();
  if (mode !== lastMode) {
    island.classList.toggle('shrinking', !!lastMode && SIZE[mode] < SIZE[lastMode]);
    island.classList.remove('idle', 'compact', 'toast', 'peek', 'reminder', 'scene', 'expanded', 'focus');
    island.classList.add(mode);
    const prev = lastMode;
    lastMode = mode;
    if (typeof positionIsland === 'function') positionIsland();
    if (typeof wake === 'function') wake();
    window.dispatchEvent(new CustomEvent('island:mode', { detail: { mode, prev } }));
  }
  const qActive = isQuranActive();
  const qPlaying = isQuranPlaying();
  const qInfo = qActive ? getQuranTrackInfo() : null;

  island.classList.toggle('has-media', qActive || !!state.media.has);
  island.classList.toggle('playing', qPlaying || (state.media.has && !!state.media.playing && !qActive));
  const kind = compactKind();
  for (const el of [$('.l-compact'), $('.l-vcompact')]) {
    el.classList.toggle('timer', kind === 'timer');
    el.classList.toggle('dl', kind === 'dl');
  }
  const showTitle = kind === 'dl' || (kind === 'media' && feat('mediaTitle'));
  const wide = showTitle;
  if (wide !== island.classList.contains('c-wide')) {
    island.classList.toggle('c-wide', wide);
    if (typeof positionIsland === 'function') positionIsland();
  }
  let activeTitle = '';
  if (showTitle) {
    if (kind === 'dl') {
      activeTitle = state.dl.title;
    } else if (qActive) {
      activeTitle = qInfo ? qInfo.title : 'إذاعة القرآن الكريم';
    } else {
      activeTitle = cleanMediaText(state.media.title);
    }
  }
  setCompactTitle(activeTitle);
  const elCTitle = $('.c-title'); if (elCTitle) elCTitle.hidden = !showTitle;
}

// Title between the art and the equalizer; scrolls back and forth when it doesn't fit.
let cTitle = null;
let fitTimer = null;
function setCompactTitle(text) {
  text = cleanMediaText(text) || '';
  if (text === cTitle) return;
  cTitle = text;
  $('#c-title').textContent = text;
  fitCompactTitle();
}
function fitCompactTitle() {
  const box = $('.c-title');
  box.classList.remove('scroll');
  clearTimeout(fitTimer);
  // measure once the pill has finished morphing to its width
  fitTimer = setTimeout(() => {
    const span = $('#c-title');
    const over = span.scrollWidth - box.clientWidth;
    if (over <= 2 || lastMode !== 'compact') return;
    box.style.setProperty('--dist', `${-over - 12}px`);
    box.style.setProperty('--dur', `${Math.max(5, over / 22 + 3)}s`);
    box.classList.remove('rtl');
    box.classList.add('scroll');
  }, 560);
}
window.addEventListener('island:mode', (e) => {
  if (e.detail.mode === 'compact') fitCompactTitle();
});

// ---------------- hover (main process polls the cursor with hover intent) ----------------
let hoverTimer = null;
bridge.onHover((v) => {
  clearTimeout(hoverTimer);
  if (v) {
    state.hover = true;
    render();
  } else {
    hoverTimer = setTimeout(() => {
      state.hover = false;
      render();
    }, 160);
  }
});

let lastRect = '';
function reportRect() {
  let r = island.getBoundingClientRect();
  // during a scene the card beside the character must take the mouse too
  if (lastMode === 'scene') {
    const c = $('#scene-card').getBoundingClientRect();
    const left = Math.min(r.left, c.left);
    const top = Math.min(r.top, c.top);
    r = { left, top, width: Math.max(r.right, c.right) - left, height: Math.max(r.bottom, c.bottom) - top };
  }
  const rect = { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  const key = JSON.stringify(rect);
  if (key !== lastRect) {
    lastRect = key;
    bridge.setRect(rect);
  }
}
setInterval(reportRect, 50);

bridge.onToggle(() => {
  state.pinned = !state.pinned;
  if (!state.pinned) state.hover = false;
  render();
});

bridge.onFocusToggle?.(() => {
  window.neuroFocus?.toggle();
});

// ---------------- drag to move (docks when dropped at the top edge) ----------------
const NO_DRAG = 'button, input, .slider, .file, .app, .pick, .picker, .clip-item, .shelf-items';
let press = null;
let justMoved = false;

island.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest(NO_DRAG)) return;
  press = { x: e.screenX, y: e.screenY, id: e.pointerId };
});
window.addEventListener('pointermove', (e) => {
  if (!press || state.moving) return;
  if (Math.hypot(e.screenX - press.x, e.screenY - press.y) < 5) return; // drag threshold
  state.moving = true;
  island.setPointerCapture(press.id);
  island.classList.add('moving');
  render();
  bridge.dragStart();
});
function endMove() {
  if (state.moving) {
    state.moving = false;
    state.hover = false;
    justMoved = true;
    setTimeout(() => (justMoved = false), 50);
    island.classList.remove('moving');
    bridge.dragEnd();
    render();
  }
  press = null;
}
window.addEventListener('pointerup', endMove);
island.addEventListener('lostpointercapture', endMove);

// a plain click on the collapsed island opens it (also right after a move)
island.addEventListener('click', (e) => {
  if (!justMoved && lastMode === 'toast' && state.toastAction) {
    const act = state.toastAction;
    state.toastAction = null;
    state.toastUntil = 0;
    render();
    act();
    return;
  }
  if (justMoved || lastMode === 'expanded' || lastMode === 'reminder' || lastMode === 'scene' || e.target.closest(NO_DRAG)) return;
  state.hover = true;
  render();
});

// ---------------- placement inside the window ----------------
// Main sends the pill's anchor (top-center) in window coordinates. Each mode is centered
// on it, then pushed back inside the window, so near the bottom or the sides the island
// opens upward / inward instead of off screen. Sizes mirror style.css.
const SIZE_DIMS = {
  s: { expanded: [520, 260], idle: [220, 30], compact: [280, 30] },
  m: { expanded: [640, 335], idle: [236, 32], compact: [300, 32] },
  l: { expanded: [780, 420], idle: [260, 36], compact: [330, 36] }
};
const DIMS = {
  idle: [236, 32], compact: [300, 32], toast: [340, 34], peek: [400, 78], focus: [620, 76], expanded: [640, 335],
};
const COMPACT_WIDE = 380; // compact with a title (media / download)
const VDIMS = { ...DIMS, idle: [44, 244], compact: [44, 136], toast: [44, 168] };
let anchor = { x: window.innerWidth / 2, y: 8, docked: false, vertical: false, side: 'right' };

function positionIsland() {
  let [w, h] = (anchor.vertical ? VDIMS : DIMS)[lastMode] || DIMS.idle;
  if (lastMode === 'idle' && !anchor.vertical && island.classList.contains('eyes')) {
    const currentSize = state.features?.islandSize || 'm';
    w = currentSize === 's' ? 100 : currentSize === 'l' ? 124 : 112;
  }
  if (lastMode === 'compact' && !anchor.vertical && island.classList.contains('c-wide')) w = COMPACT_WIDE;
  if (lastMode === 'reminder') [w, h] = state.reminderSize;
  if (lastMode === 'focus') {
    const hasTask = island.classList.contains('has-task');
    [w, h] = [620, hasTask ? 125 : 76];
  }
  // in the browser's address bar: a slim pill, or a thin line while the user types there
  if (anchor.addr && !anchor.vertical && (lastMode === 'idle' || lastMode === 'compact')) {
    [w, h] = anchor.addr === 'line' ? [90, 3] : [anchor.sw, anchor.sh];
  }
  if (lastMode === 'scene') {
    // the body on the right, the card on its left: [card 430][gap 22][body 64], kept inside the window
    const CW = 516;
    const left = Math.min(Math.max(anchor.x - CW / 2, 8), window.innerWidth - CW - 8);
    const top = anchor.docked ? 30 : Math.min(Math.max(anchor.y + 22, 10), window.innerHeight - 130);
    island.style.setProperty('--x', `${Math.round(left + CW - 64)}px`);
    island.style.setProperty('--y', `${Math.round(top)}px`);
    const card = $('#scene-card');
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top - 14)}px`;
    wake();
    return;
  }
  const W = window.innerWidth;
  const H = window.innerHeight;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  let x;
  let y;
  if (anchor.vertical) {
    // flush against the screen edge, centered on the anchor, kept inside the window
    x = anchor.side === 'left' ? 0 : W - w;
    y = clamp(anchor.y - h / 2, 4, H - h - 4);
  } else {
    x = clamp(anchor.x - w / 2, 4, W - w - 4);
    y = anchor.docked ? 0 : clamp(anchor.y, 0, H - h - 6);
  }
  island.style.setProperty('--x', `${Math.round(x)}px`);
  island.style.setProperty('--y', `${Math.round(y)}px`);
  wake(); // the glass must follow the island while it slides into place
}

bridge.onAnchor((a) => {
  anchor = a;
  island.classList.toggle('addr-slim', a.addr === 'slim');
  island.classList.toggle('addr-line', a.addr === 'line');
  if (a.addr) {
    island.style.setProperty('--sw', `${a.sw}px`);
    island.style.setProperty('--sh', `${a.sh}px`);
  }
  island.classList.toggle('docked', !!a.docked);
  island.classList.toggle('vertical', !!a.vertical);
  island.classList.toggle('side-left', !!a.vertical && a.side === 'left');
  island.classList.toggle('side-right', !!a.vertical && a.side === 'right');
  positionIsland();
});

island.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (e.target.closest('.apps-grid, .file, input')) return;
  bridge.contextMenu();
});

// ---------------- glass backdrop ----------------
const bd = $('#bd');
const bdCtx = bd.getContext('2d');
const off = document.createElement('canvas');
const offCtx = off.getContext('2d');
let fadeFrames = 0;

function sizeCanvases() {
  [bd, off].forEach((c) => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  });
  bd.style.width = `${window.innerWidth}px`;
  bd.style.height = `${window.innerHeight}px`;
}
sizeCanvases();
window.addEventListener('resize', sizeCanvases);

bridge.onBackdrop((url) => {
  const img = new Image();
  img.onload = () => {
    const { width: w, height: h } = off;
    offCtx.filter = 'none';
    offCtx.drawImage(img, 0, 0, w, h);
    offCtx.filter = 'blur(22px) saturate(180%) brightness(.92)';
    offCtx.drawImage(img, -24, -24, w + 48, h + 48);
    fadeFrames = 10;
    wake(300);
  };
  img.src = url;
});

const segThumb = $('.seg-thumb');
function placeSegThumb() {
  const a = $('.tab.active');
  if (!a) return;
  segThumb.style.width = `${a.offsetWidth}px`;
  segThumb.style.transform = `translateX(${a.offsetLeft}px)`;
}

// The frame loop only runs while something moves: the island morphing, a fresh backdrop
// fading in, or the open island (tab thumb, media progress). Idle, it stops completely.
let frameRunning = false;
let awakeUntil = 0;
function wake(ms = 900) {
  awakeUntil = Math.max(awakeUntil, performance.now() + ms);
  if (!frameRunning) {
    frameRunning = true;
    requestAnimationFrame(frame);
  }
}

function frame() {
  const r = island.getBoundingClientRect();
  bd.style.transform = `translate(${-r.left}px, ${-r.top}px)`;
  if (fadeFrames > 0) {
    bdCtx.globalAlpha = fadeFrames === 1 ? 1 : 0.22;
    bdCtx.drawImage(off, 0, 0);
    fadeFrames--;
  }
  if (lastMode === 'expanded') {
    placeSegThumb();
    tickProgress();
  }
  if (fadeFrames > 0 || lastMode === 'expanded' || state.moving || performance.now() < awakeUntil) {
    requestAnimationFrame(frame);
  } else {
    frameRunning = false;
  }
}

// ---------------- tabs ----------------
let tabHoverTimer = null;
$$('.tab').forEach((btn) => {
  btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  btn.addEventListener('mouseenter', () => {
    clearTimeout(tabHoverTimer);
    tabHoverTimer = setTimeout(() => {
      selectTab(btn.dataset.tab);
    }, 110);
  });
  btn.addEventListener('mouseleave', () => {
    clearTimeout(tabHoverTimer);
  });
});
function selectTab(tab) {
  state.tab = tab;
  $$('.tab').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
  });
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `v-${tab}`));
  placeSegThumb();
  setTimeout(placeSegThumb, 50);
  setTimeout(placeSegThumb, 150);
  window.dispatchEvent(new CustomEvent('island:tab', { detail: { tab } }));
}

// ---------------- clock & compact vertical card (Image 2 reference) ----------------
function tickClock() {
  const d = new Date();
  
  // 1. Clock (e.g. 6:17 AM - AM/PM strictly on right)
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const time = `${hour12}:${minutes} ${ampm}`;
  
  // 2. Authentic Hijri Date via Um Al-Qura with moon sighting adjustment
  // User Requirement: "التاريخ .. الهجري دايما عربي" (Hijri Date is ALWAYS in authentic Arabic script)
  const isAr = (state.features?.appLang || 'ar') === 'ar';
  const hijriDate = new Date(d);
  const adj = Number(state.features?.hijriAdjust) || 0;
  if (adj) hijriDate.setDate(hijriDate.getDate() + adj);

  let hijriStr = '';
  try {
    // Format clearly in authentic Arabic calligraphy: "2 جمادى الآخرة 1448 هـ" (Day first strictly)
    const f = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(hijriDate);
    hijriStr = f.includes('هـ') ? f : `${f} هـ`;
  } catch {
    hijriStr = '2 جمادى الآخرة 1448 هـ';
  }

  // 3. Gregorian Date matching selected language (e.g. الخميس، 12 نوفمبر 2026 / Thursday, Nov 12, 2026)
  const gregStr = isAr
    ? d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Update Compact Card with sub-scaled, colored AM/PM
  const xClock = $('#x-clock');
  if (xClock) {
    xClock.innerHTML = `<span id="x-clock-time" class="c-digits">${hour12}:${minutes}</span><span id="x-clock-ampm" class="c-meridian">${ampm}</span>`;
  }
  const xHijri = $('#x-hijri');
  if (xHijri) {
    xHijri.dir = 'rtl';
    xHijri.innerHTML = `<bdi dir="rtl">${hijriStr}</bdi>`;
  }
  const xDate = $('#x-date');
  if (xDate) {
    xDate.dir = isAr ? 'rtl' : 'ltr';
    xDate.innerHTML = `<bdi dir="${isAr ? 'rtl' : 'ltr'}">${gregStr}</bdi>`;
  }

  const clockCard = $('#clock-card');
  if (clockCard) {
    clockCard.dir = isAr ? 'rtl' : 'ltr';
  }

  // Sync other views if present
  if ($('#i-time')) $('#i-time').innerHTML = `<span class="i-digits">${hour12}:${minutes}</span> <span class="i-meridian">${ampm}</span>`;
    const isArLang = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  const idleDateStr = d.toLocaleDateString(isArLang ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  if ($('#i-date')) $('#i-date').textContent = idleDateStr;
  if ($('#v-time')) $('#v-time').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if ($('#v-day')) $('#v-day').textContent = d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
}
tickClock();
setInterval(tickClock, 1000);

// ---------------- idle pill: rotates clock/weather, CPU/RAM and the next prayer ----------------
let infoSlide = 0;
let slideIntervalTimer = null;
function resetSlideTimer() {
  if (slideIntervalTimer) clearInterval(slideIntervalTimer);
  const sec = (state.features?.slideInterval !== undefined) ? Number(state.features.slideInterval) : 15;
  if (sec <= 0) return; // 0 = fixed slide (no rotation)
  slideIntervalTimer = setInterval(() => {
    if (lastMode !== 'idle') return;
    showSlide(infoSlide + 1);
  }, sec * 1000);
}
resetSlideTimer();

// Shows the n-th slide among those turned on; with all of them off the clock stays.
function showSlide(n) {
  const all = [...$$('.info-slide')];
  let slides = all.filter((s) => !s.hidden && !s.classList.contains('off'));
  if (!slides.length) slides = [all[0]];
  infoSlide = n % slides.length;
  all.forEach((s) => s.classList.toggle('on', s === slides[infoSlide]));
}

bridge.onStats((s) => {
  const set = (id, v) => {
    $(`#i-${id}`).textContent = `${Math.round(v * 100)}%`;
    const bar = $(`#i-${id}-bar`);
    bar.style.width = `${Math.round(v * 100)}%`;
    bar.classList.toggle('warn', v >= 0.7 && v < 0.9);
    bar.classList.toggle('hot', v >= 0.9);
  };
  set('cpu', s.cpu);
  set('ram', s.ram);
  $('#v-cpu').textContent = `${Math.round(s.cpu * 100)}%`;
  $('#v-ram').textContent = `${Math.round(s.ram * 100)}%`;
});

// ---------------- sliders ----------------
function makeSlider(el, { onInput, onCommit } = {}) {
  const fill = el.querySelector('.fill');
  let value = 0;
  let dragging = false;
  const set = (v) => {
    value = Math.max(0, Math.min(1, v));
    fill.style.width = `${value * 100}%`;
    el.setAttribute('aria-valuenow', Math.round(value * 100));
  };
  const at = (e) => {
    const r = el.getBoundingClientRect();
    if (!r.width) return 0;
    const isRtl = window.getComputedStyle(el).direction === 'rtl';
    const ratio = (e.clientX - r.left) / r.width;
    return isRtl ? 1 - ratio : ratio;
  };
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    dragging = true;
    el.classList.add('drag');
    try { el.setPointerCapture(e.pointerId); } catch {}
    set(at(e));
    onInput?.(value);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    e.stopPropagation();
    set(at(e));
    onInput?.(value);
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('drag');
    try { el.releasePointerCapture(e.pointerId); } catch {}
    onCommit?.(value);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  return { set, get dragging() { return dragging; } };
}

function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const wait = ms - (Date.now() - last);
    clearTimeout(timer);
    if (wait <= 0) {
      last = Date.now();
      fn(...args);
    } else {
      timer = setTimeout(() => { last = Date.now(); fn(...args); }, wait);
    }
  };
}

// ---------------- media ----------------
const APP_NAMES = {
  spotify: 'Spotify', chrome: 'Chrome', msedge: 'Edge', firefox: 'Firefox', opera: 'Opera',
  vlc: 'VLC', zunemusic: 'Media Player', microsoftmediaplayer: 'Media Player', applemusic: 'Apple Music',
  brave: 'Brave', telegram: 'Telegram', whatsapp: 'WhatsApp', youtube: 'YouTube',
};
function appName(id) {
  if (!id) return '';
  const raw = id.split('!').pop().split('\\').pop().replace(/\.exe$/i, '');
  // Filter out raw hexadecimal IDs (e.g. 308046B0AF4A3462) or GUIDs
  if (/^[0-9a-fA-F_-]{10,}$/.test(raw) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(raw)) {
    return 'HyperNova';
  }
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  for (const k of Object.keys(APP_NAMES)) if (key.includes(k)) return APP_NAMES[k];
  const cleaned = raw.split('.').pop();
  return /^[0-9a-fA-F_-]{10,}$/.test(cleaned) ? 'HyperNova' : cleaned;
}

function setAccent(r, g, b) {
  document.documentElement.style.setProperty('--accent-rgb', `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`);
}

function setAccentFromImage(img) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 24;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 24, 24);
    const px = ctx.getImageData(0, 0, 24, 24).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) {
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      if (max < 50 || max - min < 30) continue; // skip dark / grey pixels
      const wgt = max - min; // favour saturated pixels
      r += px[i] * wgt; g += px[i + 1] * wgt; b += px[i + 2] * wgt; n += wgt;
    }
    if (!n) return setAccent(220, 220, 230);
    r /= n; g /= n; b /= n;
    const k = 235 / Math.max(r, g, b); // lift so the accent reads on dark glass
    setAccent(Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k));
  } catch {}
}

// Gradient tile with a note, used until (or when) the player provides no artwork.
function placeholderArt(seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const ctx = c.getContext('2d');
  let h = 210;
  for (const ch of seed || '') h = (h * 31 + ch.charCodeAt(0)) % 360;
  const g = ctx.createLinearGradient(0, 0, 160, 160);
  g.addColorStop(0, `hsl(${h}, 70%, 58%)`);
  g.addColorStop(1, `hsl(${(h + 45) % 360}, 65%, 28%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 160, 160);
  ctx.translate(32, 32);
  ctx.scale(4, 4);
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fill(new Path2D('M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z'));
  return c.toDataURL('image/png');
}

function setArt(url) {
  ['#c-art', '#vc-art', '#p-art', '#m-art', '#m-art-glow'].forEach((s) => ($(s).src = url));
  const img = new Image();
  img.onload = () => setAccentFromImage(img);
  img.src = url;
}

function setPlayingUI(playing) {
  const view = $('#v-media');
  view.classList.toggle('playing', playing);
  view.classList.toggle('paused', state.media.has && !playing);
  $$('.eq').forEach((e) => e.classList.toggle('paused', !playing));
}

// True while the user is looking at the player itself (e.g. the YouTube tab in Chrome),
// so the island doesn't repeat what is already on screen.
const BROWSERS = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi'];
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
function isMediaInFront(m) {
  if (!m.has || !m.fgProc) return false;
  const proc = m.fgProc.toLowerCase();
  const appId = (m.app || '').toLowerCase();
  const sameApp = appId.includes(proc) || (proc === 'firefox' && appId === '308046b0af4a39cb');
  if (!sameApp) return false;
  if (!BROWSERS.includes(proc)) return true;
  // browsers: only when the active tab is the one playing
  const title = norm(m.fgTitle);
  return (!!m.title && title.includes(norm(m.title))) || title.includes('youtube');
}

let lastTrack = null;
let hasRealArt = false;

function cleanMediaText(s) {
  if (!s) return '';
  return s.replace(/[\uFFFD?]{2,}/g, '').trim() || s;
}

function isQuranActive() {
  if (window.quranRadio?.state) return !!window.quranRadio.state.isRadioMode;
  try {
    const s = JSON.parse(localStorage.getItem('hypernova_quran_radio_v2') || '{}');
    return !!s.isRadioMode;
  } catch {
    return false;
  }
}

function renderMediaTrack() {
  if (isQuranActive()) return;
  const m = state.media;
  if (!m) return;
  const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  const cleanTitle = cleanMediaText(m.title) || (isAr ? 'مقطع صوتي' : 'Unknown Track');
  const cleanArtist = cleanMediaText(m.artist || m.album || appName(m.app));

  if (m.has) {
    $('#m-title').textContent = $('#p-title').textContent = cleanTitle;
    $('#m-artist').textContent = $('#p-artist').textContent = cleanArtist;
    $('#p-eyebrow').textContent = appName(m.app) ? `Now Playing · ${appName(m.app)}` : (isAr ? 'قيد التشغيل' : 'Now Playing');
  }
  const idleText = isAr ? 'جاهز للعمل' : 'Idle';
  $('#x-app-name').textContent = m.has ? appName(m.app) || (isAr ? 'وسائط' : 'Media') : idleText;
  if (m.thumb) {
    setArt(`data:image/png;base64,${m.thumb}`);
  } else if (m.has) {
    setArt(placeholderArt(cleanTitle + (m.app || '')));
  }
  $('#v-media').classList.toggle('browser-src', m.has && BROWSERS.some((b) => (m.app || '').toLowerCase().includes(b)) && !(m.app || '').toLowerCase().includes('firefox'));
  $('#v-media').classList.toggle('none', !m.has);
  setPlayingUI(!!m.playing);
  $('#m-progress').classList.toggle('hidden', !(m.dur > 0));
}
window.renderMediaTrack = renderMediaTrack;

bridge.onMedia((m) => {
  if (m.error) return;
  const isQuranRadio = isQuranActive();
  if (isQuranRadio) {
    // Keep Quran Radio in foreground without rebuilding DOM or overwriting track info
    handleVolume(m);
    handleBrightness(m);
    render();
    return;
  }
  const lock = state.playLock;
  if (lock && Date.now() < lock.until && m.has && m.playing !== lock.value) {
    m.playing = lock.value;
    m.pos = mediaPos();
  } else if (lock && m.playing === lock.value) {
    state.playLock = null;
  }
  state.media = m;
  state.mediaAt = performance.now();
  state.mediaFront = isMediaInFront(m);

  const cleanTitle = cleanMediaText(m.title);
  const cleanArtist = cleanMediaText(m.artist);
  const key = m.has ? `${cleanTitle}|${cleanArtist}|${m.app}` : null;
  if (key !== lastTrack) {
    if (key && lastTrack && cleanTitle && !state.mediaFront && feat('trackPeek')) {
      state.peekUntil = Date.now() + 3200;
      setTimeout(render, 3300);
    }
    lastTrack = key;
    hasRealArt = false;
    if (key) setArt(placeholderArt(cleanTitle + m.app));
  }
  if (m.thumb) {
    hasRealArt = true;
    setArt(`data:image/png;base64,${m.thumb}`);
  }

  if (m.has) {
    $('#m-title').textContent = $('#p-title').textContent = cleanTitle || 'Unknown';
    const sub = cleanArtist || cleanMediaText(m.album) || appName(m.app);
    $('#m-artist').textContent = $('#p-artist').textContent = sub;
    const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    $('#p-eyebrow').textContent = appName(m.app) ? `Now Playing · ${appName(m.app)}` : (isAr ? 'قيد التشغيل' : 'Now Playing');
  }
  const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  const idleText = isAr ? 'جاهز للعمل' : 'Idle';
  $('#x-app-name').textContent = m.has ? appName(m.app) || (isAr ? 'وسائط' : 'Media') : idleText;
  $('#v-media').classList.toggle('browser-src', m.has && BROWSERS.some((b) => (m.app || '').toLowerCase().includes(b)) && !(m.app || '').toLowerCase().includes('firefox'));
  $('#v-media').classList.toggle('none', !m.has);
  setPlayingUI(!!m.playing);
  $('#m-progress').classList.toggle('hidden', !(m.dur > 0));

  handleVolume(m);
  handleBrightness(m);
  render();
});

function mediaPos() {
  const m = state.media;
  let pos = m.pos || 0;
  if (m.playing) pos += (performance.now() - state.mediaAt) / 1000;
  return Math.min(pos, m.dur || 0);
}

let seekLockUntil = 0;
const seek = makeSlider($('#m-bar'), {
  onInput: (v) => {
    if (window.quranRadio?.state?.isRadioMode) {
      if (window.quranRadio.state.isLiveStream) return;
      const dur = window.quranRadio.primaryAudio?.duration || 0;
      if (dur > 0) {
        const pos = v * dur;
        $('#m-pos').textContent = fmt(pos);
        $('#m-dur').textContent = `-${fmt(Math.max(0, dur - pos))}`;
      }
      return;
    }
    const m = state.media;
    if (!m.has || !(m.dur > 0)) return;
    const pos = v * m.dur;
    $('#m-pos').textContent = fmt(pos);
    $('#m-dur').textContent = `-${fmt(m.dur - pos)}`;
  },
  onCommit: (v) => {
    if (window.quranRadio?.state?.isRadioMode) {
      if (window.quranRadio.state.isLiveStream) return;
      const dur = window.quranRadio.primaryAudio?.duration || 0;
      if (dur > 0 && window.quranRadio.primaryAudio) {
        window.quranRadio.primaryAudio.currentTime = v * dur;
      }
      return;
    }
    const m = state.media;
    if (!m.has || !(m.dur > 0)) return;
    const sec = v * m.dur;
    bridge.mediaCmd(`seek ${sec.toFixed(1)}`);
    state.media.pos = sec;
    state.mediaAt = performance.now();
    seekLockUntil = Date.now() + 1500;
  },
});

function tickProgress() {
  if (window.quranRadio?.state?.isRadioMode) return;
  const m = state.media;
  if (!m.has || !(m.dur > 0)) return;
  const pos = seek.dragging ? parseFloat($('#m-bar').getAttribute('aria-valuenow')) / 100 * m.dur : mediaPos();
  $('#m-pos').textContent = fmt(pos);
  $('#m-dur').textContent = `-${fmt(m.dur - pos)}`;
  if (!seek.dragging && Date.now() > seekLockUntil) seek.set(pos / m.dur);
}

$$('[data-cmd]').forEach((btn) =>
  btn.addEventListener('click', (e) => {
    const cmd = btn.dataset.cmd;
    if (window.quranRadio && window.quranRadio.state && window.quranRadio.state.isRadioMode) {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (cmd === 'toggle') {
        window.quranRadio.togglePlayPause();
      } else if (cmd === 'prev') {
        window.quranRadio.previousAyah();
      } else if (cmd === 'next') {
        window.quranRadio.nextAyah();
      }
      return;
    }
    bridge.mediaCmd(cmd);
    if (cmd === 'toggle' && state.media.has) {
      // optimistic UI; hold it until the player reports the new state (it lags ~0.5 s),
      // otherwise the island morphs back and forth for a moment
      state.media.pos = mediaPos();
      state.mediaAt = performance.now();
      state.media.playing = !state.media.playing;
      state.playLock = { value: state.media.playing, until: Date.now() + 1800 };
      setPlayingUI(state.media.playing);
      render();
    }
  })
);

// ---------------- mini player ----------------
const pipBtn = $('#pip-btn');
function flashError(text) {
  const el = $('#m-artist');
  const prev = el.textContent;
  el.textContent = text;
  el.classList.add('err');
  setTimeout(() => {
    el.classList.remove('err');
    el.textContent = prev;
  }, 3500);
}
pipBtn.addEventListener('click', async () => {
  const m = state.media;
  if (!m.has || pipBtn.classList.contains('busy')) return;
  pipBtn.classList.add('busy');
  const res = await bridge.miniOpen({ app: m.app, title: m.title, pos: mediaPos(), playing: !!m.playing });
  pipBtn.classList.remove('busy');
  if (!res?.ok) {
    flashError(res?.error === 'no-url' ? "Couldn't find this video's YouTube link" : 'Works with YouTube in Chrome, Edge or Brave');
    return;
  }
  state.hover = false;
  state.pinned = false;
  render();
});

// ---------------- volume ----------------
function volIconClass(el, vol, muted) {
  el.classList.toggle('vol-mute', muted || vol === 0);
  el.classList.toggle('vol-low', !muted && vol > 0 && vol < 0.4);
}

const sendVol = throttle((v) => bridge.mediaCmd(`vol ${v.toFixed(3)}`), 60);
function setVolume(v) {
  state.vol = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
  state.muted = false;
  state.volLockUntil = Date.now() + 900;
  volSlider.set(state.vol);
  showVolPct(state.vol, false);
  sendVol(state.vol);
  if (window.quranRadio && window.quranRadio.primaryAudio) {
    try {
      window.quranRadio.state.volume = state.vol;
      window.quranRadio.saveState?.();
      window.quranRadio.primaryAudio.volume = state.vol > 0 ? Math.max(0.85, state.vol) : 0;
      window.quranRadio.primaryAudio.muted = state.vol === 0;
    } catch (e) {}
  }
}
function showVolPct(vol, muted) {
  volIconClass($('.vol'), vol, muted);
  const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  $('#vol-pct').textContent = muted ? (isAr ? 'صامت' : 'Muted') : `${Math.round(vol * 100)}%`;
}
const volSlider = makeSlider($('#vol-slider'), { onInput: setVolume });

$('#vol-btn').addEventListener('click', () => {
  state.muted = !state.muted;
  state.volLockUntil = Date.now() + 900;
  showVolPct(state.vol ?? 0, state.muted);
  bridge.mediaCmd('mute');
  if (window.quranRadio && window.quranRadio.primaryAudio) {
    try {
      window.quranRadio.primaryAudio.muted = state.muted;
    } catch (e) {}
  }
});

island.addEventListener('wheel', (e) => {
  // If user is inside any scrollable container or view, let normal scroll happen freely!
  const isScrollTarget = e.target.closest('.scrollable, .view, .pr-daily-body, .nf-dashboard, .apps-list, .clip-list, .picker-list, .shelf-items, [style*="overflow"], [class*="list"], #v-focus, #v-prayer, #v-apps');
  if (isScrollTarget) return;

  // Only adjust volume if explicitly targeting volume slider, volume button, or HUD
  const isVolTarget = e.target.closest('#vol-btn, #vol-slider, .hud, .m-vol');
  if (!isVolTarget || state.vol === null) return;

  e.preventDefault();
  const perPx = e.deltaMode === 1 ? 0.01 : 0.0003;
  const step = Math.max(-0.05, Math.min(0.05, -e.deltaY * perPx));
  setVolume(state.vol + step);
  if (state.tab !== 'media' || lastMode !== 'expanded') showHud('vol', state.vol, false);
}, { passive: false });

function handleVolume(m) {
  if (typeof m.vol !== 'number') return;
  const locked = Date.now() < state.volLockUntil;
  const changed = state.vol !== null && (Math.abs(m.vol - state.vol) > 0.004 || !!m.muted !== state.muted);
  if (locked) return;
  state.vol = m.vol;
  state.muted = !!m.muted;
  if (!volSlider.dragging) volSlider.set(m.vol);
  showVolPct(m.vol, state.muted);
  if (changed && !(lastMode === 'expanded' && state.tab === 'media')) showHud('vol', m.vol, state.muted);
}

// ---------------- brightness ----------------
const sendBright = throttle((v) => bridge.mediaCmd(`bright ${Math.round(v * 100)}`), 150);
const brightSlider = makeSlider($('#bright-slider'), {
  onInput: (v) => {
    state.bright = Math.round(v * 100);
    state.brightLockUntil = Date.now() + 2500;
    const elBrightVal = $('#bright-val'); if (elBrightVal) elBrightVal.textContent = `${state.bright}%`;
    sendBright(v);
  },
});

function handleBrightness(m) {
  if (typeof m.bright !== 'number') return;
  const elBrightRow = $('#bright-row');
  if (elBrightRow) elBrightRow.hidden = true; // Never clutter telemetry card with brightness slider
  if (m.bright < 0 || Date.now() < state.brightLockUntil) return;
  const changed = state.bright >= 0 && m.bright !== state.bright;
  state.bright = m.bright;
  if (!brightSlider.dragging) brightSlider.set(m.bright / 100);
  $('#bright-val').textContent = `${m.bright}%`;
  if (changed && lastMode !== 'expanded') showHud('bright', m.bright / 100);
}

// ---------------- toasts & HUD ----------------
let toastTimer = null;
// state.toastAction: what a click on the current toast does (set right after showToast)
function showToast(kind, label, value, pct, ms = 3200) {
  state.toastAction = null;
  const t = $('.l-toast');
  t.className = `layer l-toast ${kind}`;
  $('#t-label').textContent = label;
  $('#t-value').textContent = value;
  $('.l-toast .batt b').style.width = `${Math.round((pct ?? 0) * 100)}%`;
  $('.t-bar b').style.width = `${Math.round((pct ?? 0) * 100)}%`;
  // vertical variant
  $('.l-vtoast').className = `layer vlayer l-vtoast ${kind}`;
  $('#vt-value').textContent = kind === 'done' ? 'Done' : value;
  $('.v-bar b').style.height = `${Math.round((pct ?? 0) * 100)}%`;
  state.toast = kind;
  state.toastUntil = Date.now() + ms;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(render, ms + 50);
}

function showHud(kind, value, muted) {
  if (!feat(kind === 'vol' ? 'hudVolume' : 'hudBrightness')) return;
  const pct = muted ? 0 : value;
  showToast(kind, '', muted ? 'Muted' : `${Math.round(value * 100)}%`, pct, 1600);
  if (kind === 'vol') {
    volIconClass($('.l-toast'), value, !!muted);
    volIconClass($('.l-vtoast'), value, !!muted);
  }
}

// ---------------- battery ----------------
if (navigator.getBattery) {
  navigator.getBattery().then((b) => {
    let lowShown = false;
    const pct = () => `${Math.round(b.level * 100)}%`;
    b.addEventListener('chargingchange', () => {
      if (!feat('battery')) return;
      if (b.charging) showToast('charging', 'Charging', pct(), b.level);
      else showToast(b.level <= 0.2 ? 'low' : 'battery', 'On Battery', pct(), b.level);
    });
    b.addEventListener('levelchange', () => {
      if (!b.charging && b.level <= 0.2 && !lowShown && feat('battery')) {
        lowShown = true;
        showToast('low', 'Low Battery', pct(), b.level, 4500);
      }
      if (b.level > 0.2) lowShown = false;
    });
  });
}

// ---------------- file drag & drop (routes to the shelf) ----------------
const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
function endDrop() {
  state.dragging = false;
  island.classList.remove('dropping');
  render();
}
window.addEventListener('dragenter', (e) => {
  // with the Shelf tab switched off the island doesn't take files at all
  if (internalDrag || !hasFiles(e) || !feat('tabShelf')) return;
  e.preventDefault();
  if (!state.dragging) {
    state.dragging = true;
    island.classList.add('dropping');
    selectTab('shelf');
    render();
  }
});
window.addEventListener('dragover', (e) => {
  if (internalDrag || !hasFiles(e) || !feat('tabShelf')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) endDrop();
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files || []);
  endDrop();
  if (internalDrag || !files.length) return;
  if (!bridge.shelf.addFiles(files)) showToast('dl-error', "Couldn't add these files to the shelf", '', 0, 3500);
});
document.addEventListener('pointermove', (e) => {
  if (internalDrag && e.buttons === 0) internalDrag = false;
});

// ---------------- timer ----------------
const RING = 276.46;

function setTimer(min, phase = null) {
  state.timer = { total: min * 60, remaining: min * 60, endAt: 0, running: false, phase };
  island.classList.toggle('focus-on', phase === 'focus');
  island.classList.toggle('break-on', phase === 'break');
  $$('[data-min]').forEach((b) => b.classList.toggle('sel', Number(b.dataset.min) === min));
  drawTimer();
  render();
}

function drawTimer() {
  const t = state.timer;
  const rem = t.running ? Math.max(0, (t.endAt - Date.now()) / 1000) : t.remaining;
  const text = fmt(Math.ceil(rem));
  $('#tm-digits').textContent = text;
  $('#c-time').textContent = $('#vc-time').textContent = text;
  $('#tm-ring').style.strokeDashoffset = t.total ? RING * (1 - rem / t.total) : RING;
  const started = t.remaining > 0 && t.remaining < t.total;
  $('#tm-start').textContent = t.running ? 'Pause' : started ? 'Resume' : 'Start';
  const label = t.phase === 'focus' ? `Focus ${focus.round + 1}` : t.phase === 'break' ? 'Break' : 'Running';
  $('#tm-state').textContent = t.running ? label : started ? 'Paused' : t.total ? 'Ready' : 'Pick a time';
  $('#tm-focus').classList.toggle('sel', !!t.phase);
  $('#tm-reset').disabled = !t.total;
  return rem;
}

// One AudioContext for every sound: Chromium limits how many can be open, so creating one
// per alert made sounds silently stop after a while.
let audioCtx = null;
function playTones(notes, { peak = 0.25, attack = 0.02, decay = 0.35, type = 'sine' } = {}) {
  try {
    if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    for (const [d, f] of notes) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(peak, t0 + d + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + decay);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + decay + 0.05);
    }
  } catch {}
}

function beep() {
  playTones([[0, 880], [0.22, 1108], [0.44, 1318]], { peak: 0.25, decay: 0.35 });
}

$$('[data-min]').forEach((b) => b.addEventListener('click', () => setTimer(Number(b.dataset.min))));

$('#tm-start').addEventListener('click', () => {
  if (!state.timer.total) setTimer(5);
  const t = state.timer;
  if (t.running) {
    t.remaining = Math.max(0, (t.endAt - Date.now()) / 1000);
    t.running = false;
  } else if (t.remaining > 0) {
    t.endAt = Date.now() + t.remaining * 1000;
    t.running = true;
  }
  drawTimer();
  render();
});

// ---- focus sessions: focus, then a break that starts by itself (longer after every 4th) ----
const focus = { round: 0 };
function startPhase(phase) {
  const f = state.features;
  const min = phase === 'focus' ? f.focusMin || 25 : (focus.round % 4 === 0 ? f.longBreakMin || 15 : f.breakMin || 5);
  setTimer(min, phase);
  state.timer.endAt = Date.now() + state.timer.remaining * 1000;
  state.timer.running = true;
  drawTimer();
  render();
  // Nova puts her headband on and opens her laptop
  if (phase === 'focus' && feat('novaFocus')) {
    $('.sc-laptop-time').textContent = `${min}:00`;
    window.playScene?.({
      who: 'nova', props: ['band', 'laptop'], arms: 'type', tone: 'focus', badge: '🎯 Focus',
      title: 'Focus time',
      sub: `<b>${min} min</b> of deep work — reminders stay quiet until it ends`,
      ms: 6000,
    });
  }
}
// while focusing, reminders and other gentle interruptions wait
const focusing = () => state.timer.phase === 'focus' && timerActive();
$('#tm-focus').addEventListener('click', () => {
  if (state.timer.phase) return;
  focus.round = 0;
  startPhase('focus');
});

$('#tm-reset').addEventListener('click', () => {
  focus.round = 0;
  island.classList.remove('focus-on', 'break-on');
  state.timer = { total: 0, remaining: 0, endAt: 0, running: false };
  $$('[data-min]').forEach((b) => b.classList.remove('sel'));
  drawTimer();
  render();
});

setInterval(() => {
  if (!state.timer.running) return;
  const rem = drawTimer();
  if (rem <= 0 && state.timer.phase) {
    const wasFocus = state.timer.phase === 'focus';
    island.classList.add('alert');
    setTimeout(() => island.classList.remove('alert'), 1000);
    if (wasFocus) {
      focus.round++;
      startPhase('break');
      const brk = Math.round(state.timer.total / 60);
      const shown = feat('novaFocus') && window.playScene?.({
        who: 'nova', props: ['band'], arms: 'rest', tone: 'focus', badge: '🎯 Focus',
        title: 'Well done! 🎉',
        sub: `Focus session <b>${focus.round}</b> done · <b>${brk} min</b> break`,
        ms: 8000,
      });
      if (!shown) showToast('done', `Focus ${focus.round} done`, `Break ${brk} min`, 0, 4500);
      celebrate(['#ff6b6b', '#ffd479', '#ff9f0a']);
      playTones([[0, 784], [0.2, 988]], { peak: 0.2, decay: 0.6 });
    } else {
      setTimer(state.features.focusMin || 25, null);
      island.classList.remove('focus-on', 'break-on');
      showToast('done', 'Break over', 'Focus', 0, 9000);
      state.toastAction = () => startPhase('focus');
      beep();
    }
    return;
  }
  if (rem <= 0) {
    state.timer = { total: 0, remaining: 0, endAt: 0, running: false };
    $$('[data-min]').forEach((b) => b.classList.remove('sel'));
    drawTimer();
    showToast('done', 'Timer Done', '', 0, 4000);
    island.classList.add('alert');
    setTimeout(() => island.classList.remove('alert'), 1000);
    beep();
  }
}, 250);

// ---------------- settings ----------------
const TAB_FEATURE = { media: 'tabMedia', apps: 'tabApps', shelf: 'tabShelf', prayer: 'tabPrayer', timer: 'tabTimer', focus: 'tabFocus', system: 'tabSystem' };

// Hide tabs that are switched off (Downloads shows itself only around download activity).
function refreshTabs() {
  let changed = false;
  $$('.tab').forEach((b) => {
    const t = b.dataset.tab;
    const hide = t === 'downloads' ? !state.dl.tab : !feat(TAB_FEATURE[t]);
    if (b.hidden !== hide) {
      b.hidden = hide;
      changed = true;
    }
  });
  if ($(`.tab[data-tab="${state.tab}"]`)?.hidden) {
    const first = [...$$('.tab')].find((b) => !b.hidden);
    if (first) selectTab(first.dataset.tab);
  } else if (changed) {
    placeSegThumb();
  }
}

function applyFeatures(f) {
  state.features = f || {};
  const appLang = state.features.appLang || 'ar';
  if (state.features.themeColor) {
    document.documentElement.style.setProperty('--theme-accent', state.features.themeColor);
    document.documentElement.style.setProperty('--yellow', state.features.themeColor);
  }
  const currentTheme = state.features.islandTheme || 'dark';
  if (state.features.glassOpacity != null) {
    const rawVal = Number(state.features.glassOpacity);
    const isSolid = rawVal >= 105;
    document.body.classList.toggle('solid-opaque', isSolid);
    document.documentElement.classList.toggle('solid-opaque', isSolid);

    if (isSolid) {
      // Solid Opaque Dark Mode (Non-glassy solid background / دارك غامق معتم مش زجاجي)
      document.documentElement.style.setProperty('--glass-opacity', '1.0');
      document.documentElement.style.setProperty('--glass-blur', '0px');
      document.documentElement.style.setProperty('--card', currentTheme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)');
    } else {
      // Liquid Glass Mode (0% to 104%): 0% = ultra-translucent crystal glass, 100% = dense frosted acrylic
      const op = Math.max(0.0, Math.min(1.0, rawVal / 100));
      const islandAlpha = (0.15 + op * 0.80).toFixed(2);
      const cardAlpha = (0.02 + op * 0.12).toFixed(2);
      const glassBlur = Math.round(16 + op * 34);
      document.documentElement.style.setProperty('--glass-opacity', islandAlpha);
      document.documentElement.style.setProperty('--card', currentTheme === 'light' ? `rgba(0, 0, 0, ${cardAlpha})` : `rgba(255, 255, 255, ${cardAlpha})`);
      document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`);
    }
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.body.classList.toggle('theme-light', currentTheme === 'light');
  document.body.classList.toggle('theme-dark', currentTheme === 'dark');
  document.body.classList.toggle('theme-black', currentTheme === 'black');
  const currentSize = state.features.islandSize || 'm';
  const sizeConfig = SIZE_DIMS[currentSize] || SIZE_DIMS.m;
  DIMS.expanded = sizeConfig.expanded;
  DIMS.idle = sizeConfig.idle;
  DIMS.compact = sizeConfig.compact;
  document.body.classList.toggle('size-s', currentSize === 's');
  document.body.classList.toggle('size-m', currentSize === 'm');
  document.body.classList.toggle('size-l', currentSize === 'l');
  document.documentElement.setAttribute('data-size', currentSize);

  const island = document.getElementById('island');
  if (island) {
    island.classList.toggle('no-liquid-glass', state.features.liquidGlass === false);
  }

  // Internationalized tab names & status
  const TAB_LABELS = {
    ar: { media: 'الصوتيات', apps: 'التطبيقات', shelf: 'الرف', prayer: 'الصلاة', timer: 'المؤقت', focus: 'التركيز', system: 'النظام' },
    en: { media: 'Music', apps: 'Apps', shelf: 'Shelf', prayer: 'Prayer', timer: 'Timer', focus: 'Focus', system: 'System' }
  };
  const labels = TAB_LABELS[appLang] || TAB_LABELS.ar;
  $$('.seg .tab[data-tab]').forEach((tab) => {
    const span = tab.querySelector('span');
    const tabKey = tab.dataset.tab;
    if (span && labels[tabKey]) span.textContent = labels[tabKey];
  });
  if (!$('#x-app-name').closest('#island').classList.contains('playing')) {
    $('#x-app-name').textContent = appLang === 'ar' ? 'جاهز للعمل' : 'Ready';
  }
  const emptyTitle = $('#v-media .empty-text-wrap .title');
  const emptySub = $('#v-media .empty-text-wrap .sub');
  if (emptyTitle) emptyTitle.textContent = appLang === 'ar' ? 'لا يوجد مشغل نشط' : 'Nothing playing';
  if (emptySub) emptySub.textContent = appLang === 'ar' ? 'شغّل أي مقطع في سبوتيفاي أو يوتيوب أو أي مشغل وسيظهر هنا تلقائياً.' : 'Play something in Spotify, YouTube or any player and it shows up here.';
  const emptyRadioBtn = document.getElementById('qr-empty-launch-btn');
  if (emptyRadioBtn) {
    const labelSpan = emptyRadioBtn.querySelector('span');
    if (labelSpan) labelSpan.textContent = appLang === 'ar' ? 'تشغيل راديو القرآن الكريم' : 'Play Quran Radio';
    emptyRadioBtn.title = appLang === 'ar' ? 'تشغيل راديو وتلاوة القرآن الكريم' : 'Play Quran Radio & Recitations';
  }
  document.documentElement.lang = appLang;
  document.documentElement.dir = appLang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-feat]').forEach((el) => el.classList.toggle('off', !feat(el.dataset.feat)));
  if ($('.info-slide.on')?.classList.contains('off')) showSlide(0);
  resetSlideTimer();
  refreshTabs();
  render();
  window.dispatchEvent(new CustomEvent('island:features', { detail: state.features }));
}
bridge.onFeatures(applyFeatures);
bridge.onVisibility((v) => { state.visible = !!v; });
bridge.features().then(applyFeatures);
$('#open-settings').addEventListener('click', () => bridge.openSettings());

selectTab('media');
drawTimer();
render();
wake(1500);


// Universal pointerdown hook so any input in the island takes focus immediately
document.addEventListener('pointerdown', (e) => {
  const isInput = e.target.closest('input, textarea, [contenteditable="true"]');
  if (isInput) {
    bridge.focusInput?.(true);
    setTimeout(() => isInput.focus(), 25);
  }
}, true);

// Universal Programmatic Dismiss / Close Functions (User requirement: أي حاجة بتظهر وتختفي تبقى function بتتقفل)
window.closeReminder = () => {
  if (typeof window.hideCard === 'function') window.hideCard();
  state.reminderUntil = 0;
  state.hover = false;
  render();
};
window.closeToast = () => {
  state.toast = null;
  state.toastUntil = 0;
  state.toastAction = null;
  render();
};
window.collapseIsland = () => {
  state.pinned = false;
  state.hover = false;
  state.focusMode = false;
  render();
  bridge.focusInput?.(false);
};
window.closeQuranPopovers = () => {
  document.getElementById('qr-popover-reciters')?.remove();
  document.getElementById('qr-popover-surahs')?.remove();
};
window.closeActivePopup = () => {
  if (document.getElementById('qr-popover-reciters') || document.getElementById('qr-popover-surahs')) {
    window.closeQuranPopovers();
    return true;
  }
  if (state.reminderUntil > Date.now()) {
    window.closeReminder();
    return true;
  }
  if (state.toast && state.toastUntil > Date.now()) {
    window.closeToast();
    return true;
  }
  if (window.neuroFocus?.isOpen?.() || state.focusMode) {
    window.neuroFocus?.hide();
    bridge.focusInput?.(false);
    return true;
  }
  if (state.pinned || state.hover || lastMode === 'expanded') {
    window.collapseIsland();
    return true;
  }
  return false;
};
window.closeCard = window.closeReminder;
window.dismissReminder = window.closeReminder;
window.dismissToast = window.closeToast;
window.dismissActive = window.closeActivePopup;

// Universal Escape key listener
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (window.closeActivePopup()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

bridge.onDistractionDetected?.((item) => {
  const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  if (typeof playScene === 'function') {
    playScene({
      who: 'nova',
      props: ['band', 'laptop'],
      arms: 'type',
      tone: 'focus',
      badge: isAr ? 'قوة قاهرة · DEEP FOCUS' : 'DEEP FOCUS · ACTIVE',
      title: isAr ? 'تنبيه التركيز العميق 🎯' : 'Focus Alert 🎯',
      sub: isAr
        ? `تم تصغير <bdi dir="ltr"><b>${item || 'التطبيق'}</b></bdi> تلقائياً لمنع التشتت.<br>ركّز في مهمتك يا بطل، خطوات صغيرة وتنجز!`
        : `Minimized <bdi dir="ltr"><b>${item || 'App'}</b></bdi> to eliminate distractions.<br>Keep going, you got this!`,
      ms: 7000,
      lang: isAr ? 'ar' : 'en'
    });
  }
});


window.state = state;
window.render = render;
window.selectTab = selectTab;
window.applyFeatures = applyFeatures;
