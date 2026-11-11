// HyperNova Notch Meeting Notes & HUD Companion (Inspired by Amie & DynamicLake)
// 100% offline & local: detects active conferencing calls via privacy mic sensor,
// provides an in-notch recording HUD, private scratchpad, and single-click Focus tasks sync.
(() => {
  const CONF_PATTERNS = /zoom|teams|slack|meet|webex|discord|skype|chrome|brave|edge/i;
  const STORAGE_PREFIX = 'hypernova-meeting-';
  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';

  let activeMeeting = null;
  let timerInterval = null;
  let isDrawerOpen = false;

  const state = {
    inMeeting: false,
    appName: '',
    title: '',
    startTime: 0,
    elapsedSec: 0,
    notes: '',
    actionItems: [],
  };

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Ensure DOM container for Meeting HUD and Scratchpad Drawer exists
  function ensureDOM() {
    if (document.getElementById('meeting-hud')) return;

    const island = document.getElementById('island');
    if (!island) return;

    // 1. Floating Meeting HUD Pill inside island header/clip
    const hud = document.createElement('div');
    hud.id = 'meeting-hud';
    hud.className = 'meeting-hud-pill';
    hud.hidden = true;
    hud.innerHTML = `
      <div class="m-hud-rec"><span class="m-rec-dot"></span><span id="m-hud-timer">00:00</span></div>
      <div class="m-hud-title" id="m-hud-title">Meeting</div>
      <div class="m-hud-actions">
        <button id="btn-meet-notes" type="button" class="m-hud-btn" title="Open confidential scratchpad">📝 <span data-meet-lbl="notes">Notes</span></button>
        <button id="btn-meet-end" type="button" class="m-hud-btn m-hud-btn-end" title="Finish meeting">⏹️</button>
      </div>
    `;

    // 2. Private In-Island Scratchpad Drawer
    const drawer = document.createElement('div');
    drawer.id = 'meeting-drawer';
    drawer.className = 'meeting-scratchpad-drawer';
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="m-drawer-header">
        <div class="m-drawer-title-row">
          <span class="m-drawer-badge">🔴 <span id="m-drawer-app">Meeting</span></span>
          <span id="m-drawer-timer" class="m-drawer-timer">00:00</span>
          <button id="btn-meet-drawer-close" type="button" class="m-drawer-close-btn" title="Minimize notes">✕</button>
        </div>
      </div>
      <div class="m-drawer-body">
        <textarea id="m-drawer-textarea" placeholder="Jot down private meeting notes here... Type '- [ ]' for action items." spellcheck="false"></textarea>
      </div>
      <div class="m-drawer-footer">
        <div class="m-drawer-actions">
          <button id="btn-meet-sync-tasks" type="button" class="m-drawer-sync-btn" title="Extract and add checklist to Focus tasks">
            ⚡ <span data-meet-lbl="sync">Add Actions to Tasks</span>
          </button>
          <button id="btn-meet-clear" type="button" class="m-drawer-clear-btn" title="Clear notes">🗑️</button>
        </div>
        <span id="m-drawer-status" class="m-drawer-status">Saved locally</span>
      </div>
    `;

    const clip = island.querySelector('.clip') || island;
    clip.appendChild(hud);
    clip.appendChild(drawer);

    // Event listeners
    document.getElementById('btn-meet-notes')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrawer();
    });

    document.getElementById('btn-meet-end')?.addEventListener('click', (e) => {
      e.stopPropagation();
      stopMeeting();
    });

    document.getElementById('btn-meet-drawer-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrawer(false);
    });

    const txt = document.getElementById('m-drawer-textarea');
    txt?.addEventListener('input', () => {
      state.notes = txt.value;
      saveLocalNotes();
      const status = document.getElementById('m-drawer-status');
      if (status) status.textContent = isAr() ? 'تم الحفظ تلقائياً' : 'Saved locally';
    });

    document.getElementById('btn-meet-sync-tasks')?.addEventListener('click', (e) => {
      e.stopPropagation();
      extractAndSyncTasks();
    });

    document.getElementById('btn-meet-clear')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (txt) txt.value = '';
      state.notes = '';
      saveLocalNotes();
    });
  }

  function startMeeting(appName = 'Call', title = '') {
    if (state.inMeeting) return;
    ensureDOM();

    state.inMeeting = true;
    state.appName = appName;
    state.title = title || (isAr() ? `اجتماع ${appName}` : `${appName} Meeting`);
    state.startTime = Date.now();
    state.elapsedSec = 0;
    state.notes = loadLocalNotes() || '';

    // Play tactile wood tap & react with robot
    window.audioHaptics?.playWoodTap();
    window.setNovaMood?.('warrior', 3500);

    const hud = document.getElementById('meeting-hud');
    const hudTitle = document.getElementById('m-hud-title');
    const drawerApp = document.getElementById('m-drawer-app');
    const txt = document.getElementById('m-drawer-textarea');

    if (hud) hud.hidden = false;
    if (hudTitle) hudTitle.textContent = state.title;
    if (drawerApp) drawerApp.textContent = state.title;
    if (txt) txt.value = state.notes;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      state.elapsedSec = Math.floor((Date.now() - state.startTime) / 1000);
      const str = fmtTime(state.elapsedSec);
      const t1 = document.getElementById('m-hud-timer');
      const t2 = document.getElementById('m-drawer-timer');
      if (t1) t1.textContent = str;
      if (t2) t2.textContent = str;
    }, 1000);

    if (typeof showToast === 'function') {
      showToast('meet-start', isAr() ? 'بدأ الاجتماع 🎙️' : 'Meeting Started 🎙️', state.title, 0, 3500);
    }
  }

  function stopMeeting() {
    if (!state.inMeeting) return;
    clearInterval(timerInterval);

    const dur = fmtTime(state.elapsedSec);
    const notesLength = (state.notes || '').trim().length;

    state.inMeeting = false;
    const hud = document.getElementById('meeting-hud');
    if (hud) hud.hidden = true;
    toggleDrawer(false);

    // Chime & celebrate with Nova
    window.audioHaptics?.playCrystalChime(0.25);
    window.setNovaMood?.('celebrate', 4000);

    if (typeof showToast === 'function') {
      const msg = isAr()
        ? `انتهى الاجتماع (${dur}) · تم حفظ الملاحظات (${notesLength} حرف)`
        : `Meeting ended (${dur}) · Notes saved (${notesLength} chars)`;
      showToast('meet-end', isAr() ? 'اكتمل الاجتماع ✅' : 'Meeting Finished ✅', msg, 0, 4500);
    }
  }

  function toggleDrawer(force) {
    ensureDOM();
    const drawer = document.getElementById('meeting-drawer');
    if (!drawer) return;
    isDrawerOpen = typeof force === 'boolean' ? force : !isDrawerOpen;
    drawer.hidden = !isDrawerOpen;
    if (isDrawerOpen) {
      window.audioHaptics?.playWoodTap();
      const txt = document.getElementById('m-drawer-textarea');
      txt?.focus();
    }
  }

  function extractAndSyncTasks() {
    const raw = (state.notes || '').split('\n');
    const items = [];

    for (const line of raw) {
      const clean = line.trim();
      if (!clean) continue;
      // Match markdown checklist '- [ ]', bullets '•', '*', '-', or 'TODO:'
      const m = clean.match(/^(?:-\s*\[\s*\]|\*|\-|•|TODO:|TASK:)\s*(.+)$/i);
      if (m && m[1]) {
        items.push(m[1].trim());
      }
    }

    if (!items.length) {
      // Fallback: if lines exist, take any non-empty line with letters
      for (const line of raw) {
        const clean = line.trim();
        if (clean.length > 3 && !clean.startsWith('#')) {
          items.push(clean);
        }
      }
    }

    if (!items.length) {
      const status = document.getElementById('m-drawer-status');
      if (status) status.textContent = isAr() ? 'لا توجد مهام محددة للاستخراج' : 'No action items found';
      return;
    }

    let count = 0;
    for (const item of items) {
      if (typeof window.addFocusTask === 'function') {
        window.addFocusTask(item);
        count++;
      }
    }

    window.audioHaptics?.playCrystalChime(0.2);
    window.setNovaMood?.('celebrate', 2500);

    const status = document.getElementById('m-drawer-status');
    if (status) {
      status.textContent = isAr()
        ? `تم تصدير ${count} مهام إلى قائمة التركيز بنجاح! 🎯`
        : `Exported ${count} task(s) to Focus successfully! 🎯`;
    }
  }

  function saveLocalNotes() {
    try {
      const key = `${STORAGE_PREFIX}${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(key, state.notes || '');
    } catch {}
  }

  function loadLocalNotes() {
    try {
      const key = `${STORAGE_PREFIX}${new Date().toISOString().slice(0, 10)}`;
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  // Monitor microphone usage via bridge.onPrivacy
  function initPrivacyMonitor() {
    if (typeof bridge?.onPrivacy !== 'function') return;

    bridge.onPrivacy((p) => {
      if (!feat('notchMeetings')) return;
      const micApps = p?.mic || [];
      const confApp = micApps.find((app) => CONF_PATTERNS.test(app));

      if (confApp && !state.inMeeting) {
        startMeeting(confApp);
      } else if (!confApp && state.inMeeting) {
        // Delay stopping by 4 seconds in case mic blips between talk intervals
        setTimeout(() => {
          if (state.inMeeting && !(micApps.some(a => CONF_PATTERNS.test(a)))) {
            stopMeeting();
          }
        }, 4000);
      }
    });
  }

  // Periodic calendar upcoming meeting check (within 1 min)
  function initCalendarMeetingCheck() {
    setInterval(() => {
      if (!feat('notchMeetings') || state.inMeeting) return;
      const meets = typeof window.meetingsToday === 'function' ? window.meetingsToday() : [];
      const now = Date.now();
      for (const m of meets) {
        const start = new Date(m.start).getTime();
        const diffMin = (start - now) / 60000;
        // Meeting is happening right now (within -1 to 2 min)
        if (diffMin >= -1 && diffMin <= 2) {
          startMeeting(m.title || 'Scheduled Meeting');
          break;
        }
      }
    }, 30000);
  }

  // Expose API
  window.notchMeetings = {
    start: startMeeting,
    stop: stopMeeting,
    toggleDrawer,
    extractAndSyncTasks,
    getState: () => ({ ...state })
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureDOM();
    initPrivacyMonitor();
    initCalendarMeetingCheck();
  });
})();
