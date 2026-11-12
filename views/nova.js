// Nova Companion: The Living Dynamic Island AI Robot.
// Phase 3: "Living Visuals & Emotional Matrix 2.0" (16 States, 4 Smart Props, Spring Physics, Particles FX)
(() => {
  const DWELL_MS = 250;
  const islandEl = document.getElementById('island') || $('#island');
  const face = document.getElementById('nova-face');
  const svg = document.getElementById('novaNotchSvg');

  // SVG Elements
  const scleraLeft = document.getElementById('scleraLeft');
  const scleraRight = document.getElementById('scleraRight');
  const pupilLeft = document.getElementById('pupilLeft');
  const pupilRight = document.getElementById('pupilRight');
  const catchlightLeft = document.getElementById('catchlightLeft');
  const catchlightRight = document.getElementById('catchlightRight');
  const openEyesGroup = document.getElementById('openEyesGroup');
  const arcEyesGroup = document.getElementById('arcEyesGroup');
  const arcLeft = document.getElementById('arcLeft');
  const arcRight = document.getElementById('arcRight');
  const sleepyEyelidsGroup = document.getElementById('sleepyEyelidsGroup');
  const warriorBrowsGroup = document.getElementById('warriorBrowsGroup');
  const cheeksLayer = document.getElementById('cheeksLayer');
  const robotMouth = document.getElementById('robotMouth');
  const robotYawnMouth = document.getElementById('robotYawnMouth');
  const sleepZzzText = document.getElementById('sleepZzzText');

  // Props Groups
  const propPrayer = document.getElementById('propPrayerGroup');
  const propWarrior = document.getElementById('propWarriorGroup');
  const propCoffee = document.getElementById('propCoffeeGroup');
  const propUmbrella = document.getElementById('propUmbrellaGroup');
  const robotSwayGroup = document.getElementById('robotSwayGroup');

  // Particle Canvas Overlay
  const fxCanvas = document.getElementById('fxCanvas');
  const fxCtx = fxCanvas?.getContext('2d');
  let particles = [];
  let fxAnimId = null;

  // Spring physics engine: Hooke's law with damping (k = 280, c = 24)
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
  let currentState = 'idle';
  let currentProp = 'none';
  let stateTimer = null;
  let near = null;
  let dwellTimer = null;
  let isAudioSwayActive = false;
  let orbitAngle = 0;

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

  function runPhysicsLoop() {
    if (physicsRunning) return;
    physicsRunning = true;
    let lastTime = performance.now();

    function step(now) {
      const dt = Math.min(0.032, Math.max(0.008, (now - lastTime) / 1000));
      lastTime = now;

      if (currentState === 'thinking') {
        orbitAngle += 0.085;
        springX.setTarget(Math.cos(orbitAngle) * 4.5);
        springY.setTarget(Math.sin(orbitAngle) * 3.5);
      } else if (currentState === 'rainy') {
        springY.setTarget(-3.5); // look up at rain & umbrella
      }

      const px = springX.update(dt);
      const py = springY.update(dt);

      if (pupilLeft && pupilRight) {
        pupilLeft.setAttribute('cx', (99 + px).toFixed(2));
        pupilLeft.setAttribute('cy', (39 + py).toFixed(2));
        catchlightLeft?.setAttribute('cx', (97 + px).toFixed(2));
        catchlightLeft?.setAttribute('cy', (36.5 + py).toFixed(2));

        pupilRight.setAttribute('cx', (141 + px).toFixed(2));
        pupilRight.setAttribute('cy', (39 + py).toFixed(2));
        catchlightRight?.setAttribute('cx', (139 + px).toFixed(2));
        catchlightRight?.setAttribute('cy', (36.5 + py).toFixed(2));
      }

      const needsContinuous = currentState === 'thinking';
      if (!springX.isSettled() || !springY.isSettled() || needsContinuous) {
        requestAnimationFrame(step);
      } else {
        physicsRunning = false;
      }
    }
    requestAnimationFrame(step);
  }

  // Particle Engine: Confetti and Floating Hearts
  function spawnParticles(kind) {
    if (!fxCanvas || !fxCtx) return;
    const count = kind === 'confetti' ? 34 : 14;
    const colors = ['#38bdf8', '#facc15', '#34d399', '#fb7185', '#c084fc', '#f43f5e'];
    const originX = fxCanvas.width / 2;
    const originY = 40;

    for (let i = 0; i < count; i++) {
      particles.push({
        kind,
        x: originX + (Math.random() - 0.5) * 80,
        y: originY + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * (kind === 'confetti' ? 6.5 : 2.0),
        vy: kind === 'confetti' ? (Math.random() * -4.5 - 1.5) : (Math.random() * -2.2 - 1.0),
        size: kind === 'confetti' ? (Math.random() * 5 + 4) : (Math.random() * 6 + 10),
        color: kind === 'confetti' ? colors[i % colors.length] : (i % 2 === 0 ? '#fb7185' : '#f43f5e'),
        alpha: 1,
        rot: Math.random() * Math.PI
      });
    }

    if (!fxAnimId) {
      fxAnimId = requestAnimationFrame(stepParticles);
    }
  }

  function stepParticles() {
    if (!fxCtx || !fxCanvas) return;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 'confetti') {
        p.vy += 0.18; // gravity
        p.rot += 0.12;
        p.alpha -= 0.016;
        fxCtx.save();
        fxCtx.globalAlpha = Math.max(0, p.alpha);
        fxCtx.translate(p.x, p.y);
        fxCtx.rotate(p.rot);
        fxCtx.fillStyle = p.color;
        fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        fxCtx.restore();
      } else {
        // Floating Heart ♥
        p.alpha -= 0.018;
        fxCtx.save();
        fxCtx.globalAlpha = Math.max(0, p.alpha);
        fxCtx.fillStyle = p.color;
        fxCtx.font = `${Math.round(p.size)}px sans-serif`;
        fxCtx.fillText('♥', p.x, p.y);
        fxCtx.restore();
      }
    });

    particles = particles.filter((p) => p.alpha > 0.02);
    if (particles.length > 0) {
      fxAnimId = requestAnimationFrame(stepParticles);
    } else {
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxAnimId = null; // Auto-stop loop for 0% CPU!
    }
  }

  // Visibility toggle
  function apply() {
    const show = feat('novaEyes') && !anchor.vertical && !state.hover && lastMode === 'idle';
    const changed = islandEl.classList.contains('eyes') !== !!show;
    islandEl.classList.toggle('eyes', !!show);
    if (changed && typeof positionIsland === 'function') {
      positionIsland();
    }
  }

  // Contextual Props Switcher
  function setContextualProp(propName) {
    currentProp = propName || 'none';
    if (propPrayer) propPrayer.classList.toggle('hidden', currentProp !== 'prayer');
    if (propWarrior) propWarrior.classList.toggle('hidden', currentProp !== 'warrior');
    if (propCoffee) propCoffee.classList.toggle('hidden', currentProp !== 'coffee');
    if (propUmbrella) propUmbrella.classList.toggle('hidden', currentProp !== 'umbrella');
  }

  // 16 Emotional & Physical States Matrix
  function setState(stateName, durationMs = 0) {
    clearTimeout(stateTimer);
    currentState = stateName || 'idle';

    // Reset all sub-layers
    islandEl.classList.remove('aura-khushu', 'aura-thinking', 'aura-warrior', 'aura-meeting', 'anim-celebrate');
    openEyesGroup?.classList.remove('hidden');
    arcEyesGroup?.classList.add('hidden');
    sleepyEyelidsGroup?.classList.add('hidden');
    warriorBrowsGroup?.classList.add('hidden');
    cheeksLayer?.classList.add('hidden');
    robotMouth?.classList.add('hidden');
    robotYawnMouth?.classList.add('hidden');
    sleepZzzText?.classList.add('hidden');

    pupilLeft?.setAttribute('r', '6.2');
    pupilRight?.setAttribute('r', '6.2');
    scleraLeft?.classList.remove('hidden');
    scleraRight?.classList.remove('hidden');
    pupilLeft?.classList.remove('hidden');
    pupilRight?.classList.remove('hidden');
    catchlightLeft?.classList.remove('hidden');
    catchlightRight?.classList.remove('hidden');

    // State handling
    switch (currentState) {
      case 'thinking':
        islandEl.classList.add('aura-thinking');
        runPhysicsLoop();
        break;

      case 'celebrate':
        openEyesGroup?.classList.add('hidden');
        arcEyesGroup?.classList.remove('hidden');
        arcLeft?.setAttribute('d', 'M 89 42 Q 99 26 109 42');
        arcRight?.setAttribute('d', 'M 131 42 Q 141 26 151 42');
        cheeksLayer?.classList.remove('hidden');
        robotMouth?.classList.remove('hidden');
        islandEl.classList.add('anim-celebrate');
        spawnParticles('confetti');
        window.audioHaptics?.playCrystalChime?.(0.35);
        break;

      case 'sleepy':
      case 'sleep':
        sleepyEyelidsGroup?.classList.remove('hidden');
        robotYawnMouth?.classList.remove('hidden');
        sleepZzzText?.classList.remove('hidden');
        break;

      case 'khushu':
        islandEl.classList.add('aura-khushu');
        openEyesGroup?.classList.add('hidden');
        arcEyesGroup?.classList.remove('hidden');
        arcLeft?.setAttribute('d', 'M 89 35 Q 99 48 109 35');
        arcRight?.setAttribute('d', 'M 131 35 Q 141 48 151 35');
        break;

      case 'petting':
        openEyesGroup?.classList.add('hidden');
        arcEyesGroup?.classList.remove('hidden');
        arcLeft?.setAttribute('d', 'M 89 42 Q 99 25 109 42');
        arcRight?.setAttribute('d', 'M 131 42 Q 141 25 151 42');
        cheeksLayer?.classList.remove('hidden');
        robotMouth?.classList.remove('hidden');
        spawnParticles('hearts');
        window.audioHaptics?.playWoodTap?.(0.25);
        break;

      case 'warrior':
        setContextualProp('warrior');
        warriorBrowsGroup?.classList.remove('hidden');
        islandEl.classList.add('aura-warrior');
        break;

      case 'pre_prayer':
        setContextualProp('prayer');
        islandEl.classList.add('aura-khushu');
        break;

      case 'coffee_break':
      case 'care':
        setContextualProp('coffee');
        window.audioHaptics?.playWaterDrop?.(0.25);
        break;

      case 'rainy':
        setContextualProp('umbrella');
        runPhysicsLoop();
        break;

      case 'listening_sway':
        islandEl.classList.add('aura-khushu');
        toggleAudioSway(true);
        break;

      case 'welcome':
        // Playful Wink: Left eye happy arc, Right eye open!
        arcEyesGroup?.classList.remove('hidden');
        arcLeft?.setAttribute('d', 'M 89 40 Q 99 26 109 40');
        arcRight?.setAttribute('d', '');
        scleraLeft?.classList.add('hidden');
        pupilLeft?.classList.add('hidden');
        catchlightLeft?.classList.add('hidden');
        cheeksLayer?.classList.remove('hidden');
        robotMouth?.classList.remove('hidden');
        window.audioHaptics?.playCrystalChime?.(0.2);
        setTimeout(() => {
          scleraLeft?.classList.remove('hidden');
          pupilLeft?.classList.remove('hidden');
          catchlightLeft?.classList.remove('hidden');
        }, 1200);
        break;

      case 'meeting':
        islandEl.classList.add('aura-meeting');
        break;

      case 'surprised':
        pupilLeft?.setAttribute('r', '4.0');
        pupilRight?.setAttribute('r', '4.0');
        robotYawnMouth?.classList.remove('hidden');
        break;

      case 'breathing':
        islandEl.classList.add('aura-thinking');
        break;

      case 'deep_sleep':
        openEyesGroup?.classList.add('hidden');
        arcEyesGroup?.classList.remove('hidden');
        arcLeft?.setAttribute('d', 'M 89 38 L 109 38');
        arcRight?.setAttribute('d', 'M 131 38 L 151 38');
        sleepZzzText?.classList.remove('hidden');
        break;

      case 'idle':
      default:
        setContextualProp('none');
        break;
    }

    if (durationMs > 0) {
      stateTimer = setTimeout(() => {
        setState(getDefaultState());
      }, durationMs);
    }
  }

  function getDefaultState() {
    if (window.notchMeetings?.getState()?.inMeeting) return 'meeting';
    if (window.state?.focusMode) return 'warrior';
    if (typeof isQuranPlaying === 'function' && isQuranPlaying()) return 'khushu';
    const h = new Date().getHours();
    if (h >= 0 && h < 5) return 'sleepy';
    return 'idle';
  }

  // Audio-Reactive Sway Toggle
  function toggleAudioSway(enable) {
    isAudioSwayActive = enable !== undefined ? !!enable : !isAudioSwayActive;
    if (robotSwayGroup) {
      robotSwayGroup.classList.toggle('robot-rig-sway', isAudioSwayActive);
    }
  }

  // Export Global APIs
  window.setNovaState = setState;
  window.setNovaMood = setState; // Backward compatibility
  window.setNovaProp = setContextualProp;
  window.toggleNovaAudioSway = toggleAudioSway;
  window.spawnNovaParticles = spawnParticles;

  // Gaze tracking using spring physics
  bridge.onNear((n) => {
    if (!n) {
      near = null;
      clearTimeout(dwellTimer);
      springX.setTarget(0);
      springY.setTarget(0);
      runPhysicsLoop();
      apply();
      return;
    }
    if (!near) {
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(apply, DWELL_MS);
    }
    near = n;
    const d = Math.hypot(n.dx, n.dy) || 1;
    const k = Math.min(1, d / 120);
    const targetX = (n.dx / d) * 4.8 * k;
    const targetY = (n.dy / d) * 3.8 * k;

    springX.setTarget(targetX);
    springY.setTarget(targetY);
    runPhysicsLoop();
    apply();
  });

  // Natural organic blinking every 4.2s
  function blink() {
    if (['khushu', 'sleepy', 'sleep', 'deep_sleep', 'celebrate', 'petting'].includes(currentState)) return;
    if (!scleraLeft || !scleraRight) return;

    scleraLeft.setAttribute('height', '4');
    scleraRight.setAttribute('height', '4');
    scleraLeft.setAttribute('y', '36');
    scleraRight.setAttribute('y', '36');

    setTimeout(() => {
      scleraLeft.setAttribute('height', '28');
      scleraRight.setAttribute('height', '28');
      scleraLeft.setAttribute('y', '24');
      scleraRight.setAttribute('y', '24');
    }, 130);
  }

  (function blinkLoop() {
    if (islandEl.classList.contains('eyes') && !['sleepy', 'deep_sleep'].includes(currentState)) {
      blink();
      if (Math.random() < 0.25) setTimeout(blink, 260);
    }
    setTimeout(blinkLoop, 3200 + Math.random() * 3200);
  })();

  // Natural subtle micro-glances
  (function saccadeLoop() {
    if (islandEl.classList.contains('eyes') && currentState === 'idle' && !near) {
      if (Math.random() < 0.6) {
        const glanceX = (Math.random() - 0.5) * 5;
        const glanceY = (Math.random() - 0.5) * 2.8;
        springX.setTarget(glanceX);
        springY.setTarget(glanceY);
        runPhysicsLoop();
        setTimeout(() => {
          if (currentState === 'idle' && !near) {
            springX.setTarget(0);
            springY.setTarget(0);
            runPhysicsLoop();
          }
        }, 800 + Math.random() * 900);
      }
    }
    setTimeout(saccadeLoop, 3000 + Math.random() * 3000);
  })();

  // Petting interaction: cursor back-and-forth swipe detection
  let lastPetX = 0;
  let petDirectionChanges = 0;
  let lastDirection = 0;
  let lastPetTime = 0;

  function onFaceMouseMove(e) {
    const now = Date.now();
    const dx = e.clientX - lastPetX;
    if (now - lastPetTime > 900) petDirectionChanges = 0;
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
      setState('petting', 3000);
    }
  }

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
    if (e.detail?.active) setState('warrior');
    else setState(getDefaultState());
  });
})();
