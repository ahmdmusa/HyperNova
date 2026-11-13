// The Companion: notices when you come back, greets the day, minds your breaks,
// provides smart moments, and synchronizes with Nova Robot's emotional states.
(() => {
  const AWAY_S = 5 * 60; // 5 min without input = away
  const LONG_AWAY_MS = 25 * 60e3;
  const WORK_MS = 50 * 60e3; // 50 min work = break prompt
  const BRIEF_KEY = 'nova-brief-day';

  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';

  const CARE_AR = [
    ['تمرين راحة العين 20-20-20', 'انظر إلى شيء يبعد 20 قدماً لمدة 20 ثانية لإراحة بصرك وإنعاش تركيزك.'],
    ['قم وتحرك دقيقتين', '50 دقيقة عمل متواصل. المشي الخفيف يجدد الدورة الدموية وينشط الذهن.'],
    ['تمرين التنفس المربع (4-4-4)', 'شهيق 4 ثوانٍ · حبس 4 ثوانٍ · زفير 4 ثوانٍ · راحة 4 ثوانٍ.'],
    ['شرب كوب من الماء', 'ترطيب الجسم يعيد صفاء الذهن ويمنحك طاقة متجددة لإتمام مهامك.'],
  ];

  const CARE_EN = [
    ['20-20-20 Eye Rest Rule', 'Look at something 20 feet away for 20 seconds to refresh your vision.'],
    ['Stand up & stretch', '50 minutes at the screen. A two-minute stroll re-energizes your brain.'],
    ['Box Breathing (4-4-4)', 'Inhale 4s · Hold 4s · Exhale 4s · Rest 4s. Repeat 3 times.'],
    ['Hydrate with water', 'Drinking water restores mental clarity and keeps your energy high.'],
  ];

  let awayFrom = 0;
  let activeSince = Date.now();
  let careIdx = 0;
  let pending = null;
  let preAdhanFired = new Set();

  const today = () => new Date().toDateString();
  const briefDone = () => { try { return localStorage.getItem(BRIEF_KEY) === today(); } catch { return false; } };
  const markBrief = () => { try { localStorage.setItem(BRIEF_KEY, today()); } catch {} };

  const mins = (ms) => {
    const m = Math.round(ms / 60000);
    const ar = isAr();
    if (ar) return m < 60 ? `${m} دقيقة` : `${Math.floor(m / 60)} س ${m % 60 ? `و ${m % 60} د` : ''}`;
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;
  };

  const line = (icon, html) => `<span class="ln">${icon} ${html}</span>`;
  const bdiAr = (t) => `<bdi lang="ar">${t}</bdi>`;

  function greeting() {
    const h = new Date().getHours();
    const ar = isAr();
    if (ar) return h < 12 ? 'صباح الخير ☀️' : h < 17 ? 'طاب يومك 🌤️' : 'مساء النور 🌙';
    return h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙';
  }

  async function brief() {
    markBrief();
    const ar = isAr();
    const lines = [];
    const now = new Date();
    const locale = ar ? 'ar-EG' : 'en-US';
    const date = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const hijri = ($('#pr-hijri') || $('#x-hijri'))?.textContent || '';

    lines.push(line('📆', `<b>${esc(date)}</b>${hijri ? ` · ${bdiAr(esc(hijri))}` : ''}`));

    try {
      const w = (await bridge.system.snapshot())?.weather;
      if (w) {
        const city = w.city || (ar ? 'مدينتك' : 'your city');
        lines.push(line('🌤️', `<b>${w.temp}°</b> في ${esc(city)} · أعلى ${w.hi}° أدنى ${w.lo}°`));
      }
    } catch {}

    const pr = window.nextPrayerText?.();
    if (pr && feat('tabPrayer')) {
      const [name, ...time] = pr.split(' ');
      lines.push(line('🕌', ar ? `الصلاة القادمة: <b>${bdiAr(esc(name))}</b> ${esc(time.join(' '))}` : `Next prayer: <b>${bdiAr(esc(name))}</b> ${esc(time.join(' '))}`));
    }

    const meets = window.meetingsToday?.() || [];
    if (meets.length) {
      const first = meets[0];
      const t = new Date(first.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      lines.push(line('📅', ar ? `${meets.length} مواعيد اليوم · أولها: <b>${esc(first.title)}</b> ${t}` : `${meets.length} meeting(s) today · first: <b>${esc(first.title)}</b> ${t}`));
    }

    const tasks = typeof window.getFocusTasks === 'function' ? window.getFocusTasks() : [];
    if (tasks.length) {
      const topTask = tasks[0];
      lines.push(line('🎯', ar ? `أهم مهام اليوم: <b>${esc(topTask.title)}</b> (${tasks.length} متبقية)` : `Top focus task: <b>${esc(topTask.title)}</b> (${tasks.length} left)`));
    }

    const quranAction = `<div style="margin-top:6px;"><button id="btn-brief-quran" type="button" class="brief-action-btn" style="cursor:pointer; padding:3px 10px; border-radius:12px; background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-weight:700; font-size:11px;">▶️ ${ar ? 'تشغيل ورد الصباح 📖' : 'Play Morning Dhikr 📖'}</button></div>`;

    window.audioHaptics?.playWoodTap();
    queue({
      kind: 'brief',
      badge: greeting(),
      html: `<span class="big">${greeting()} يا بطل 👋</span>${lines.join('')}${quranAction}`,
      ref: '',
      ms: 15000
    });

    setTimeout(() => {
      document.getElementById('btn-brief-quran')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.audioHaptics?.playCrystalChime?.(0.2);
        window.quranRadio?.playRecitation?.();
      });
    }, 150);
  }

  function welcome(awayMs) {
    const ar = isAr();
    const since = Date.now() - awayMs;
    const news = happenings.filter((h) => h.at >= since);
    if (!news.length && awayMs < LONG_AWAY_MS) return;

    const lines = news.slice(-4).map((h) => line(h.icon, esc(h.text)));
    if (news.length > 4) lines.push(line('…', ar ? `و ${news.length - 4} أحداث أخرى` : `and ${news.length - 4} more`));
    if (!lines.length) lines.push(line('☕', ar ? 'كل شيء هادئ ومنظم أثناء غيابك.' : 'You missed nothing. All quiet.'));

    window.setNovaMood?.('welcome', 5000);
    window.audioHaptics?.playCrystalChime(0.16);

    const title = ar ? 'مرحباً بعودتك 👋' : 'Welcome back 👋';
    const sub = ar ? `كنت بعيداً لمدة ${mins(awayMs)}` : `Away for ${mins(awayMs)}`;

    queue({
      kind: 'welcome',
      badge: ar ? 'عودة حميدة' : 'Welcome back',
      html: `<span class="big">${title}</span><span class="ln">${sub}</span>${lines.join('')}`,
      ref: '',
      ms: 12000
    });
  }

  function care() {
    const ar = isAr();
    const list = ar ? CARE_AR : CARE_EN;
    const [title, text] = list[careIdx++ % list.length];

    const isBreathing = title.includes('4-4-4') || title.includes('Breathing');
    window.setNovaMood?.(isBreathing ? 'breathing' : 'care', 15000);
    window.audioHaptics?.playWaterDrop(0.26);

    const rhythmHtml = isBreathing
      ? `<div class="bb-rhythm" style="margin-top:5px; font-size:10.5px; color:#38bdf8; font-weight:600;">🌬️ ${ar ? 'شهيق (٤ث) ⬅️ حبس (٤ث) ➡️ زفير (٤ث) ⏸️ راحة (٤ث)' : 'Inhale (4s) ⬅️ Hold (4s) ➡️ Exhale (4s) ⏸️ Rest (4s)'}</div>`
      : '';

    queue({
      kind: 'care',
      badge: ar ? 'استراحة صحية 🌿' : 'Mindful Break 🌿',
      html: `<span class="big">${title}</span><span class="ln">${text}</span>${rhythmHtml}`,
      ref: '',
      ms: 15000
    });
  }

  // Pre-Adhan mindful notification (10 minutes before next prayer)
  function checkPreAdhan() {
    if (!feat('prayerAlerts') || !feat('tabPrayer') || feat('novaPrayer') === false) return;
    const pr = window.nextPrayerObj?.();
    if (!pr || !pr.target) return;
    const diffMs = pr.target - Date.now();
    const diffMin = Math.round(diffMs / 60000);

    const todayDate = today();
    const key = `${todayDate}-${pr.name}-10m`;

    if (diffMin <= 10 && diffMin >= 9 && !preAdhanFired.has(key)) {
      preAdhanFired.add(key);
      const ar = isAr();
      const msg = ar
        ? `اقترب أذان ${pr.name} (متبقي ١٠ دقائق) — استعد وأرح عينيك.`
        : `Approaching ${pr.name} prayer in 10 minutes — prepare and rest your eyes.`;
      
      window.setNovaState?.('pre_prayer', 10000);
      window.audioHaptics?.playWoodTap();
      if (typeof showToast === 'function') {
        showToast('prayer', ar ? '🕌 اقتربت الصلاة' : '🕌 Prayer Approaching', msg, 0, 7000);
      }
    }
  }
  setInterval(checkPreAdhan, 30000);

  function queue(card) { pending = card; flush(); }
  function flush() {
    if (!pending) return;
    const now = Date.now();
    if (!state.visible || lastMode === 'expanded' || cardShowing() || window.sceneShowing?.() || (state.toast && now < state.toastUntil)) return;
    const c = pending;
    pending = null;
    showCard(c);
  }
  setInterval(flush, 1000);

  bridge.onMedia((m) => {
    if (typeof m.idle !== 'number') return;
    const now = Date.now();
    if (m.idle >= AWAY_S) {
      if (!awayFrom) awayFrom = now - m.idle * 1000;
      return;
    }
    if (awayFrom && m.idle < 5) {
      const awayMs = now - awayFrom;
      awayFrom = 0;
      activeSince = now;
      if (feat('morningBrief') && !briefDone() && new Date().getHours() >= 4) brief();
      else if (feat('welcomeBack')) welcome(awayMs);
      return;
    }
    if (feat('wellbeing') && now - activeSince >= WORK_MS && state.visible && !focusing()) {
      activeSince = now;
      care();
    }
  });

  setTimeout(() => {
    if (feat('morningBrief') && !briefDone() && new Date().getHours() >= 4) brief();
  }, 9000);
})();
