// Dhikr, du'a and Qur'an reminders: every N minutes a large card for N seconds (Settings).
// Hovering the card pauses its countdown; it waits while the island is open or a toast shows.
(() => {
  const layer = $('.l-reminder');
  const textEl = $('#rm-text');
  const bar = $('.rm-time b');
  const KIND_NAME = { ayah: 'آية', dhikr: 'ذكر', dua: 'دعاء' };
  const KIND_FEATURE = { ayah: 'remindAyah', dhikr: 'remindDhikr', dua: 'remindDua' };
  const WIDTH = 520;
  const V_WIDTH = 340; // docked to a side edge
  const MAX_H = 340;

  const everyMs = () => {
    const rate = state.features.tasbeehPerHour;
    if (typeof rate === 'number' && rate > 0) {
      return Math.max(1, Math.round(60 / rate)) * 60000;
    }
    return (state.features.remindEvery || 5) * 60000;
  };
  // quiet hours may wrap past midnight (23:00 -> 07:00)
  function inQuietHours() {
    const f = state.features;
    if (!f.quietHours) return false;
    const d = new Date();
    const m = d.getHours() * 60 + d.getMinutes();
    const from = f.quietFrom ?? 1380;
    const to = f.quietTo ?? 420;
    return from <= to ? m >= from && m < to : m >= from || m < to;
  }
  const showMs = () => (state.features.remindFor || 30) * 1000;

  // Get current period (morning, evening, day)
  function currentPeriod() {
    if (typeof window.getPrayerPeriod === 'function') {
      try { return window.getPrayerPeriod(); } catch {}
    }
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 4.5 && h < 11.5) return 'morning';
    if (h >= 15.5 && h < 21.5) return 'evening';
    return 'day';
  }

  // Pick 5-7 distinct items for today's pool with daily rotation
  function getDailyPool(fullList, count = 6) {
    if (!fullList || !fullList.length) return [];
    if (fullList.length <= count) return fullList;
    const now = new Date();
    const daySeed = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
    const startIdx = (daySeed * count) % fullList.length;
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(fullList[(startIdx + i) % fullList.length]);
    }
    return selected;
  }

  // Calculate dynamic reading time based on text length (short glanceable 6-10s unless hovered)
  function calculateReadingTime(text, baseConfigMs) {
    const rawWords = (text || '').replace(/[ً-ٰٟۖ-ۭ]/g, '').trim().split(/\s+/).length;
    const calc = Math.round(5000 + rawWords * 220);
    return Math.max(6000, Math.min(10000, Math.max(calc, Math.min(baseConfigMs || 7000, 9000))));
  }

  // Shuffled bag so nothing repeats until every text has been shown once
  let bag = [];
  let last = null;
  let lastBagPeriod = null;
  let lastBagDay = null;

  function draw() {
    const period = currentPeriod();
    const todayStr = new Date().toDateString();

    let sourceList = typeof DAY_REMINDERS !== 'undefined' ? DAY_REMINDERS : REMINDERS;
    let quota = state.features.dailyAdhkarQuota || 7;

    if (period === 'morning' && typeof MORNING_ADHKAR !== 'undefined' && MORNING_ADHKAR.length) {
      sourceList = MORNING_ADHKAR;
      quota = state.features.dailyAdhkarQuota || 7;
    } else if (period === 'evening' && typeof EVENING_ADHKAR !== 'undefined' && EVENING_ADHKAR.length) {
      sourceList = EVENING_ADHKAR;
      quota = state.features.dailyAdhkarQuota || 7;
    } else {
      // Day pool: combine tasbeeh, prophetic duas, and quranic verses based on quotas
      const ayatQuota = state.features.dailyAyatQuota || 3;
      const adhkarQuota = state.features.dailyAdhkarQuota || 7;
      quota = Math.min(sourceList.length, Math.max(4, ayatQuota + adhkarQuota));
    }

    let pool = sourceList.filter((r) => feat(KIND_FEATURE[r.kind]));
    if (!pool.length) pool = sourceList;

    const dailyPool = getDailyPool(pool, quota);

    if (lastBagPeriod !== period || lastBagDay !== todayStr || !bag.length) {
      lastBagPeriod = period;
      lastBagDay = todayStr;
      bag = [...dailyPool].sort(() => Math.random() - 0.5);
      if (bag.length > 1 && bag[0] === last) bag.push(bag.shift());
    }

    last = bag.shift() || dailyPool[0];
    return last;
  }

  // verses get ornate brackets; one inline block so they wrap with the words
  // the Qur'an font draws «،» like a verse-end circle, so commas use the UI font
  const body = (text) => esc(text).replace(/،/g, '<i class="sep">،</i>');
  // a verse number ("٢٨") becomes the verse-end ornament: the Qur'an font draws U+06DD followed
  // by the number as one ornament with the number inside
  const ayahEnds = (html) => html.replace(/(^|\s)([٠-٩]{1,3})(?=\s|$)/g, (_m, sp, n) =>
    `${sp}<i class="an">۝${n}</i>`);
  const isQuran = (item) => item.kind === 'ayah' || item.quran;
  const formatNonQuran = (raw) => {
    const escaped = body(raw);
    if (/\(([^)]+)\)/.test(escaped)) {
      const withSub = escaped.replace(/\(([^)]+)\)/g, '<div class="dhikr-subnote">($1)</div>');
      return `<div class="dhikr-container">${withSub}</div>`;
    }
    return `<span>${escaped}</span>`;
  };
  const words = (item) => (isQuran(item)
    ? `<span><i class="br">﴿</i>${ayahEnds(body(item.text))}<i class="br">﴾</i></span>`
    : formatNonQuran(item.text));

  // size the card to its text
  const measure = document.createElement('div');
  measure.className = 'rm-text rm-measure';
  measure.dir = 'rtl';
  document.body.append(measure);
  // companion cards bring their own (escaped) HTML and use the UI font
  const content = (item) => item.html ?? words(item);
  function fit(item) {
    const w = anchor.vertical ? V_WIDTH : WIDTH;
    if (item.html != null) {
      measure.classList.add('ui');
      measure.style.width = `${w - 56}px`;
      measure.innerHTML = item.html;
      const h = Math.min(MAX_H, Math.max(145, Math.ceil(measure.scrollHeight) + 98));
      measure.classList.remove('ui');
      state.reminderSize = [w, h];
      island.style.setProperty('--rw', `${w}px`);
      island.style.setProperty('--rh', `${h}px`);
      return;
    }
    // diacritics and Qur'anic marks (U+064B–065F, U+0670, U+06D6–06ED) add characters but no width
    const mainOnly = (item.text || '').replace(/\(([^)]+)\)/g, '').trim();
    const len = (mainOnly || item.text).replace(/[ً-ٰٟۖ-ۭ]/g, '').length;
    const fs = len <= 40 ? 30 : len <= 80 ? 26 : 23;
    layer.style.setProperty('--rm-fs', `${fs}px`);
    measure.style.setProperty('--rm-fs', `${fs}px`);
    measure.style.width = `${w - 56}px`;
    measure.innerHTML = words(item);
    // Dynamic height calculation:
    // padding top 18 + head 26 + gaps 12 + measured text + ref margin/height + padding bottom 26 + countdown bar 10
    const refLen = (item.ref || '').length;
    const refH = refLen > 45 ? 44 : refLen > 0 ? 28 : 0;
    const h = Math.min(MAX_H, Math.max(145, Math.ceil(measure.scrollHeight) + 98 + refH));
    state.reminderSize = [w, h];
    island.style.setProperty('--rw', `${w}px`);
    island.style.setProperty('--rh', `${h}px`);
  }

  let total = 0;
  let nextAt = 0;
  let nextEvery = null; // the interval nextAt was counted with
  function schedule() {
    nextEvery = state.features.remindEvery;
    nextAt = Date.now() + everyMs();
  }
  let lastTick = Date.now();

  const FONT = '26px "Nova Quran"';
  const loadFonts = () => document.fonts.load(FONT);
  let fontReady = false;
  loadFonts().then(() => { fontReady = true; });

  function show(item) {
    layer.className = `layer l-reminder ${item.kind}`;
    const english = item.html != null;
    layer.dir = measure.dir = english ? 'ltr' : 'rtl';
    layer.lang = english ? 'en' : 'ar';
    $('#rm-kind').textContent = item.badge || KIND_NAME[item.kind] || '';
    textEl.innerHTML = content(item);
    textEl.classList.toggle('ui', item.html != null);
    $('#rm-ref').textContent = item.ref || '';
    fit(item);
    // first card before the Qur'an font finished loading: measure again once it has
    if (!fontReady) loadFonts().then(() => { fit(item); positionIsland(); });
    total = item.ms || calculateReadingTime(item.text, showMs());
    state.reminderUntil = Date.now() + total;
    bar.style.width = '100%';
    render();
    positionIsland();
  }

  function hide() {
    state.reminderUntil = 0;
    state.hover = false; // don't spring open under the cursor when the card leaves
    schedule();
    render();
  }

  let cardHovered = false;
  layer.addEventListener('mouseenter', () => { cardHovered = true; });
  layer.addEventListener('mouseleave', () => { cardHovered = false; });

  function tick() {
    const now = Date.now();
    const dt = now - lastTick;
    lastTick = now;
    if (state.reminderUntil) {
      if (!feat('reminders') && !previewing) return hide();
      const reading = (state.hover || cardHovered) && (lastMode === 'reminder' || state.reminderUntil > now);
      layer.classList.toggle('paused', reading);
      if (reading) state.reminderUntil += dt;
      if (now >= state.reminderUntil) {
        previewing = false;
        return hide();
      }
      bar.style.width = `${Math.max(0, (state.reminderUntil - now) / total) * 100}%`;
      return;
    }
    if (!feat('reminders')) return;
    if (!nextAt) schedule();
    if (now < nextAt) return;
    // wait for a calm moment: not while hidden, open, being dragged or showing a toast
    if (focusing() || inQuietHours()) return;
    if (window.sceneShowing?.()) return;
    if (!state.visible || lastMode === 'expanded' || state.pinned || state.moving || (state.toast && now < state.toastUntil)) return;
    show(draw());
  }
  setInterval(tick, 250);

  $('#rm-close').addEventListener('click', (e) => {
    e.stopPropagation();
    previewing = false;
    hide();
  });

  // a new interval counts from now
  window.addEventListener('island:features', () => {
    if (nextAt && !state.reminderUntil && state.features.remindEvery !== nextEvery) schedule();
  });

  // other views open the big card for their own messages (welcome back, morning, breaks)
  window.showCard = (item) => {
    previewing = true; // independent of the reminders switch
    state.pinned = false;
    state.hover = false;
    show(item);
  };
  window.cardShowing = () => state.reminderUntil > Date.now();

  // "show one now" from the Settings window works even with reminders switched off
  let previewing = false;
  bridge.onReminderNow(() => {
    previewing = true;
    show(draw());
  });
})();
