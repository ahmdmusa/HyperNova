// Apps tab: pinned launcher grid. Add opens the Start menu picker; Edit (or right-click)
// enters edit mode where tiles can be removed (×) and dragged to a new position.
(() => {
  const grid = $('#apps-grid');
  const picker = $('#apps-picker');
  const listEl = $('#apps-list');
  const search = $('#apps-search');
  const addBtn = $('#apps-add');
  const editBtn = $('#apps-edit');
  const hint = $('#apps-hint');
  const MAX_PINNED = 12;
  const SPRING = 'transform .32s cubic-bezier(.3, 1.3, .42, 1)';

  let pinned = [];
  let catalog = null;
  let editing = false;
  let drag = null;

  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';

  const APP_SVGS = {
    terminal: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    explorer: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
    code: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    browser: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    music: '<svg viewBox="0 0 24 24" class="app-svg" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
  };

  function applyFallback(container, name) {
    const n = (name || '').toLowerCase();
    container.classList.add('letter');
    if (n.includes('cmd') || n.includes('terminal') || n.includes('bash') || n.includes('powershell')) {
      container.innerHTML = APP_SVGS.terminal;
    } else if (n.includes('explorer') || n.includes('file') || n.includes('folder')) {
      container.innerHTML = APP_SVGS.explorer;
    } else if (n.includes('code') || n.includes('studio') || n.includes('cursor')) {
      container.innerHTML = APP_SVGS.code;
    } else if (n.includes('chrome') || n.includes('edge') || n.includes('firefox') || n.includes('browser') || n.includes('brave')) {
      container.innerHTML = APP_SVGS.browser;
    } else if (n.includes('whatsapp') || n.includes('telegram') || n.includes('discord') || n.includes('chat') || n.includes('slack')) {
      container.innerHTML = APP_SVGS.chat;
    } else if (n.includes('spotify') || n.includes('music') || n.includes('vlc') || n.includes('player')) {
      container.innerHTML = APP_SVGS.music;
    } else {
      const letter = (name || '?').trim()[0] || '?';
      container.innerHTML = `<span class="letter-badge">${esc(letter)}</span>`;
    }
  }

  function updateBar() {
    const ar = isAr();
    editBtn.textContent = editing ? (ar ? 'تم' : 'Done') : (ar ? 'تعديل' : 'Edit');
    editBtn.classList.toggle('on', editing);
    editBtn.disabled = !pinned.length && !editing;
    addBtn.disabled = pinned.length >= MAX_PINNED;
    addBtn.textContent = ar ? 'إضافة +' : 'Add +';
    hint.textContent = editing
      ? (ar ? 'اسحب للترتيب · × للحذف' : 'Drag to reorder · × to remove')
      : (ar ? `${pinned.length}/${MAX_PINNED} · انقر للفتح` : `${pinned.length}/${MAX_PINNED} · Click to open`);
  }

  function setEditing(on) {
    editing = on;
    grid.classList.toggle('editing', on);
    updateBar();
  }

  function renderGrid() {
    grid.innerHTML = '';
    const ar = isAr();
    if (!pinned.length) {
      grid.innerHTML = `<div class="apps-empty">${ar ? 'لا توجد تطبيقات بعد. انقر على إضافة لتثبيت تطبيقاتك.' : 'No apps yet. Use Add to pin your favourites.'}</div>`;
      grid.classList.toggle('editing', editing);
      updateBar();
      return;
    }
    for (const a of pinned) {
      const b = document.createElement('button');
      b.className = 'app' + (a.isPinned ? ' is-pinned' : '');
      b.dataset.id = a.id;
      b.title = a.name + (a.weeklyCount ? ` (${a.weeklyCount} ${ar ? 'مرات هذا الأسبوع' : 'times this week'})` : '');

      const icoSpan = document.createElement('span');
      icoSpan.className = 'app-ico';

      if (a.icon) {
        const img = document.createElement('img');
        img.src = a.icon;
        img.alt = '';
        img.draggable = false;
        img.onerror = () => {
          img.remove();
          applyFallback(icoSpan, a.name);
        };
        icoSpan.appendChild(img);
      } else {
        applyFallback(icoSpan, a.name);
      }

      if (a.isPinned) {
        const pinSpan = document.createElement('span');
        pinSpan.className = 'app-pin-ico';
        pinSpan.title = ar ? 'مثبت' : 'Pinned';
        pinSpan.textContent = '📌';
        icoSpan.appendChild(pinSpan);
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'app-name';
      nameSpan.textContent = a.name;

      const xSpan = document.createElement('span');
      xSpan.className = 'x';
      xSpan.setAttribute('role', 'button');
      xSpan.setAttribute('aria-label', `Remove ${a.name}`);
      xSpan.innerHTML = ICON_X;

      b.appendChild(icoSpan);
      b.appendChild(nameSpan);
      b.appendChild(xSpan);

      b.addEventListener('click', (e) => {
        if (editing) {
          if (e.target.closest('.x')) bridge.apps.remove(a.id);
          return;
        }
        bridge.apps.launch(a.id);
      });
      grid.append(b);
    }
    grid.classList.toggle('editing', editing);
    updateBar();
  }

  // ---------- drag to reorder (edit mode) ----------
  grid.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.app');
    if (!editing || !el || e.button !== 0 || e.target.closest('.x')) return;
    drag = { el, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    el.setPointerCapture(e.pointerId);
  });

  grid.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { el } = drag;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moved = true;
      el.classList.add('lifted');
    }
    el.style.transform = `translate(${e.clientX - drag.sx}px, ${e.clientY - drag.sy}px)`;

    const tiles = [...grid.querySelectorAll('.app')];
    const target = tiles.find((t) => {
      if (t === el) return false;
      const r = t.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!target) return;

    // FLIP: remember where everything was, move the tile in the DOM, animate the others
    const others = tiles.filter((t) => t !== el);
    const first = new Map(others.map((t) => [t, t.getBoundingClientRect()]));
    const before = { x: el.offsetLeft, y: el.offsetTop };
    const forward = tiles.indexOf(el) < tiles.indexOf(target);
    grid.insertBefore(el, forward ? target.nextSibling : target);
    drag.sx += el.offsetLeft - before.x;
    drag.sy += el.offsetTop - before.y;
    el.style.transform = `translate(${e.clientX - drag.sx}px, ${e.clientY - drag.sy}px)`;
    for (const t of others) {
      const f = first.get(t);
      const r = t.getBoundingClientRect();
      const dx = f.left - r.left;
      const dy = f.top - r.top;
      if (!dx && !dy) continue;
      t.style.transition = 'none';
      t.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        t.style.transition = SPRING;
        t.style.transform = '';
      });
    }
  });

  function endDrag() {
    if (!drag) return;
    const { el, moved } = drag;
    drag = null;
    if (!moved) return;
    el.classList.remove('lifted');
    el.style.transition = SPRING;
    el.style.transform = '';
    setTimeout(() => (el.style.transition = ''), 350);
    const ids = [...grid.querySelectorAll('.app')].map((t) => t.dataset.id);
    pinned = ids.map((id) => pinned.find((p) => p.id === id)).filter(Boolean);
    bridge.apps.reorder(ids);
  }
  grid.addEventListener('pointerup', endDrag);
  grid.addEventListener('pointercancel', endDrag);

  // ---------- picker ----------
  function renderList() {
    if (!catalog) {
      listEl.innerHTML = '<div class="clip-empty">Loading apps…</div>';
      return;
    }
    const q = search.value.trim().toLowerCase();
    const ids = new Set(pinned.map((p) => p.id));
    const items = catalog.filter((a) => !q || a.name.toLowerCase().includes(q)).slice(0, 150);
    listEl.innerHTML = '';
    if (!items.length) listEl.innerHTML = '<div class="clip-empty">No apps found</div>';
    for (const a of items) {
      const b = document.createElement('button');
      const on = ids.has(a.id);
      b.className = `pick${on ? ' on' : ''}`;
      b.title = on ? `Remove ${a.name}` : `Add ${a.name}`;

      const iconWrap = document.createElement('span');
      iconWrap.className = 'ph';
      if (a.icon) {
        const img = document.createElement('img');
        img.src = a.icon;
        img.alt = '';
        img.onerror = () => {
          img.remove();
          applyFallback(iconWrap, a.name);
        };
        iconWrap.appendChild(img);
      } else {
        applyFallback(iconWrap, a.name);
      }

      const label = document.createElement('span');
      label.textContent = a.name;

      b.appendChild(iconWrap);
      b.appendChild(label);
      b.disabled = !on && pinned.length >= MAX_PINNED;
      b.addEventListener('click', () => (on ? bridge.apps.remove(a.id) : bridge.apps.add(a.id)));
      listEl.append(b);
    }
  }

  async function openPicker() {
    setEditing(false);
    picker.hidden = false;
    search.value = '';
    renderList();
    if (!catalog) {
      catalog = await bridge.apps.all();
      renderList();
    }
  }

  function closePicker() {
    if (picker.hidden) return;
    picker.hidden = true;
    search.blur();
    bridge.focusInput(false);
  }

  // the window is not focusable by default; ask for focus only while typing
  search.addEventListener('pointerdown', () => {
    bridge.focusInput(true);
    setTimeout(() => search.focus(), 60);
  });
  search.addEventListener('input', renderList);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePicker();
  });
  $('#apps-done').addEventListener('click', closePicker);

  addBtn.addEventListener('click', openPicker);
  editBtn.addEventListener('click', () => setEditing(!editing));
  grid.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (pinned.length) setEditing(!editing);
  });

  window.addEventListener('island:mode', (e) => {
    if (e.detail.mode !== 'expanded') {
      closePicker();
      setEditing(false);
    }
  });

  window.addEventListener('island:features', (e) => {
    if (e.detail?.appLang) {
      updateBar();
      renderGrid();
    }
  });

  const apply = (list) => {
    pinned = list;
    if (!pinned.length && editing) editing = false;
    if (!drag) renderGrid();
    if (!picker.hidden) renderList();
  };
  bridge.onApps(apply);
  if (bridge.apps?.list) bridge.apps.list().then(apply);

  // ---------- Modern Live Spotlight Search (Image 586d5a6b.jpg reference) ----------
  const liveSearch = $('#apps-live-search');
  const liveClear = $('#apps-live-clear');
  const searchResults = $('#apps-search-results');
  const toolsSection = $('#apps-tools-section');
  const colorHistoryEl = $('#apps-color-history');
  let selectedIdx = 0;
  let pickedColors = [];

  async function ensureCatalog() {
    if (!catalog && bridge.apps?.all) {
      catalog = await bridge.apps.all();
    }
    return catalog || [];
  }

  const TOOL_SVGS = {
    record: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"/></svg>',
    screenshot: '<svg viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    snip_delay: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 3h5"/></svg>',
    color: '<svg viewBox="0 0 24 24"><path d="m19 5-4-4-2 2 4 4 2-2ZM15 7 5 17v4h4L19 11"/></svg>',
    calc: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8v4H8zM9 14h.01M12 14h.01M15 14h.01M9 18h.01M12 18h.01M15 18h.01"/></svg>',
    terminal: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3M13 15h4"/></svg>',
  };

  const QUICK_TOOLS = [
    { id: 'record', btnId: '#tool-btn-record', shortAr: 'مسجل', shortEn: 'Rec', nameAr: 'مسجل الصوت والملاحظات', nameEn: 'Voice & Notes Recorder', keys: 'record notes voice mic recorder تسجيل صوت ملاحظات ريكوردر' },
    { id: 'screenshot', btnId: '#tool-btn-screenshot', shortAr: 'لقطة', shortEn: 'Shot', nameAr: 'لقطة شاشة فورية', nameEn: 'Instant Screenshot', keys: 'screenshot capture snip screen لقطة شاشة تصوير' },
    { id: 'snip_delay', btnId: '#tool-btn-snip-delay', shortAr: 'مؤجل 3ث', shortEn: '3s Snip', nameAr: 'لقطة شاشة مؤجلة (3ث)', nameEn: 'Delayed Snip (3s)', keys: 'delay timer snip 3s screenshot لقطة مؤجلة مؤقت' },
    { id: 'color', btnId: '#tool-btn-color', shortAr: 'ألوان', shortEn: 'Color', nameAr: 'لاقط الألوان', nameEn: 'Color Picker', keys: 'color picker hex rgb eyedropper الوان لون قطارة' },
    { id: 'calc', btnId: '#tool-btn-calc', shortAr: 'حاسبة', shortEn: 'Calc', nameAr: 'الحاسبة', nameEn: 'Calculator', keys: 'calc calculator math حاسبة حساب' },
    { id: 'terminal', btnId: '#tool-btn-terminal', shortAr: 'طرفية', shortEn: 'Term', nameAr: 'الطرفية (PowerShell)', nameEn: 'Terminal / PowerShell', keys: 'terminal powershell cmd wt shell طرفية اوامر' },
  ];

  // Safe recursive-descent arithmetic evaluator (no eval / no Function)
  function evalSafeMath(raw) {
    const cleaned = String(raw || '').trim().replace(/^=\s*/, '').replace(/[,_\s]+/g, '');
    if (!cleaned || cleaned.length > 80 || !/[+\-*/%^()]/.test(cleaned)) return null;
    if (!/^[0-9.+\-*/%^()]+$/.test(cleaned)) return null;
    let pos = 0;
    const peek = () => cleaned[pos];
    const eat = (c) => (cleaned[pos] === c ? (pos++, true) : false);
    function parseExpr() {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = cleaned[pos++];
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }
    function parseTerm() {
      let left = parsePower();
      while (peek() === '*' || peek() === '/' || peek() === '%') {
        const op = cleaned[pos++];
        const right = parsePower();
        if ((op === '/' || op === '%') && right === 0) throw new Error('div0');
        left = op === '*' ? left * right : op === '/' ? left / right : left % right;
      }
      return left;
    }
    function parsePower() {
      const base = parseFactor();
      if (eat('^')) return Math.pow(base, parsePower());
      return base;
    }
    function parseFactor() {
      if (eat('+')) return parseFactor();
      if (eat('-')) return -parseFactor();
      if (eat('(')) {
        const v = parseExpr();
        if (!eat(')')) throw new Error('paren');
        return v;
      }
      const start = pos;
      let dots = 0;
      while (pos < cleaned.length && ((cleaned[pos] >= '0' && cleaned[pos] <= '9') || cleaned[pos] === '.')) {
        if (cleaned[pos] === '.') dots++;
        pos++;
      }
      if (pos === start || dots > 1) throw new Error('num');
      const num = parseFloat(cleaned.slice(start, pos));
      if (!Number.isFinite(num)) throw new Error('nan');
      return num;
    }
    try {
      const val = parseExpr();
      if (pos !== cleaned.length || !Number.isFinite(val)) return null;
      return Math.round(val * 1e8) / 1e8;
    } catch {
      return null;
    }
  }

  function applyToolsLocale() {
    const ar = isAr();
    if (liveSearch) {
      liveSearch.placeholder = ar
        ? 'ابحث عن تطبيق، أداة، أو اكتب عملية حسابية (مثال: 250*1.14)...'
        : 'Search apps, quick tools, or calculate math (e.g. 250*1.14)...';
    }
    const tEl = $('#apps-tools-title');
    const sEl = $('#apps-tools-sub');
    if (tEl) tEl.textContent = ar ? 'أدوات سريعة · Tools' : 'Quick Tools';
    if (sEl) sEl.textContent = ar ? 'Alt+Space بحث فوري' : 'Alt+Space Spotlight';
    QUICK_TOOLS.forEach((t) => {
      const lbl = document.querySelector(`[data-tool-lbl="${t.id}"]`);
      if (lbl) lbl.textContent = ar ? t.shortAr : t.shortEn;
      const btn = $(t.btnId);
      if (btn) btn.title = ar ? t.nameAr : t.nameEn;
    });
  }
  applyToolsLocale();
  window.addEventListener('island:features', applyToolsLocale);

  function updateResultHighlight() {
    const items = [...(searchResults?.querySelectorAll('.live-app-item') || [])];
    if (!items.length) { selectedIdx = 0; return; }
    selectedIdx = Math.max(0, Math.min(selectedIdx, items.length - 1));
    items.forEach((el, idx) => el.classList.toggle('selected', idx === selectedIdx));
    items[selectedIdx]?.scrollIntoView?.({ block: 'nearest' });
  }

  let searchSeq = 0;

  async function onLiveSearch() {
    const seq = ++searchSeq;
    const raw = liveSearch?.value || '';
    const q = raw.trim().toLowerCase();
    if (!liveSearch) return;
    liveClear.hidden = !q;
    selectedIdx = 0;

    if (!q) {
      searchResults.hidden = true;
      searchResults.innerHTML = '';
      toolsSection.hidden = false;
      grid.hidden = false;
      return;
    }

    toolsSection.hidden = true;
    grid.hidden = true;
    searchResults.hidden = false;

    const mathVal = evalSafeMath(raw);
    const matchedTools = QUICK_TOOLS.filter((t) => t.keys.includes(q) || t.nameAr.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q));
    const ar = isAr();

    searchResults.innerHTML = '';

    if (mathVal !== null) {
      const card = document.createElement('div');
      card.id = 'spotlight-math-card';
      card.className = 'live-app-item live-math-item';
      const valStr = String(mathVal);
      card.innerHTML = `
        <span class="live-app-ico live-math-ico">=</span>
        <div class="live-app-info">
          <div class="live-app-name" dir="ltr">= ${esc(valStr)}</div>
          <div class="live-app-sub">${ar ? 'اضغط Enter أو انقر لنسخ الناتج' : 'Press Enter or click to copy result'}</div>
        </div>
        <span class="live-app-arrow">⌘C</span>
      `;
      card.addEventListener('click', () => {
        bridge.copyText?.(valStr);
        window.audioHaptics?.playWoodTap?.();
        if (typeof showToast === 'function') {
          showToast('copied', ar ? 'تم نسخ الناتج' : 'Result Copied', valStr, 0, 2000);
        }
        window.collapseIsland?.();
      });
      searchResults.appendChild(card);
    }

    matchedTools.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'live-app-item';
      item.innerHTML = `
        <span class="live-app-ico live-tool-svg">${TOOL_SVGS[t.id] || ''}</span>
        <div class="live-app-info">
          <div class="live-app-name">${esc(ar ? t.nameAr : t.nameEn)}</div>
          <div class="live-app-sub">${ar ? 'أداة سريعة' : 'Quick Tool'}</div>
        </div>
        <span class="live-app-arrow">→</span>
      `;
      item.addEventListener('click', () => {
        liveSearch.value = '';
        onLiveSearch();
        $(t.btnId)?.click();
      });
      searchResults.appendChild(item);
    });

    if (mathVal !== null || matchedTools.length) {
      updateResultHighlight();
    }

    const allApps = await ensureCatalog();
    if (seq !== searchSeq) return;
    const matched = allApps.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 30);

    if (mathVal === null && !matchedTools.length && !matched.length) {
      searchResults.innerHTML = `<div class="apps-empty">${ar ? 'لا توجد نتائج مطابقة' : 'No matching applications found'}</div>`;
      return;
    }

    matched.forEach((a) => {
      const item = document.createElement('div');
      item.className = 'live-app-item';
      item.innerHTML = `
        <span class="live-app-ico"></span>
        <div class="live-app-info">
          <div class="live-app-name">${esc(a.name)}</div>
          <div class="live-app-sub">${ar ? 'تطبيق نظام' : 'Application'}</div>
        </div>
        <span class="live-app-arrow">→</span>
      `;
      const icoSpan = item.querySelector('.live-app-ico');
      if (a.icon) {
        const img = document.createElement('img');
        img.src = a.icon;
        img.alt = '';
        img.onerror = () => {
          icoSpan.textContent = '';
          applyFallback(icoSpan, a.name);
        };
        icoSpan.appendChild(img);
      } else {
        applyFallback(icoSpan, a.name);
      }

      item.addEventListener('click', () => {
        bridge.apps.launch(a.id);
        liveSearch.value = '';
        onLiveSearch();
        window.collapseIsland?.();
      });
      searchResults.appendChild(item);
    });

    updateResultHighlight();
  }

  liveSearch?.addEventListener('input', onLiveSearch);
  liveSearch?.addEventListener('keydown', (e) => {
    const items = searchResults?.querySelectorAll('.live-app-item');
    if (e.key === 'ArrowDown' && items?.length) {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % items.length;
      updateResultHighlight();
    } else if (e.key === 'ArrowUp' && items?.length) {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      updateResultHighlight();
    } else if (e.key === 'Enter') {
      const active = items?.[selectedIdx] || items?.[0];
      if (active) {
        e.preventDefault();
        active.click();
      }
    } else if (e.key === 'Escape') {
      if (liveSearch.value) {
        e.preventDefault();
        e.stopPropagation();
        liveSearch.value = '';
        onLiveSearch();
      } else {
        window.collapseIsland?.();
      }
    }
  });
  liveSearch?.addEventListener('pointerdown', () => {
    bridge.focusInput?.(true);
    setTimeout(() => liveSearch.focus({ preventScroll: true }), 40);
  });
  liveClear?.addEventListener('click', () => {
    liveSearch.value = '';
    onLiveSearch();
    liveSearch.focus({ preventScroll: true });
  });

  window.addEventListener('island:spotlight', () => {
    applyToolsLocale();
    if (liveSearch) {
      liveSearch.value = '';
      onLiveSearch();
      setTimeout(() => {
        bridge.focusInput?.(true);
        liveSearch.focus({ preventScroll: true });
        liveSearch.select?.();
      }, 45);
    }
  });

  function renderColorSwatches() {
    if (!colorHistoryEl) return;
    if (!pickedColors.length) { colorHistoryEl.hidden = true; return; }
    colorHistoryEl.hidden = false;
    colorHistoryEl.innerHTML = pickedColors.map((hex) => (
      `<button type="button" class="color-swatch-chip" data-hex="${esc(hex)}" title="Copy ${esc(hex)}">` +
      `<i style="background:${esc(hex)}"></i><span dir="ltr">${esc(hex)}</span></button>`
    )).join('');
    colorHistoryEl.querySelectorAll('.color-swatch-chip').forEach((b) => {
      b.addEventListener('click', () => {
        bridge.copyText?.(b.dataset.hex);
        window.audioHaptics?.playWoodTap?.();
        if (typeof showToast === 'function') {
          showToast('copied', isAr() ? 'تم نسخ اللون' : 'Color Copied', b.dataset.hex, 0, 2000);
        }
      });
    });
  }

  // ---------- Quick Tools ----------
  $('#tool-btn-record')?.addEventListener('click', () => {
    window.collapseIsland?.();
    if (window.notchMeetings) {
      window.notchMeetings.start(isAr() ? 'تسجيل ملاحظات' : 'Voice Note');
      window.notchMeetings.toggleDrawer(true);
    }
  });
  $('#tool-btn-screenshot')?.addEventListener('click', async () => {
    window.collapseIsland?.();
    try {
      const res = await bridge.captureScreenshot?.();
      if (res && res.ok) {
        window.showIslandNotification?.({
          app: 'Screenshot',
          title: isAr() ? '📸 تم التقاط الشاشة وحفظها' : '📸 Screenshot Captured',
          message: res.name || (isAr() ? 'تمت الإضافة للرف الذكي والحافظة' : 'Saved to Shelf & Clipboard'),
          ms: 4500,
        });
        return;
      }
    } catch {}
    bridge.shotToShelf?.();
  });
  $('#tool-btn-snip-delay')?.addEventListener('click', async () => {
    window.collapseIsland?.();
    const ar = isAr();
    for (let s = 3; s >= 1; s--) {
      if (typeof showToast === 'function') {
        showToast('snip', ar ? '📸 تصوير بعد...' : '📸 Capturing in...', `${s}s`, 0, 950);
      }
      await new Promise((r) => setTimeout(r, 950));
    }
    window.closeToast?.();
    await new Promise((r) => setTimeout(r, 150));
    try {
      const res = await bridge.captureScreenshot?.();
      if (res && res.ok) {
        window.showIslandNotification?.({
          app: 'Screenshot',
          title: ar ? '⏱️ تم التقاط اللقطة المؤجلة' : '⏱️ Delayed Snip Captured',
          message: res.name || (ar ? 'تمت الإضافة للرف الذكي والحافظة' : 'Saved to Shelf & Clipboard'),
          ms: 4500,
        });
        return;
      }
    } catch {}
    bridge.shotToShelf?.();
  });
  $('#tool-btn-color')?.addEventListener('click', async () => {
    if (typeof window.EyeDropper === 'function') {
      try {
        const res = await new window.EyeDropper().open();
        if (res?.sRGBHex) {
          const hex = res.sRGBHex.toUpperCase();
          bridge.copyText?.(hex);
          pickedColors = [hex, ...pickedColors.filter((c) => c !== hex)].slice(0, 5);
          renderColorSwatches();
          window.showIslandNotification?.({
            app: 'Color Picker',
            title: isAr() ? `🎨 تم نسخ اللون ${hex}` : `🎨 Copied ${hex}`,
            message: isAr() ? 'تم حفظ كود اللون HEX في الحافظة والأدوات' : 'HEX color copied to clipboard & recent swatches',
            ms: 4000,
          });
          return;
        }
      } catch {
        return;
      }
    }
    window.showIslandNotification?.({
      app: 'Color Picker',
      title: isAr() ? '🎨 منتقي الألوان' : '🎨 Color Picker',
      message: isAr() ? 'انسخ كود أي لون HEX/RGB من الحافظة ليظهر تلقائياً' : 'Copy any HEX/RGB color to preview it in the Island',
      ms: 4500,
    });
  });
  $('#tool-btn-calc')?.addEventListener('click', () => {
    bridge.launchTool?.('calc');
    window.collapseIsland?.();
  });
  $('#tool-btn-terminal')?.addEventListener('click', () => {
    bridge.launchTool?.('terminal');
    window.collapseIsland?.();
  });
})();
