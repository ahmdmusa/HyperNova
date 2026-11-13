// HyperNova Notch Meeting Notes, Audio Recorder & HUD Companion (Inspired by Amie & DynamicLake)
// 100% offline & local: detects active conferencing calls via privacy mic sensor,
// provides an in-notch recording HUD, live mic WebAudio recorder, private scratchpad, and single-click Focus tasks sync.
(() => {
  const CONF_PATTERNS = /zoom|teams|slack|meet|webex|discord|skype|chrome|brave|edge/i;
  const STORAGE_PREFIX = 'hypernova-meeting-';
  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';
  const getBridge = () => window.nova || (typeof bridge !== 'undefined' ? bridge : null);

  let activeMeeting = null;
  let timerInterval = null;
  let isDrawerOpen = false;

  // Real microphone recorder state
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let audioBlob = null;
  let audioUrl = null;
  let audioCtx = null;
  let analyser = null;
  let levelRaf = null;
  let recState = 'idle'; // 'idle' | 'recording' | 'paused' | 'recorded'
  let recStopWaiters = [];

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

  function setStatus(msg) {
    const el = document.getElementById('m-drawer-status');
    if (el) el.textContent = msg || '';
  }

  function revokeAudioUrl() {
    if (audioUrl) {
      try { URL.revokeObjectURL(audioUrl); } catch {}
      audioUrl = null;
    }
  }

  function cleanupAudioGraph() {
    if (levelRaf) {
      cancelAnimationFrame(levelRaf);
      levelRaf = null;
    }
    const bar = document.getElementById('m-rec-level');
    if (bar) bar.style.width = '0%';
    if (audioCtx) {
      try { audioCtx.close(); } catch {}
      audioCtx = null;
    }
    analyser = null;
    if (mediaStream) {
      try { mediaStream.getTracks().forEach((tr) => tr.stop()); } catch {}
      mediaStream = null;
    }
  }

  function resetAudioRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch {}
    }
    mediaRecorder = null;
    cleanupAudioGraph();
    audioChunks = [];
    audioBlob = null;
    revokeAudioUrl();
    recState = 'idle';
    const preview = document.getElementById('m-rec-preview');
    if (preview) {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
    applyMeetingLabels();
  }

  function applyMeetingLabels() {
    const ar = isAr();
    const notesLbl = document.querySelector('#btn-meet-notes [data-meet-lbl="notes"]');
    if (notesLbl) notesLbl.textContent = ar ? 'ملاحظات' : 'Notes';
    const notesBtn = document.getElementById('btn-meet-notes');
    if (notesBtn) notesBtn.title = ar ? 'فتح المسجل والملاحظات' : 'Open recorder & notes';
    const endBtn = document.getElementById('btn-meet-end');
    if (endBtn) endBtn.title = ar ? 'إنهاء الجلسة' : 'Finish session';
    const closeBtn = document.getElementById('btn-meet-drawer-close');
    if (closeBtn) closeBtn.title = ar ? 'تصغير للشريط' : 'Minimize to pill';

    const titleInput = document.getElementById('m-title-input');
    if (titleInput) titleInput.placeholder = ar ? 'عنوان التسجيل أو الاجتماع...' : 'Recording or meeting title...';

    const txt = document.getElementById('m-drawer-textarea');
    if (txt) {
      txt.placeholder = ar
        ? "دوّن ملاحظاتك هنا... اكتب '- [ ]' لإضافة مهمة للتركيز"
        : "Jot down private notes here... Type '- [ ]' for action items.";
    }

    const saveLbl = document.querySelector('#btn-meet-save [data-meet-lbl="save"]');
    if (saveLbl) saveLbl.textContent = ar ? 'حفظ' : 'Save';
    const saveBtn = document.getElementById('btn-meet-save');
    if (saveBtn) saveBtn.title = ar ? 'حفظ الصوت والملاحظات في Documents' : 'Save Audio & Notes to Documents';

    const syncLbl = document.querySelector('#btn-meet-sync-tasks [data-meet-lbl="sync"]');
    if (syncLbl) syncLbl.textContent = ar ? 'كمهام' : 'Tasks';
    const syncBtn = document.getElementById('btn-meet-sync-tasks');
    if (syncBtn) syncBtn.title = ar ? 'استخراج وإضافة المهام لقائمة التركيز' : 'Extract action items to Focus tasks';

    const openDirBtn = document.getElementById('btn-meet-open-dir');
    if (openDirBtn) openDirBtn.title = ar ? 'فتح مجلد التسجيلات' : 'Open Recordings folder';
    const clearBtn = document.getElementById('btn-meet-clear');
    if (clearBtn) clearBtn.title = ar ? 'مسح' : 'Clear';

    const recBtn = document.getElementById('btn-rec-mic');
    const pauseBtn = document.getElementById('btn-rec-pause');
    if (recBtn) {
      recBtn.classList.toggle('is-live', recState === 'recording' || recState === 'paused');
      if (recState === 'recording' || recState === 'paused') {
        recBtn.textContent = ar ? '⏹️ إيقاف الميكروفون' : '⏹️ Stop Mic';
      } else if (recState === 'recorded') {
        recBtn.textContent = ar ? '🎙️ إعادة التسجيل' : '🎙️ Re-record';
      } else {
        recBtn.textContent = ar ? '🎙️ بدء التسجيل' : '🎙️ Record Mic';
      }
    }
    if (pauseBtn) {
      pauseBtn.hidden = !(recState === 'recording' || recState === 'paused');
      pauseBtn.textContent = recState === 'paused'
        ? (ar ? '▶ استئناف' : '▶ Resume')
        : (ar ? '⏸ إيقاف مؤقت' : '⏸ Pause');
    }
  }

  function startLevelMeter(stream) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const bar = document.getElementById('m-rec-level');

      const tick = () => {
        if (!analyser || !mediaRecorder || mediaRecorder.state === 'inactive') return;
        if (mediaRecorder.state === 'recording') {
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          const avg = sum / (buf.length || 1);
          const pct = Math.min(100, Math.round((avg / 140) * 100));
          if (bar) bar.style.width = `${pct}%`;
        } else if (bar) {
          bar.style.width = '4%';
        }
        levelRaf = requestAnimationFrame(tick);
      };
      levelRaf = requestAnimationFrame(tick);
    } catch {}
  }

  function stopMicRecorder() {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(audioBlob);
        return;
      }
      recStopWaiters.push(resolve);
      try { mediaRecorder.stop(); } catch { resolve(audioBlob); }
    });
  }

  async function toggleMicRecording() {
    const ar = isAr();
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
      await stopMicRecorder();
      setStatus(ar ? 'اكتمل التسجيل · اضغط حفظ' : 'Recorded · Ready to save');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus(ar ? 'الميكروفون غير مدعوم في هذه البيئة' : 'Microphone recording unavailable');
      return;
    }

    resetAudioRecording();
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunks.push(ev.data);
      };
      mediaRecorder.onstop = () => {
        cleanupAudioGraph();
        if (audioChunks.length) {
          audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
          revokeAudioUrl();
          audioUrl = URL.createObjectURL(audioBlob);
          const preview = document.getElementById('m-rec-preview');
          if (preview) {
            preview.src = audioUrl;
            preview.hidden = false;
          }
          recState = 'recorded';
        } else {
          recState = 'idle';
        }
        applyMeetingLabels();
        const waiters = recStopWaiters.splice(0);
        waiters.forEach((fn) => fn(audioBlob));
      };

      mediaRecorder.start(250);
      recState = 'recording';
      applyMeetingLabels();
      startLevelMeter(mediaStream);
      window.audioHaptics?.playWoodTap?.();
      setStatus(ar ? 'جاري تسجيل الصوت...' : 'Recording microphone...');
    } catch (err) {
      cleanupAudioGraph();
      recState = 'idle';
      applyMeetingLabels();
      setStatus(ar ? 'تعذر الوصول للميكروفون · يمكنك كتابة الملاحظات' : 'Mic access denied · Notes still work');
    }
  }

  function togglePauseRecording() {
    if (!mediaRecorder) return;
    const ar = isAr();
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      recState = 'paused';
      setStatus(ar ? 'تم الإيقاف المؤقت' : 'Recording paused');
    } else if (mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      recState = 'recording';
      setStatus(ar ? 'جاري تسجيل الصوت...' : 'Recording microphone...');
    }
    applyMeetingLabels();
  }

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      if (!blob) return resolve('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || '');
        const idx = res.indexOf(',');
        resolve(idx >= 0 ? res.slice(idx + 1) : '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }

  async function saveRecordingSession() {
    const ar = isAr();
    const b = getBridge();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await stopMicRecorder();
    }
    const notesText = (state.notes || '').trim();
    if (!audioBlob && !notesText) {
      setStatus(ar ? 'سجّل صوتاً أو اكتب ملاحظات أولاً' : 'Record audio or write notes first');
      return;
    }
    setStatus(ar ? 'جاري الحفظ...' : 'Saving...');
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const res = await b?.saveRecording?.({
        title: state.title || (ar ? 'تسجيل ملاحظات' : 'Voice Note'),
        notes: state.notes || '',
        audioBase64,
        ext: 'webm',
      });
      if (res?.ok) {
        window.audioHaptics?.playCrystalChime?.(0.2);
        setStatus(ar ? 'تم الحفظ في Documents و الرف الذكي ✅' : 'Saved to Documents & Shelf ✅');
      } else {
        setStatus(ar ? 'تعذر الحفظ المحلي' : (res?.error || 'Save failed'));
      }
    } catch {
      setStatus(ar ? 'خطأ أثناء الحفظ' : 'Error while saving');
    }
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
      <div class="m-hud-title" id="m-hud-title" dir="auto">Meeting</div>
      <div class="m-hud-actions">
        <button id="btn-meet-notes" type="button" class="m-hud-btn" title="Open recorder & notes">📝 <span data-meet-lbl="notes">Notes</span></button>
        <button id="btn-meet-end" type="button" class="m-hud-btn m-hud-btn-end" title="Finish session">⏹️</button>
      </div>
    `;

    // 2. Private In-Island Recorder & Scratchpad Drawer
    const drawer = document.createElement('div');
    drawer.id = 'meeting-drawer';
    drawer.className = 'meeting-scratchpad-drawer';
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="m-drawer-header">
        <div class="m-drawer-title-row">
          <span class="m-drawer-badge"><span class="m-rec-dot"></span><span id="m-drawer-app" hidden>Meeting</span></span>
          <input id="m-title-input" class="m-title-input" type="text" dir="auto" spellcheck="false" autocomplete="off" />
          <span id="m-drawer-timer" class="m-drawer-timer">00:00</span>
          <button id="btn-meet-drawer-close" type="button" class="m-drawer-close-btn" title="Minimize to pill">✕</button>
        </div>
      </div>
      <div class="m-rec-bar">
        <button id="btn-rec-mic" type="button" class="m-rec-btn m-rec-btn-start">🎙️ Record Mic</button>
        <button id="btn-rec-pause" type="button" class="m-rec-btn" hidden>⏸ Pause</button>
        <div class="m-rec-meter" aria-hidden="true"><b id="m-rec-level"></b></div>
      </div>
      <audio id="m-rec-preview" class="m-rec-preview" controls hidden></audio>
      <div class="m-drawer-body">
        <textarea id="m-drawer-textarea" dir="auto" spellcheck="false"></textarea>
      </div>
      <div class="m-drawer-footer">
        <div class="m-drawer-actions">
          <button id="btn-meet-save" type="button" class="m-drawer-save-btn">💾 <span data-meet-lbl="save">Save</span></button>
          <button id="btn-meet-sync-tasks" type="button" class="m-drawer-sync-btn">⚡ <span data-meet-lbl="sync">Tasks</span></button>
          <button id="btn-meet-open-dir" type="button" class="m-drawer-clear-btn">📂</button>
          <button id="btn-meet-clear" type="button" class="m-drawer-clear-btn">🗑️</button>
        </div>
        <span id="m-drawer-status" class="m-drawer-status"></span>
      </div>
    `;

    const clip = island.querySelector('.clip') || island;
    clip.appendChild(hud);
    clip.appendChild(drawer);

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

    const titleInput = document.getElementById('m-title-input');
    titleInput?.addEventListener('pointerdown', () => getBridge()?.focusInput?.(true));
    titleInput?.addEventListener('input', () => {
      state.title = titleInput.value.trim() || state.appName || 'Meeting';
      const hudTitle = document.getElementById('m-hud-title');
      const drawerApp = document.getElementById('m-drawer-app');
      if (hudTitle) hudTitle.textContent = state.title;
      if (drawerApp) drawerApp.textContent = state.title;
    });

    const txt = document.getElementById('m-drawer-textarea');
    txt?.addEventListener('pointerdown', () => getBridge()?.focusInput?.(true));
    txt?.addEventListener('input', () => {
      state.notes = txt.value;
      saveLocalNotes();
      setStatus(isAr() ? 'تم الحفظ تلقائياً' : 'Saved locally');
    });

    document.getElementById('btn-rec-mic')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMicRecording();
    });
    document.getElementById('btn-rec-pause')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePauseRecording();
    });
    document.getElementById('btn-meet-save')?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveRecordingSession();
    });
    document.getElementById('btn-meet-open-dir')?.addEventListener('click', (e) => {
      e.stopPropagation();
      getBridge()?.openRecordingsDir?.();
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
      resetAudioRecording();
      setStatus(isAr() ? 'تم المسح' : 'Cleared');
    });

    applyMeetingLabels();
  }

  function startMeeting(appName = 'Call', title = '') {
    if (state.inMeeting) return;
    ensureDOM();

    state.inMeeting = true;
    state.appName = appName;
    state.title = title || (CONF_PATTERNS.test(appName)
      ? (isAr() ? `اجتماع ${appName}` : `${appName} Meeting`)
      : appName);
    state.startTime = Date.now();
    state.elapsedSec = 0;
    state.notes = loadLocalNotes() || '';

    window.audioHaptics?.playWoodTap?.();
    window.setMeetingUIState?.(true, isDrawerOpen);

    const hud = document.getElementById('meeting-hud');
    const hudTitle = document.getElementById('m-hud-title');
    const drawerApp = document.getElementById('m-drawer-app');
    const titleInput = document.getElementById('m-title-input');
    const txt = document.getElementById('m-drawer-textarea');

    if (hud) hud.hidden = false;
    if (hudTitle) hudTitle.textContent = state.title;
    if (drawerApp) drawerApp.textContent = state.title;
    if (titleInput) titleInput.value = state.title;
    if (txt) txt.value = state.notes;
    applyMeetingLabels();

    clearInterval(timerInterval);
    const t1 = document.getElementById('m-hud-timer');
    const t2 = document.getElementById('m-drawer-timer');
    if (t1) t1.textContent = '00:00';
    if (t2) t2.textContent = '00:00';

    timerInterval = setInterval(() => {
      state.elapsedSec = Math.floor((Date.now() - state.startTime) / 1000);
      const str = fmtTime(state.elapsedSec);
      const cur1 = document.getElementById('m-hud-timer');
      const cur2 = document.getElementById('m-drawer-timer');
      if (cur1) cur1.textContent = str;
      if (cur2) cur2.textContent = str;
    }, 1000);

    if (!isDrawerOpen) {
      window.setNovaState?.('meeting', 2200);
    }
  }

  async function stopMeeting() {
    if (!state.inMeeting) return;
    clearInterval(timerInterval);
    timerInterval = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await stopMicRecorder();
    }
    cleanupAudioGraph();

    const dur = fmtTime(state.elapsedSec);
    const notesLength = (state.notes || '').trim().length;

    state.inMeeting = false;
    isDrawerOpen = false;
    const hud = document.getElementById('meeting-hud');
    const drawer = document.getElementById('meeting-drawer');
    if (hud) hud.hidden = true;
    if (drawer) drawer.hidden = true;
    resetAudioRecording();
    window.setMeetingUIState?.(false, false);

    window.audioHaptics?.playCrystalChime?.(0.25);
    window.setNovaMood?.('celebrate', 4000);

    if (typeof showToast === 'function') {
      const msg = isAr()
        ? `انتهت الجلسة (${dur}) · تم حفظ الملاحظات (${notesLength} حرف)`
        : `Session ended (${dur}) · Notes saved (${notesLength} chars)`;
      showToast('meet-end', isAr() ? 'اكتملت الجلسة ✅' : 'Session Finished ✅', msg, 0, 4500);
    }
  }

  function toggleDrawer(force) {
    ensureDOM();
    const drawer = document.getElementById('meeting-drawer');
    if (!drawer) return;
    isDrawerOpen = typeof force === 'boolean' ? force : !isDrawerOpen;
    drawer.hidden = !isDrawerOpen;
    if (state.inMeeting || isDrawerOpen) {
      window.setMeetingUIState?.(true, isDrawerOpen);
    }
    if (isDrawerOpen) {
      applyMeetingLabels();
      window.audioHaptics?.playWoodTap?.();
      const b = getBridge();
      b?.focusInput?.(true);
      setTimeout(() => {
        const txt = document.getElementById('m-drawer-textarea');
        txt?.focus({ preventScroll: true });
      }, 60);
    }
  }

  window.addEventListener('island:features', applyMeetingLabels);
  window.addEventListener('island:mode', (e) => {
    if (e.detail?.mode !== 'meeting' && isDrawerOpen) {
      isDrawerOpen = false;
      const drawer = document.getElementById('meeting-drawer');
      if (drawer) drawer.hidden = true;
    }
  });

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
  let latestMicApps = [];
  let stopDebounceTimer = null;
  function initPrivacyMonitor() {
    if (typeof bridge?.onPrivacy !== 'function') return;

    bridge.onPrivacy((p) => {
      if (!feat('notchMeetings')) return;
      latestMicApps = Array.isArray(p?.mic) ? p.mic : [];
      const confApp = latestMicApps.find((app) => CONF_PATTERNS.test(app));

      if (confApp) {
        clearTimeout(stopDebounceTimer);
        stopDebounceTimer = null;
        if (!state.inMeeting) startMeeting(confApp);
      } else if (state.inMeeting && !stopDebounceTimer) {
        // Delay stopping by 4 seconds in case mic blips between talk intervals
        stopDebounceTimer = setTimeout(() => {
          stopDebounceTimer = null;
          if (state.inMeeting && !latestMicApps.some((a) => CONF_PATTERNS.test(a))) {
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
