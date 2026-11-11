// Nova Companion: The Living Dynamic Island AI Robot.
// Features: Spring physics gaze tracking, 8-state emotional matrix, interactive petting detection,
// double-click inspiration pills, and Web Audio ASMR haptics.
(() => {
  const DWELL_MS = 300; // responsive wake-up
  const face = document.getElementById('nova-face') || $('.eyes');
  const pupils = [...$$('.eye b')];
  const islandEl = document.getElementById('island') || $('#island');

  // Spring physics engine: Hooke's law with damping (stiffness: 280, damping: 24)
  class SpringSolver {
    constructor(stiffness = 280, damping = 24, mass = 1.0) {
      this.k = stiffness;
      this.c = damping;
      this.m = mass;
      this.x = 0;
      this.v = 0;
      this.target = 0;
    }
    update(dt = 0.016) {
      const fSpring = -this.k * (this.x - this.target);
      const fDamper = -this.c * this.v;
      const a = (fSpring + fDamper) / this.m;
      this.v += a * dt;
      this.x += this.v * dt;
      return this.x;
    }
    setTarget(t) { this.target = t; }
    isSettled(tolerance = 0.01) {
      return Math.abs(this.target - this.x) < tolerance && Math.abs(this.v) < tolerance;
    }
  }

  const springX = new SpringSolver(280, 24);
  const springY = new SpringSolver(280, 24);
  let physicsRunning = false;

  function runPhysicsLoop() {
    if (physicsRunning) return;
    physicsRunning = true;
    let lastTime = performance.now();

    function step(now) {
      const dt = Math.min(0.032, Math.max(0.008, (now - lastTime) / 1000));
      lastTime = now;

      const px = springX.update(dt);
      const py = springY.update(dt);

      pupils.forEach((p) => {
        p.style.setProperty('--px', `${px.toFixed(2)}px`);
        p.style.setProperty('--py', `${py.toFixed(2)}px`);
      });

      if (!springX.isSettled() || !springY.isSettled()) {
        requestAnimationFrame(step);
      } else {
        physicsRunning = false;
      }
    }
    requestAnimationFrame(step);
  }

  let near = null;
  let nearSince = 0;
  let dwellTimer = null;
  let currentMood = 'idle';
  let moodTimer = null;

  const DHIKR_INSPIRATIONS = [
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ'
  ];

  function apply() {
    const show = feat('novaEyes') && !anchor.vertical && !state.hover && lastMode === 'idle';
    islandEl.classList.toggle('eyes', !!show);
  }

  // Set companion mood state across the matrix forms
  function setMood(mood, durationMs = 0) {
    if (!face) return;
    clearTimeout(moodTimer);
    face.classList.remove('mood-khushu', 'mood-warrior', 'mood-celebrate', 'mood-petting', 'mood-care', 'mood-sleep', 'mood-quran', 'mood-meeting', 'mood-welcome');
    islandEl.classList.remove('aura-khushu', 'aura-warrior', 'aura-celebrate', 'aura-quran', 'aura-meeting');

    currentMood = mood || 'idle';
    if (currentMood !== 'idle') {
      face.classList.add(`mood-${currentMood}`);
      if (['khushu', 'warrior', 'celebrate', 'quran', 'meeting'].includes(currentMood)) {
        islandEl.classList.add(`aura-${currentMood}`);
      }
    }

    if (durationMs > 0) {
      moodTimer = setTimeout(() => {
        setMood(getDefaultMood());
      }, durationMs);
    }
  }

  function getDefaultMood() {
    if (window.notchMeetings?.getState()?.inMeeting) return 'meeting';
    if (window.state?.focusMode) return 'warrior';
    if (typeof isQuranPlaying === 'function' && isQuranPlaying()) return 'quran';
    return 'idle';
  }

  window.setNovaMood = setMood;

  // Gaze tracking using spring physics
  bridge.onNear((n) => {
    if (!n) {
      near = null;
      nearSince = 0;
      clearTimeout(dwellTimer);
      springX.setTarget(0);
      springY.setTarget(0);
      runPhysicsLoop();
      apply();
      return;
    }
    if (!near) {
      nearSince = Date.now();
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(apply, DWELL_MS);
    }
    near = n;
    const d = Math.hypot(n.dx, n.dy) || 1;
    const k = Math.min(1, d / 120);
    const targetX = (n.dx / d) * 3.0 * k;
    const targetY = (n.dy / d) * 3.0 * k;

    springX.setTarget(targetX);
    springY.setTarget(targetY);
    runPhysicsLoop();
    apply();
  });

  // Natural organic blinking
  function blink() {
    if (['khushu', 'sleep'].includes(currentMood)) return;
    face?.classList.add('blink');
    setTimeout(() => face?.classList.remove('blink'), 130);
  }

  (function blinkLoop() {
    if (islandEl.classList.contains('eyes') && currentMood !== 'sleep') {
      blink();
      if (Math.random() < 0.25) setTimeout(blink, 260);
    }
    setTimeout(blinkLoop, 2800 + Math.random() * 3800);
  })();

  // Petting interaction: cursor back-and-forth swipe detection
  let lastPetX = 0;
  let petDirectionChanges = 0;
  let lastDirection = 0;
  let lastPetTime = 0;

  function onFaceMouseMove(e) {
    const now = Date.now();
    const dx = e.clientX - lastPetX;
    if (now - lastPetTime > 1200) petDirectionChanges = 0;
    lastPetX = e.clientX;
    lastPetTime = now;

    if (Math.abs(dx) > 3) {
      const dir = dx > 0 ? 1 : -1;
      if (dir !== lastDirection) {
        petDirectionChanges++;
        lastDirection = dir;
      }
    }

    if (petDirectionChanges >= 3) {
      petDirectionChanges = 0;
      triggerPetting();
    }
  }

  function triggerPetting() {
    setMood('petting', 2500);
    window.audioHaptics?.playWoodTap(0.28);
    if (typeof celebrate === 'function') {
      celebrate(['#ff8fb8', '#ffd479', '#30d158', '#38bdf8']);
    }
  }

  // Double click for instant Dhikr & Inspiration capsule
  function showInspirationPill() {
    const text = DHIKR_INSPIRATIONS[Math.floor(Math.random() * DHIKR_INSPIRATIONS.length)];
    const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
    if (typeof showToast === 'function') {
      showToast('inspire', isAr ? '✨ سكينة وذكر (اضغط للنسخ)' : '✨ Dhikr (Click to copy)', text, 0, 5500);
      state.toastAction = () => {
        try {
          navigator.clipboard?.writeText(text).catch(() => {});
        } catch {}
        showToast('copied', isAr ? '✓ تم النسخ إلى الحافظة' : '✓ Copied to clipboard', text, 0, 2500);
        window.audioHaptics?.playWoodTap();
      };
    }
    window.audioHaptics?.playCrystalChime(0.18);
  }

  if (face) {
    face.addEventListener('mousemove', onFaceMouseMove);
    face.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      showInspirationPill();
    });
    face.addEventListener('click', (e) => {
      if (e.detail === 1) {
        window.audioHaptics?.playWoodTap(0.2);
      }
    });
  }

  bridge.onHover(apply);
  window.addEventListener('island:features', apply);
  window.addEventListener('island:mode', apply);

  // Sync with focus mode and Quran radio
  window.addEventListener('island:focus', (e) => {
    if (e.detail?.active) setMood('warrior');
    else setMood(getDefaultMood());
  });
})();
