// ==========================================================================
// NeuroFocus Engine for Nova Island
// ADHD Executive-Function / Single-Step Focus Companion
// ==========================================================================
(() => {
  const bridge = window.nova;
  const STORAGE_KEY = 'neurofocus_state';
  const SETTINGS_KEY = 'neurofocus_settings';

  // Fallback heuristic database for Egyptian Arabic ADHD task decomposition
  const HEURISTIC_TEMPLATES = [
    {
      keywords: ['مذاكر', 'محاضر', 'درس', 'امتحان', 'كتاب', 'اقرأ', 'شابتر'],
      steps: [
        {
          title: 'افتح المحاضرة أو الكتاب على الصفحة الأولى فقط واقرأ الفهرس دقيقتين',
          duration: 5,
          subSteps: ['افتح الملف وضع المؤشر على أول سطر', 'اقرأ العناوين الرئيسية فقط']
        },
        {
          title: 'حدد أول نقطتين أو عنوانين رئيسيين بالقلم أو الهايلايتر',
          duration: 10,
          subSteps: ['علم على النقطة الأولى', 'علم على النقطة الثانية']
        },
        {
          title: 'لخص النقطة الأولى في سطرين بفهمك بدون أي تعقيد',
          duration: 15,
          subSteps: ['اكتب جملة تلخيص واحدة', 'اقرأها للتأكد من المعنى']
        },
        {
          title: 'حل مسألة أو سؤالاً واحداً للتأكد من استيعاب الجزء الأول',
          duration: 10,
          subSteps: ['اختر سؤالاً بسيطاً', 'اكتب حله فوراً']
        }
      ]
    },
    {
      keywords: ['كود', 'برمج', 'مشروع', 'bug', 'feature', 'fix', 'تطبيق', 'كتابة كود', 'electron', 'python', 'react', 'js'],
      steps: [
        {
          title: 'افتح محرر الأكواد والملف المطلوب وتأكد من عمل بيئة التشغيل',
          duration: 3,
          subSteps: ['افتح محرر الأكواد', 'تأكد أن المشروع يعمل بدون خطأ']
        },
        {
          title: 'حدد السطر والدالة المحددة المراد تعديلها فقط وضع تعليق توضيحي',
          duration: 7,
          subSteps: ['ضع تعليق TODO توضيحي', 'حدد المدخلات والمخرجات المطلوبة']
        },
        {
          title: 'اكتب الكود الأساسي البسيط المباشر بدون تعقيد',
          duration: 15,
          subSteps: ['اكتب المنطق المباشر في دالة', 'اطبع النتيجة للتأكد']
        },
        {
          title: 'شغل الاختبار أو البرنامج وتأكد من عدم وجود أخطاء',
          duration: 5,
          subSteps: ['شغل الاختبار', 'تأكد من اختفاء الخطأ']
        }
      ]
    },
    {
      keywords: ['تقرير', 'كتابة', 'ايميل', 'بحث', 'مقال', 'عرض', 'بوربوينت', 'doc', 'word'],
      steps: [
        {
          title: 'افتح مستنداً جديداً فارغاً واكتب العنوان الرئيسي فقط',
          duration: 2,
          subSteps: ['افتح مستند Word أو Docs جديد', 'اكتب العنوان في المنتصف']
        },
        {
          title: 'اكتب 3 عناوين فرعية أساسية بدون الدخول في أي تفاصيل',
          duration: 8,
          subSteps: ['العنوان الأول: المقدمة', 'العنوان الثاني: صلب الموضوع', 'العنوان الثالث: الخلاصة']
        },
        {
          title: 'اكتب أول فقرة تحت العنوان الأول بحرية وبدون تدقيق',
          duration: 15,
          subSteps: ['اكتب 3 أسطر متواصلة', 'لا تقلق بشأن الصياغة حالياً']
        },
        {
          title: 'راجع المسودة سريعاً واحفظ المستند كنسخة مبدئية',
          duration: 5,
          subSteps: ['قراءة سريعة في دقيقتين', 'حفظ الملف باسم واضح']
        }
      ]
    },
    {
      keywords: ['تنظيف', 'ترتيب', 'غرفة', 'مكتب', 'سرير', 'ملابس', 'حاجة', 'شقة'],
      steps: [
        {
          title: 'ارمي أي مناديل أو أوراق أو قمامة ظاهرة فوراً في السلة',
          duration: 2,
          subSteps: ['امسك كيس القمامة', 'اجمع كل ما هو مهمل فوراً']
        },
        {
          title: 'انقل الأكواب أو الأطباق إلى المطبخ مباشرة',
          duration: 5,
          subSteps: ['اجمع الأكواب والأطباق', 'ضعها في حوض المطبخ']
        },
        {
          title: 'رتب سطح المكتب وضع الأغراض الأساسية في أماكنها',
          duration: 10,
          subSteps: ['رتب الأسلاك والأقلام', 'امسح السطح سريعاً']
        }
      ]
    }
  ];

  const UNSTICK_ICEBREAKERS = [
    'فقط افتح المستند أو الملف واكتب سطر العنوان دون أي التزام بالإكمال',
    'اقرأ أول سطرين فقط دون أن تحاول حفظ أو تلخيص أي شيء',
    'قوم اشرب بق مايه وافتح الشباك وخلي البرنامج المطلوب قدامك بس',
    'اكتب كلمة واحدة تصف الخطوة الحالية على ورقة بجانبك',
    'اضبط مؤقتاً لدقيقتين وابدأ بأسهل حركة فيزيائية ممكنة'
  ];

  // Distraction keywords for Deep Focus
  const DISTRACTION_PATTERNS = [
    'youtube', 'facebook', 'twitter', 'x.com', 'instagram', 'tiktok',
    'reddit', 'netflix', 'twitch', 'steam', 'discord'
  ];

  // Default state
  let focusState = {
    task: null, // { id, title, deadline, steps, activeStepIndex, createdAt }
    active: false,
    deepFocus: false,
    pomodoro: {
      running: false,
      mode: 'work', // 'work' | 'break'
      secondsLeft: 25 * 60,
      workDuration: 25 * 60,
      breakDuration: 5 * 60
    },
    unstick: {
      active: false,
      secondsLeft: 120
    },
    history: []
  };

  let focusSettings = {
    pomodoroWork: 25,
    pomodoroBreak: 5,
    deepFocusBlockDistractions: true
  };

  let pomoTimerInterval = null;
  let unstickTimerInterval = null;

  const BACKUP_KEY = STORAGE_KEY + '_bak';
  function loadState() {
    try {
      let s = localStorage.getItem(STORAGE_KEY);
      if (!s) s = localStorage.getItem(BACKUP_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        focusState = { ...focusState, ...parsed };
        // Reset volatile runtime timers
        focusState.unstick = { active: false, secondsLeft: 120 };
        if (focusState.pomodoro) {
          focusState.pomodoro.running = false;
          if (!focusState.pomodoro.secondsLeft) focusState.pomodoro.secondsLeft = 25 * 60;
        }
      }
      const cfg = localStorage.getItem(SETTINGS_KEY);
      if (cfg) {
        const parsedCfg = JSON.parse(cfg);
        delete parsedCfg.geminiApiKey; // purge legacy key
        focusSettings = { ...focusSettings, ...parsedCfg };
      }
    } catch (e) {
      console.warn('[Focus] Failed to load local storage, attempting backup:', e);
      try {
        const bak = localStorage.getItem(BACKUP_KEY);
        if (bak) focusState = { ...focusState, ...JSON.parse(bak) };
      } catch {}
    }
  }

  function saveState() {
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(focusState));
      // Never store API keys in localStorage
      const safeCfg = { ...focusSettings };
      delete safeCfg.geminiApiKey;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeCfg));
    } catch (e) {
      console.warn('[Focus] Failed to save state:', e);
    }
  }

  // Deconstruction engine: Gemini AI with robust offline heuristics fallback
  async function deconstructTask(title, deadline = 'اليوم') {
    title = (title || '').trim();
    if (!title) return null;

    // 1. Try secure BYOK AI Bridge via Electron Main process
    if (bridge?.ai?.breakdown) {
      try {
        const res = await bridge.ai.breakdown(title);
        if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
          return {
            id: 'task_' + Date.now(),
            title,
            deadline,
            steps: res.data.map((st, i) => ({
              id: i + 1,
              title: st.title,
              duration: st.duration || 5,
              completed: false,
              subSteps: [
                { id: 1, text: 'ابدأ بالتحضير الأولي للخطوة', done: false },
                { id: 2, text: 'نفذ الجزء المباشر', done: false }
              ]
            })),
            activeStepIndex: 0,
            createdAt: Date.now()
          };
        } else if (res && !res.ok) {
          console.warn('[Focus] AI breakdown returned error, degrading gracefully:', res.error?.message);
        }
      } catch (aiErr) {
        console.warn('[Focus] AI bridge breakdown error, falling back to heuristics:', aiErr);
      }
    }

    // 2. Offline Heuristics Engine
    const lower = title.toLowerCase();
    let matchedSteps = null;
    for (const tpl of HEURISTIC_TEMPLATES) {
      if (tpl.keywords.some((k) => lower.includes(k))) {
        matchedSteps = tpl.steps;
        break;
      }
    }

    if (!matchedSteps) {
      matchedSteps = [
        {
          title: `افتح الأدوات أو الملفات الخاصة بمهمة "${title}" وضعها أمامك`,
          duration: 3,
          subSteps: ['افتح النافذة أو الملف المطلوب', 'ضع المؤشر جاهزاً للبدء']
        },
        {
          title: 'ابدأ بأول جزء بسيط ومباشر لمدة 10 دقائق بدون أي تشتيت',
          duration: 10,
          subSteps: ['اعمل على الجزئية الأولى فقط', 'تجاهل أي تفكير في الخطوات التالية']
        },
        {
          title: 'راجع ما تم إنجازه وسجل النتيجة لإنهاء المهمة',
          duration: 7,
          subSteps: ['تأكد من حفظ العمل', 'دون النتيجة لتوثيق الإنجاز']
        }
      ];
    }

    return {
      id: 'task_' + Date.now(),
      title,
      deadline,
      steps: matchedSteps.map((s, idx) => ({
        id: idx + 1,
        title: s.title,
        duration: s.duration || 10,
        completed: false,
        subSteps: (s.subSteps || ['ابدأ بالتحضير', 'نفذ المطلوب']).map((sub, sIdx) => ({
          id: sIdx + 1,
          text: sub,
          done: false
        }))
      })),
      activeStepIndex: 0,
      createdAt: Date.now()
    };
  }

  // Audio chimes
  function playSuccessChime() {
    try {
      if (typeof playTones === 'function') {
        playTones([[0, 523.25], [0.15, 659.25], [0.3, 783.99], [0.45, 1046.50]], { peak: 0.3, decay: 0.4 });
      }
    } catch {}
  }

  function playUnstickChime() {
    try {
      if (typeof playTones === 'function') {
        playTones([[0, 440], [0.18, 554.37]], { peak: 0.25, decay: 0.35 });
      }
    } catch {}
  }

  function playSubstepTick() {
    try {
      if (typeof playTones === 'function') {
        playTones([[0, 880]], { peak: 0.15, decay: 0.08 });
      }
    } catch {}
  }

  // UI elements
  let inputBar = null;
  let activeCard = null;
  let omniboxInput = null;
  let heroText = null;
  let progressText = null;
  let deadlineText = null;
  let pomoBadge = null;
  let pomoTime = null;
  let btnPomoToggle = null;
  let substepsContainer = null;
  let btnUnstick = null;
  let unstickText = null;
  let btnCancel = null;
  let btnDone = null;

  function initUI() {
    inputBar = $('#nf-input-bar');
    activeCard = $('#nf-active-card');
    omniboxInput = $('#nf-task-input');
    heroText = $('#nf-step-hero');
    progressText = $('#nf-step-progress');
    deadlineText = $('#nf-step-deadline');
    pomoBadge = $('#nf-pomo-badge');
    pomoTime = $('#nf-pomo-time');
    btnPomoToggle = $('#nf-btn-pomo-toggle');
    substepsContainer = $('#nf-substeps-container');
    btnUnstick = $('#nf-btn-unstick');
    unstickText = $('#nf-unstick-text');
    btnCancel = $('#nf-btn-cancel');
    btnDone = $('#nf-btn-done');

    // Input events
    if (omniboxInput) {
      omniboxInput.addEventListener('focus', () => {
        bridge.focusInput(true);
      });
      omniboxInput.addEventListener('blur', () => {
        bridge.focusInput(false);
      });
      omniboxInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = omniboxInput.value.trim();
          if (!val) return;
          omniboxInput.value = '';
          const task = await deconstructTask(val);
          if (task) {
            focusState.task = task;
            focusState.active = true;
            // Auto start Pomodoro work timer on task start
            startPomodoro();
            saveState();
            updateUI();
            if (typeof render === 'function') render();
            if (typeof celebrate === 'function') celebrate(['#30d158', '#8ab4ff', '#ffd479']);
          }
        } else if (e.key === 'Escape') {
          omniboxInput.blur();
          hideFocusMode();
        }
      });
    }

    // Done button event
    if (btnDone) {
      btnDone.addEventListener('click', (e) => {
        e.stopPropagation();
        completeCurrentStep();
      });
    }

    // Unstick button event
    if (btnUnstick) {
      btnUnstick.addEventListener('click', (e) => {
        e.stopPropagation();
        unstickCurrentStep();
      });
    }

    // Cancel button event
    if (btnCancel) {
      btnCancel.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelCurrentTask();
      });
    }

    // Pomodoro toggle event
    if (btnPomoToggle) {
      btnPomoToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePomodoro();
      });
    }

    // Footer Esc click
    $$('.nf-shortcut-hint').forEach((el) => {
      el.style.cursor = 'pointer';
      el.title = 'اضغط هنا للإخفاء أو مفتاح Esc';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        hideFocusMode();
      });
    });

    if (bridge?.onDistractionDetected) {
      bridge.onDistractionDetected((appTitle) => {
        triggerDistractionAlert(appTitle);
      });
    }

    // Distraction Blocker via Media events
    if (bridge?.onMedia) {
      bridge.onMedia((data) => {
        if (!focusState.deepFocus) return;
        const text = `${data?.title || ''} ${data?.app || ''}`.toLowerCase();
        for (const pattern of DISTRACTION_PATTERNS) {
          if (text.includes(pattern)) {
            triggerDistractionAlert(data.title || pattern);
            break;
          }
        }
      });
    }

    // Dashboard controls & whole box click
    const dashDeepToggle = $('#nf-dash-deep-toggle');
    const deepBox = $('.nf-deep-focus-box');
    function toggleDeep() {
      const next = !dashDeepToggle?.classList.contains('on');
      dashDeepToggle?.classList.toggle('on', next);
      dashDeepToggle?.setAttribute('aria-checked', String(next));
      setDeepFocus(next);
    }
    if (dashDeepToggle) {
      dashDeepToggle.classList.toggle('on', !!focusState.deepFocus);
      dashDeepToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDeep();
      });
    }
    if (deepBox) {
      deepBox.style.cursor = 'pointer';
      deepBox.addEventListener('click', (e) => {
        if (e.target !== dashDeepToggle && !e.target.closest('#nf-dash-deep-toggle')) {
          toggleDeep();
        }
      });
    }

    
    if (omniboxInput) {
      omniboxInput.addEventListener('pointerdown', () => {
        bridge?.focusInput?.(true);
        setTimeout(() => omniboxInput.focus(), 25);
      });
    }

// API Key configuration moved to Settings > Focus (BYOK Architecture)


    // ==========================================
    // NEUROFOCUS ROADMAP SUITE IMPLEMENTATION
    // ==========================================

    // 1. Audio Soundscape Synthesizer (Web Audio API - Brown Noise & Gentle Rain)
    let audioCtx = null;
    let currentNoiseNode = null;

    function stopFocusAudio() {
      if (currentNoiseNode) {
        try { currentNoiseNode.stop(); } catch {}
        try { currentNoiseNode.disconnect(); } catch {}
        currentNoiseNode = null;
      }
    }

    let birdInterval = null;
    function playFocusAudio(type) {
      stopFocusAudio();
      if (birdInterval) { clearInterval(birdInterval); birdInterval = null; }
      if (!type || type === 'none') return;

      try {
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'brown') {
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
          }
        } else if (type === 'rain') {
          let b0 = 0, b1 = 0, b2 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            data[i] = (b0 + b1 + b2 + white * 0.1) * 0.22;
          }
        } else if (type === 'nature' || type === 'fajr') {
          // Soft dawn/nature breeze (filtered warm pink noise)
          let b0 = 0, b1 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.997 * b0 + white * 0.05;
            b1 = 0.99 * b1 + white * 0.06;
            data[i] = (b0 + b1) * 0.2;
          }
          // Periodic gentle bird chirps
          birdInterval = setInterval(() => {
            if (!audioCtx || audioCtx.state !== 'running') return;
            try {
              const osc = audioCtx.createOscillator();
              const oscGain = audioCtx.createGain();
              osc.type = 'sine';
              const baseFreq = type === 'fajr' ? 2400 : 2800;
              osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, audioCtx.currentTime + 0.08);
              osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, audioCtx.currentTime + 0.18);
              oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
              oscGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
              oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
              osc.connect(oscGain);
              oscGain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.28);
            } catch {}
          }, 3500 + Math.random() * 4000);
        } else if (type === 'night') {
          // Quiet night deep ambiance
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.015 * white)) / 1.015;
            data[i] = lastOut * 2.2;
          }
        } else if (type === 'library') {
          // Cozy quiet room acoustics
          let b0 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.995 * b0 + white * 0.04;
            data[i] = b0 * 0.25;
          }
        }

        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'brown' ? 380 : type === 'night' ? 240 : type === 'library' ? 320 : 700;

        const gain = audioCtx.createGain();
        gain.gain.value = type === 'fajr' ? 0.09 : type === 'nature' ? 0.11 : 0.14;

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noiseSource.start();
        currentNoiseNode = noiseSource;
      } catch (err) {
        console.error('[focus] Audio synth error:', err);
      }
    }

    // Bind Sound Picker dropdown & options
    const soundPickerBtn = $('#nf-sound-picker-btn');
    const soundMenu = $('#nf-sound-menu');
    const activeSoundNameEl = $('#nf-active-sound-name');

    if (soundPickerBtn && soundMenu) {
      soundPickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundMenu.hidden = !soundMenu.hidden;
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nf-sound-picker-wrap')) {
          soundMenu.hidden = true;
        }
      });
    }

    const soundOptions = document.querySelectorAll('.nf-sound-option');
    soundOptions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundOptions.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (soundMenu) soundMenu.hidden = true;
        const span = btn.querySelector('span');
        if (activeSoundNameEl && span) {
          activeSoundNameEl.textContent = span.textContent;
        }
        playFocusAudio(btn.dataset.sound);
      });
    });

    // Bind Category Filter Dropdown
    const catFilterSelect = $('#nf-cat-filter-select');
    if (catFilterSelect) {
      catFilterSelect.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value || 'all';
        renderDashboardSteps();
      });
    }

    // 2. The 2-Minute Unstick Rule Button handled in initUI

    // 3. Task Management & Smart Todo in #v-focus
    const dashTaskInput = $('#nf-dash-task-input');
    const btnDecompose = $('#nf-btn-decompose');
    const btnAddTask = $('#nf-btn-add-task');

    function addTaskDirectly(title) {
      if (!title) return;
      if (!focusState.task) {
        focusState.task = {
          title: title,
          steps: [],
          activeStepIndex: 0
        };
      }
      const cat = $('#nf-task-cat-select')?.value || 'work';
      const period = currentPeriodTab === 'weekly' ? 'weekly' : 'daily';
      focusState.task.steps.push({
        id: 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        title: title,
        category: cat,
        period,
        duration: 15,
        completed: false
      });
      saveState();
      updateUI();
      renderDashboardSteps();
    }

    async function handleDashboardTaskSubmit(isDecompose = false) {
      const text = dashTaskInput ? dashTaskInput.value.trim() : '';
      if (!text) return;

      if (isDecompose) {
        if (btnDecompose) {
          btnDecompose.textContent = '⏳ جاري...';
          btnDecompose.disabled = true;
        }
        try {
          const deconstructed = await deconstructTask(text);
          if (!focusState.task) {
            focusState.task = { title: text, steps: [], activeStepIndex: 0 };
          }
          const cat = $('#nf-task-cat-select')?.value || 'work';
          const period = currentPeriodTab === 'weekly' ? 'weekly' : 'daily';
          if (deconstructed && Array.isArray(deconstructed.steps)) {
            deconstructed.steps.forEach((step, idx) => {
              focusState.task.steps.push({
                id: 's-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 5),
                title: step.title,
                category: cat,
                period,
                duration: step.duration || 10,
                completed: false,
                subSteps: step.subSteps || []
              });
            });
            saveState();
            updateUI();
          }
        } catch (err) {
          console.error('[focus] Decompose error:', err);
          addTaskDirectly(text);
        }
        if (btnDecompose) {
          const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
          btnDecompose.textContent = isAr ? '✨ فكك' : '✨ Break Down';
          btnDecompose.disabled = false;
        }
      } else {
        addTaskDirectly(text);
      }

      if (dashTaskInput) dashTaskInput.value = '';
      renderDashboardSteps();
    }

    if (btnAddTask) {
      btnAddTask.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDashboardTaskSubmit(false);
      });
    }

    if (btnDecompose) {
      btnDecompose.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDashboardTaskSubmit(true);
      });
    }

    if (dashTaskInput) {
      dashTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleDashboardTaskSubmit(false);
        }
      });
    }

    // 4. Render Smart Interactive Todo List in Dashboard with Categories
    let currentCategoryFilter = 'all';
    let currentPeriodTab = 'daily';

    const CAT_SVGS = {
      work: '<svg class="nf-cat-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      personal: '<svg class="nf-cat-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      urgent: '<svg class="nf-cat-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      project: '<svg class="nf-cat-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
    };

    const CAT_LABELS_AR = {
      work: '💼 عمل',
      personal: '👤 شخصي',
      urgent: '⚡ عاجل',
      project: '🎯 مشاريع'
    };
    const CAT_LABELS_EN = {
      work: '💼 Work',
      personal: '👤 Personal',
      urgent: '⚡ Urgent',
      project: '🎯 Projects'
    };

    function applyFocusLang(lang) {
      const isAr = (lang || window.state?.features?.appLang || 'ar') === 'ar';
      const vFocus = $('#v-focus');
      if (vFocus) {
        vFocus.dir = isAr ? 'rtl' : 'ltr';
        vFocus.lang = isAr ? 'ar' : 'en';
      }
      
      const uiTitle = $('#nf-ui-title');
      if (uiTitle) uiTitle.textContent = isAr ? 'ركّز' : 'Focus';
      
      const streakEl = $('#nf-dash-streak');
      if (streakEl) streakEl.textContent = isAr ? '🔥 3 أيام' : '🔥 3 Days';
      
      const deepTxt = $('#nf-ui-deep-txt');
      if (deepTxt) deepTxt.textContent = 'Deep Focus';
      
      const deepSwitch = $('#nf-dash-deep-toggle');
      if (deepSwitch) deepSwitch.title = isAr ? 'تفعيل وضع القوة القاهرة لحظر المشتتات' : 'Toggle Deep Focus mode';
      
      // Select
      const select = $('#nf-task-cat-select');
      if (select && select.options.length >= 4) {
        select.options[0].text = isAr ? '💼 عمل' : '💼 Work';
        select.options[1].text = isAr ? '👤 شخصي' : '👤 Personal';
        select.options[2].text = isAr ? '⚡ عاجل' : '⚡ Urgent';
        select.options[3].text = isAr ? '🎯 مشاريع' : '🎯 Projects';
      }

      // Category filter dropdown
      const filterSelect = $('#nf-cat-filter-select');
      if (filterSelect && filterSelect.options.length >= 5) {
        filterSelect.options[0].text = isAr ? '📌 الفئة: الكل' : '📌 Filter: All';
        filterSelect.options[1].text = isAr ? '💼 عمل' : '💼 Work';
        filterSelect.options[2].text = isAr ? '👤 شخصي' : '👤 Personal';
        filterSelect.options[3].text = isAr ? '⚡ عاجل' : '⚡ Urgent';
        filterSelect.options[4].text = isAr ? '🎯 مشاريع' : '🎯 Projects';
      }
      
      // Input
      const input = $('#nf-dash-task-input');
      if (input) input.placeholder = isAr ? 'اكتب مهمتك أو مشروعك هنا...' : 'Write your task or project here...';
      
      // Action buttons
      const btnAdd = $('#nf-btn-add-task'); if (btnAdd) btnAdd.title = isAr ? 'إضافة مهمة' : 'Add task';
      const btnDecomp = $('#nf-btn-decompose');
      if (btnDecomp) {
        btnDecomp.textContent = isAr ? '✨ فكك' : '✨ Break Down';
        btnDecomp.title = isAr ? 'تفكيك المشروع لخطوات ذكية بالذكاء الاصطناعي' : 'Decompose project with AI';
      }
      const btnUnstick = $('#nf-btn-unstick');
      if (btnUnstick) {
        btnUnstick.textContent = isAr ? '⚡ 2د' : '⚡ 2m';
        btnUnstick.title = isAr ? 'ابدأ دقيقتين فقط لكسر التسويف' : 'Start 2 minutes to beat procrastination';
      }
      
      // Period tabs
      const tabDaily = $('#nf-tab-daily'); if (tabDaily) tabDaily.textContent = isAr ? '📅 مهام اليوم' : '📅 Daily Tasks';
      const tabWeekly = $('#nf-tab-weekly'); if (tabWeekly) tabWeekly.textContent = isAr ? '🗓️ مهام الأسبوع' : '🗓️ Weekly Tasks';
      const tabDone = $('#nf-tab-done'); if (tabDone) tabDone.textContent = isAr ? '✅ المكتملة' : '✅ Completed';

      // Category filter dropdown options
      const optAll = $('#nf-opt-all'); if (optAll) optAll.textContent = isAr ? '📌 الفئة: الكل' : '📌 Filter: All';
      const optWork = $('#nf-opt-work'); if (optWork) optWork.textContent = isAr ? '💼 عمل' : '💼 Work';
      const optPersonal = $('#nf-opt-personal'); if (optPersonal) optPersonal.textContent = isAr ? '👤 شخصي' : '👤 Personal';
      const optUrgent = $('#nf-opt-urgent'); if (optUrgent) optUrgent.textContent = isAr ? '⚡ عاجل' : '⚡ Urgent';
      const optProject = $('#nf-opt-project'); if (optProject) optProject.textContent = isAr ? '🎯 مشاريع' : '🎯 Projects';
      
      // Sounds
      const sndNone = $('#snd-none'); if (sndNone) sndNone.textContent = isAr ? 'صامت' : 'Mute';
      const sndNature = $('#snd-nature'); if (sndNature) sndNature.textContent = isAr ? 'طبيعة' : 'Nature';
      const sndFajr = $('#snd-fajr'); if (sndFajr) sndFajr.textContent = isAr ? 'الفجر' : 'Dawn';
      const sndNight = $('#snd-night'); if (sndNight) sndNight.textContent = isAr ? 'سكون الليل' : 'Night Quiet';
      const sndLib = $('#snd-library'); if (sndLib) sndLib.textContent = isAr ? 'مكتبة' : 'Library';
      const sndRain = $('#snd-rain'); if (sndRain) sndRain.textContent = isAr ? 'مطر' : 'Rain';
      const sndBrown = $('#snd-brown'); if (sndBrown) sndBrown.textContent = isAr ? 'بنية' : 'Brown Noise';

      // Sync active sound display text
      const activeOption = document.querySelector('.nf-sound-option.active span');
      const activeDisplay = $('#nf-active-sound-name');
      if (activeDisplay && activeOption) {
        activeDisplay.textContent = activeOption.textContent;
      }

      renderDashboardSteps();
      updateDashboardStats();
    }

    function renderDashboardSteps() {
      const container = $('#nf-dash-steps-list');
      if (!container) return;
      container.innerHTML = '';
      const isAr = (window.state?.features?.appLang || 'ar') === 'ar';

      if (!focusState.task || !focusState.task.steps || !focusState.task.steps.length) {
        focusState.task = {
          title: 'مهام التركيز والإنتاجية',
          activeStepIndex: 0,
          steps: [
            { id: '1', title: 'مراجعة أولويات اليوم وأهداف العمل', category: 'work', period: 'daily', completed: true },
            { id: '2', title: 'إنجاز التقرير الفني لـ HyperNova', category: 'work', period: 'daily', completed: false },
            { id: '3', title: 'جلسة تركيز عميق لمدة 25 دقيقة', category: 'urgent', period: 'daily', completed: false },
            { id: '4', title: 'شرب كوب ماء والراحة دقيقتين', category: 'personal', period: 'daily', completed: false },
            { id: '5', title: 'مراجعة المهام الأسبوعية وتخطيط المشاريع', category: 'project', period: 'weekly', completed: false },
            { id: '6', title: 'تطوير واختبار ميزات HyperNova الجديدة', category: 'work', period: 'weekly', completed: false },
            { id: '7', title: 'قراءة ورد القرآن وتدبر الآيات الكريمة', category: 'personal', period: 'weekly', completed: false }
          ]
        };
        saveState();
      }

      // Filter steps by category and period tab
      const visibleSteps = focusState.task.steps
        .map((st, idx) => ({ ...st, originalIdx: idx }))
        .filter(st => {
          if (currentCategoryFilter !== 'all' && (st.category || 'work') !== currentCategoryFilter) return false;
          if (currentPeriodTab === 'done') return !!st.completed;
          if (currentPeriodTab === 'weekly') return !st.completed && st.period === 'weekly';
          return !st.completed && (st.period === 'daily' || !st.period);
        });

      if (!visibleSteps.length) {
        const emptyMsg = currentPeriodTab === 'done' 
          ? (isAr ? 'لا توجد مهام مكتملة بعد. أنجز خطوة لتراها هنا! 🎯' : 'No completed tasks yet. Finish a task! 🎯')
          : (isAr ? 'لا توجد مهام في هذه القائمة. اكتب مهمتك وأضفها بالزر (+) ✍️' : 'No tasks in this list. Write a task and tap (+) ✍️');
        container.innerHTML = `<div style="font-size:11.5px; color:var(--text-3); text-align:center; padding:18px 0;">${emptyMsg}</div>`;
      } else {
        visibleSteps.forEach((st) => {
          const item = document.createElement('div');
          item.className = 'nf-todo-item' + (st.completed ? ' done' : '') + ' cat-' + (st.category || 'work');
          
          const check = document.createElement('div');
          check.className = 'nf-todo-check';
          check.title = st.completed ? (isAr ? 'إلغاء الإنجاز' : 'Unmark') : (isAr ? 'تم الإنجاز' : 'Mark done');
          check.addEventListener('click', (e) => {
            e.stopPropagation();
            const original = focusState.task.steps[st.originalIdx];
            if (original) {
              original.completed = !original.completed;
              if (original.completed && typeof playTones === 'function') {
                playTones([[0, 587], [0.12, 880]], { peak: 0.12, attack: 0.02, decay: 0.3 });
              }
              saveState();
              updateUI();
              renderDashboardSteps();
              updateDashboardStats();
            }
          });

          // Category Badge Pill
          const catPill = document.createElement('span');
          catPill.className = 'nf-todo-cat-badge ' + (st.category || 'work');
          const catDict = isAr ? CAT_LABELS_AR : CAT_LABELS_EN;
          const catKey = st.category || 'work';
          catPill.innerHTML = `${CAT_SVGS[catKey] || ''} <span>${catDict[catKey] || (isAr ? 'عمل' : 'Work')}</span>`;

          const titleSpan = document.createElement('span');
          titleSpan.className = 'nf-todo-text';
          titleSpan.textContent = st.title;

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'nf-todo-del';
          delBtn.textContent = '×';
          delBtn.title = isAr ? 'حذف المهمة' : 'Delete task';
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            focusState.task.steps.splice(st.originalIdx, 1);
            if (focusState.task.activeStepIndex >= focusState.task.steps.length) {
              focusState.task.activeStepIndex = Math.max(0, focusState.task.steps.length - 1);
            }
            saveState();
            updateUI();
            renderDashboardSteps();
            updateDashboardStats();
          });

          item.appendChild(check);
          item.appendChild(catPill);
          item.appendChild(titleSpan);
          item.appendChild(delBtn);
          container.appendChild(item);
        });
      }
    }

    function updateDashboardStats() {
      const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
      const streakEl = $('#nf-dash-streak');
      if (streakEl) {
        streakEl.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="color:#f59e0b;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> <span>${isAr ? `سلسلة ${focusState.streakDays || 3} أيام` : `${focusState.streakDays || 3} Days Streak`}</span>`;
      }
      const stepsEl = $('#nf-dash-completed-steps');
      if (stepsEl && focusState.task && focusState.task.steps) {
        const done = focusState.task.steps.filter(s => s.completed).length;
        stepsEl.textContent = isAr ? `✓ ${done} خطوات منجزة` : `✓ ${done} steps done`;
      }
    }

    // Bind Period Tabs (Daily / Weekly / Completed)
    const periodTabs = document.querySelectorAll('.nf-period-tab');
    periodTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        periodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPeriodTab = tab.dataset.period || 'daily';
        renderDashboardSteps();
      });
    });

    // Bind Category Filter Chips
    const catChips = document.querySelectorAll('.nf-cat-chip');
    catChips.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        catChips.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.dataset.cat || 'all';
        renderDashboardSteps();
      });
    });

    const origUpdateUI = updateUI;
    updateUI = function() {
      origUpdateUI();
      renderDashboardSteps();
      updateDashboardStats();
    };

    applyFocusLang(window.state?.features?.appLang || 'ar');
    renderDashboardSteps();
    updateDashboardStats();

    startTimersLoop();
    updateUI();
  }

  // Pomodoro Management
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function startPomodoro() {
    focusState.pomodoro.running = true;
    updatePomoUI();
  }

  function pausePomodoro() {
    focusState.pomodoro.running = false;
    updatePomoUI();
  }

  function togglePomodoro() {
    if (focusState.pomodoro.running) {
      pausePomodoro();
    } else {
      startPomodoro();
    }
  }

  function updatePomoUI() {
    const p = focusState.pomodoro;
    if (pomoTime) {
      pomoTime.textContent = formatTime(p.secondsLeft);
    }
    if (pomoBadge) {
      pomoBadge.classList.toggle('break', p.mode === 'break');
      const ico = pomoBadge.querySelector('.nf-pomo-ico');
      if (ico) ico.textContent = p.mode === 'break' ? '☕' : '⏱️';
    }
    if (btnPomoToggle) {
      btnPomoToggle.textContent = p.running ? '⏸' : '▶';
      btnPomoToggle.title = p.running ? 'إيقاف مؤقت' : 'تشغيل مؤقت بومودورو';
    }
  }

  // Master timer interval loop (Pomodoro + 2-Minute Unstick)
  function startTimersLoop() {
    if (pomoTimerInterval) clearInterval(pomoTimerInterval);
    pomoTimerInterval = setInterval(() => {
  const bridge = window.nova;
      let stateChanged = false;

      // 1. Pomodoro Timer
      if (focusState.pomodoro && focusState.pomodoro.running) {
        focusState.pomodoro.secondsLeft--;
        stateChanged = true;

        if (focusState.pomodoro.secondsLeft <= 0) {
          if (focusState.pomodoro.mode === 'work') {
            // Finished work block!
            playSuccessChime();
            if (typeof celebrate === 'function') celebrate(['#30d158', '#ffd479', '#0a84ff']);
            focusState.pomodoro.mode = 'break';
            focusState.pomodoro.secondsLeft = focusState.pomodoro.breakDuration || 300;
            if (typeof window.playScene === 'function') {
              window.playScene({
                who: 'nova',
                tone: 'gold',
                badge: '☕ وقت استراحة!',
                title: 'عاش يا بطل! أتممت 25 دقيقة تركيز كاملة',
                sub: 'استريح 5 دقائق.. قوم اتحرك واشرب مايه',
                ms: 7000
              });
            }
          } else {
            // Finished break block!
            playUnstickChime();
            focusState.pomodoro.mode = 'work';
            focusState.pomodoro.secondsLeft = focusState.pomodoro.workDuration || 1500;
            if (typeof window.playScene === 'function') {
              window.playScene({
                who: 'nova',
                tone: 'blue',
                badge: '🚀 استئناف التركيز',
                title: 'انتهت الاستراحة!',
                sub: 'جاهز؟ يلا نرجع نكمل خطوتنا بتركيز!',
                ms: 6000
              });
            }
          }
        }
        updatePomoUI();
      }

      // 2. Unstick 2-minute Timer
      if (focusState.unstick && focusState.unstick.active) {
        focusState.unstick.secondsLeft--;
        stateChanged = true;

        if (unstickText) {
          unstickText.textContent = `⏳ فك الشلل (${formatTime(focusState.unstick.secondsLeft)})`;
        }

        if (focusState.unstick.secondsLeft <= 0) {
          focusState.unstick.active = false;
          playUnstickChime();
          if (typeof celebrate === 'function') celebrate(['#ff9f0a', '#30d158']);
          if (unstickText) unstickText.textContent = 'فك الشلل (دقيقتين)';
          if (btnUnstick) btnUnstick.classList.remove('running');

          if (typeof window.playScene === 'function') {
            window.playScene({
              who: 'nova',
              tone: 'gold',
              badge: '💪 دقيقتين عدوا!',
              title: 'عاش يا بطل! كسرنا الجمود',
              sub: 'الخطوة الأولى بدأت.. يلا نكمل الخطوة الأساسية؟',
              ms: 6000
            });
          }
        }
      }

      if (stateChanged && Math.random() < 0.1) {
        saveState();
      }
    }, 1000);
  }

  // Update complete UI
  function updateUI() {
    const hasActiveTask = !!(focusState.task && focusState.task.steps && focusState.task.steps.length > 0);
    const island = $('#island');

    if (island) {
      island.classList.toggle('has-task', hasActiveTask);
    }

    if (!hasActiveTask) {
      if (inputBar) inputBar.hidden = false;
      if (activeCard) activeCard.hidden = true;
      if (island) island.classList.remove('has-substeps');
    } else {
      if (inputBar) inputBar.hidden = true;
      if (activeCard) activeCard.hidden = false;

      const t = focusState.task;
      const idx = t.activeStepIndex || 0;
      const step = t.steps[idx] || t.steps[0];
      const total = t.steps.length;

      if (progressText) {
        progressText.textContent = `الخطوة ${idx + 1} من ${total} · حوالي ${step.duration || 10} دقائق`;
      }
      if (deadlineText) {
        deadlineText.textContent = `التسليم: ${t.deadline || 'اليوم'}`;
      }
      if (heroText) {
        heroText.textContent = step.title;
      }

      // Render micro-checks
      if (substepsContainer) {
        substepsContainer.innerHTML = '';
        const subs = step.subSteps || [];
        if (subs.length > 0) {
          if (island) island.classList.add('has-substeps');
          let allDone = true;
          subs.forEach((sub, sIdx) => {
            if (!sub.done) allDone = false;
            const item = document.createElement('div');
            item.className = 'nf-substep-item' + (sub.done ? ' done' : '');
            item.innerHTML = `
              <span class="nf-substep-check">${sub.done ? '✓' : ''}</span>
              <span class="nf-substep-label">${esc(sub.text)}</span>
            `;
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              sub.done = !sub.done;
              playSubstepTick();
              saveState();
              updateUI();
            });
            substepsContainer.appendChild(item);
          });

          if (btnDone) {
            btnDone.classList.toggle('ready', allDone);
          }
        } else {
          if (island) island.classList.remove('has-substeps');
          if (btnDone) btnDone.classList.remove('ready');
        }
      }

      updatePomoUI();
    }
  }

  function completeCurrentStep() {
    if (!focusState.task) return;
    const t = focusState.task;
    const curIdx = t.activeStepIndex || 0;

    if (t.steps[curIdx]) {
      t.steps[curIdx].completed = true;
    }

    playSuccessChime();
    if (typeof celebrate === 'function') celebrate(['#30d158', '#ffd479', '#0a84ff']);

    if (curIdx + 1 < t.steps.length) {
      t.activeStepIndex = curIdx + 1;
      saveState();
      updateUI();
      if (typeof positionIsland === 'function') positionIsland();
    } else {
      // Entire assignment completed!
      const completedTask = { ...t, completedAt: Date.now() };
      focusState.history.unshift(completedTask);
      focusState.task = null;
      focusState.pomodoro.running = false;
      saveState();
      updateUI();
      if (typeof positionIsland === 'function') positionIsland();

      // Nova grand celebration scene
      if (typeof window.playScene === 'function') {
        window.playScene({
          who: 'nova',
          props: ['band'],
          arms: 'up',
          tone: 'gold',
          badge: '🎉 إنجاز أسطوري!',
          title: 'عاش يا بطل! أنهيت المهمة كاملة',
          sub: `أتممت: <b>${esc(completedTask.title)}</b> بنجاح باهر!`,
          ms: 7000
        });
      }
    }
  }

  function unstickCurrentStep() {
    if (!focusState.task) return;
    const t = focusState.task;
    const curIdx = t.activeStepIndex || 0;
    const step = t.steps[curIdx];
    if (!step) return;

    playUnstickChime();
    const icebreaker = UNSTICK_ICEBREAKERS[Math.floor(Math.random() * UNSTICK_ICEBREAKERS.length)];
    step.title = `[دقيقتين كسر جليد]: ${icebreaker}`;
    step.duration = 2;
    step.isUnstick = true;

    // Start 2-minute unstick timer
    focusState.unstick.active = true;
    focusState.unstick.secondsLeft = 120;
    if (btnUnstick) btnUnstick.classList.add('running');
    if (unstickText) unstickText.textContent = '⏳ فك الشلل (02:00)';

    saveState();
    updateUI();

    if (typeof showToast === 'function') {
      showToast('calc', 'فك الشلل التنفيذي', 'خطوة فيزيائية لمدة دقيقتين فقط.. ابدأ الآن!', 0, 3500);
    }
  }

  function cancelCurrentTask() {
    if (!focusState.task) return;
    focusState.task = null;
    focusState.pomodoro.running = false;
    focusState.unstick.active = false;
    if (unstickText) unstickText.textContent = 'فك الشلل (دقيقتين)';
    if (btnUnstick) btnUnstick.classList.remove('running');
    saveState();
    updateUI();
    if (typeof positionIsland === 'function') positionIsland();
    if (typeof render === 'function') render();
  }

  function showFocusMode() {
    if (typeof state !== 'undefined') state.focusMode = true;
    bridge?.setFocusMode?.(true);
    bridge?.focusInput?.(true);
    if (typeof render === 'function') render();
    if (typeof positionIsland === 'function') positionIsland();
    setTimeout(() => {
      if (!focusState.task && omniboxInput) {
        omniboxInput.focus();
      }
    }, 60);
  }

  function hideFocusMode() {
    if (typeof state !== 'undefined') state.focusMode = false;
    bridge?.setFocusMode?.(false);
    bridge?.focusInput?.(false);
    if (typeof render === 'function') render();
    if (typeof positionIsland === 'function') positionIsland();
  }

  function toggleFocusMode() {
    if (state.focusMode) {
      hideFocusMode();
    } else {
      showFocusMode();
    }
  }

  // Toggle Deep Focus ("القوة القاهرة للتركيز")
  function setDeepFocus(enabled) {
    focusState.deepFocus = !!enabled;
    saveState();
    if (bridge?.setDeepFocus) {
      bridge.setDeepFocus(focusState.deepFocus);
    }
    if (bridge?.setDeepFocus) {
      bridge.setDeepFocus(focusState.deepFocus);
    }
    if (focusState.deepFocus) {
      if (typeof window.playScene === 'function') {
        window.playScene({
          who: 'nova',
          props: ['band'],
          arms: 'fold',
          tone: 'coral',
          badge: '🔒 القوة القاهرة',
          title: 'وضع التركيز العميق مفعّل!',
          sub: 'تم حظر المتشتتات والمواقع غير الإنتاجية',
          ms: 4500
        });
      } else if (typeof showToast === 'function') {
        showToast('lock', 'القوة القاهرة للتركيز 🔒', 'وضع التركيز العميق مفعّل، تم حظر المتشتتات', 0, 4000);
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('done', 'إنهاء وضع القوة القاهرة', 'تم فك حظر المتشتتات', 0, 2500);
      }
    }
  }

  let lastDistractionToast = 0;
  function triggerDistractionAlert(appTitle) {
    const now = Date.now();
    if (now - lastDistractionToast < 8000) return;
    lastDistractionToast = now;
    if (typeof window.playScene === 'function') {
      window.playScene({
        who: 'nova',
        tone: 'coral',
        badge: '⚠️ تشتت ملحوظ!',
        title: 'وضع القوة القاهرة نشط!',
        sub: `تم رصد: <bdi dir="ltr"><b>${esc(appTitle.slice(0, 30))}</b></bdi>.. ارجع لخطوتك الحالية!`,
        ms: 5000,
        lang: 'ar'
      });
    } else if (typeof showToast === 'function') {
      showToast('lock', '⚠️ تشتت ملحوظ!', 'وضع القوة القاهرة نشط.. ارجع لخطوتك الآن', 0, 4000);
    }
  }

  // Global window exposure
  window.neuroFocus = {
    show: showFocusMode,
    hide: hideFocusMode,
    toggle: toggleFocusMode,
    isOpen: () => (typeof state !== 'undefined' ? !!state.focusMode : false),
    completeStep: completeCurrentStep,
    unstick: unstickCurrentStep,
    cancel: cancelCurrentTask,
    togglePomodoro,
    setDeepFocus,
    get state() { return focusState; },
    get settings() { return focusSettings; },
    updateSettings(cfg) {
      focusSettings = { ...focusSettings, ...cfg };
      saveState();
    }
  };

  // Listen for escape across window when in focus mode
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.focusMode) {
      hideFocusMode();
    }
  });

  // Load state and setup
  loadState();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initUI();
      // Manual activation only
      // setTimeout(showFocusMode, 400);
    });
  } else {
    initUI();
    // Manual activation only
      // setTimeout(showFocusMode, 400);
  }
})();

    // Wire the prominent Deep Focus banner in #v-focus
    const deepBanner = $('#nf-dash-deep-toggle');
    if (deepBanner) {
      function syncDeepBanner(active) {
        deepBanner.classList.toggle('active', !!active);
        deepBanner.setAttribute('aria-checked', active ? 'true' : 'false');
        const sub = deepBanner.querySelector('.nf-deep-sub');
        if (sub) {
          sub.textContent = active ? 'مفعّل الآن 🎯 (يتم حظر وتصغير المشتتات)' : 'حظر المشتتات والبرامج تلقائياً';
        }
      }

      // Read current state from features or IPC
      if (window.nova?.getDeepFocus) {
        window.nova.getDeepFocus().then(syncDeepBanner);
      }

      deepBanner.addEventListener('click', async (e) => {
        e.stopPropagation();
        const currentlyActive = deepBanner.classList.contains('active');
        const nextState = !currentlyActive;
        syncDeepBanner(nextState);

        if (window.nova?.setDeepFocus) {
          await window.nova.setDeepFocus(nextState);
        }
        if (window.bridge?.setFeatures) {
          window.bridge.setFeatures({ deepFocus: nextState });
        }
        if (typeof celebrate === 'function' && nextState) {
          celebrate(['#ef4444', '#f87171', '#38bdf8']);
        }
      });

      window.addEventListener('island:features', (e) => {
        if (typeof e.detail?.deepFocus === 'boolean') {
          syncDeepBanner(e.detail.deepFocus);
        }
        if (e.detail?.appLang) {
          if (typeof applyFocusLang === 'function') applyFocusLang(e.detail.appLang); else if (typeof window.applyFocusLang === 'function') window.applyFocusLang(e.detail.appLang);
        }
      });
    }
