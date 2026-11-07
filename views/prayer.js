
  // Two Takbeers Audio Engine (الله أكبر، الله أكبر)
  // Plays pure serene two opening Takbeers using harmonic audio synthesis
  window.playTwoTakbeers = function(voice) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = window._audioCtx || (window._audioCtx = new AudioCtx());
      if (ctx.state === 'suspended') ctx.resume();

      // Takbeer 1: "Allahu Akbar" (Maqam Bayati / Rast cadence)
      // Notes: G3 (196Hz) -> C4 (261.6Hz) -> D4 (293.6Hz) -> C4 (261.6Hz)
      const t0 = ctx.currentTime + 0.05;
      const notes1 = [
        { f: 220, dur: 0.6, gain: 0.22 }, // Al-
        { f: 293.6, dur: 0.8, gain: 0.26 }, // la-
        { f: 330, dur: 0.5, gain: 0.24 },   // hu
        { f: 293.6, dur: 0.5, gain: 0.22 }, // Ak-
        { f: 261.6, dur: 1.1, gain: 0.25 }, // bar
      ];
      // Takbeer 2: "Allahu Akbar" with ascending reverent resolution
      const notes2 = [
        { f: 220, dur: 0.6, gain: 0.22 }, // Al-
        { f: 330, dur: 0.9, gain: 0.28 }, // la-
        { f: 392, dur: 0.5, gain: 0.25 }, // hu
        { f: 330, dur: 0.6, gain: 0.23 }, // Ak-
        { f: 293.6, dur: 1.4, gain: 0.26 }, // bar (peaceful fade)
      ];

      function scheduleNotes(list, startTime) {
        let cur = startTime;
        list.forEach(n => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = voice === 'rifat' ? 'triangle' : voice === 'mustafa' ? 'sine' : 'sine';
          osc.frequency.setValueAtTime(n.f, cur);
          
          g.gain.setValueAtTime(0.001, cur);
          g.gain.exponentialRampToValueAtTime(n.gain, cur + 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, cur + n.dur);

          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(cur);
          osc.stop(cur + n.dur + 0.1);
          cur += n.dur * 0.92;
        });
        return cur;
      }

      const t1 = scheduleNotes(notes1, t0);
      scheduleNotes(notes2, t1 + 0.35);
    } catch (e) {
      console.warn('Audio synthesis takbeer error:', e);
    }
  };

  // IPC listener for Adhan preview from Settings
  if (window.nova?.onAdhanPreview) {
    window.nova.onAdhanPreview((voice) => {
      handleAdhanAudioWithDucking(voice || window.state?.features?.adhanVoice || 'abdulbasit');
      if (typeof window.showToast === 'function') {
        const MUADHIN_NAMES = {
          abdulbasit: 'الشيخ عبد الباسط عبد الصمد',
          rifat: 'الشيخ محمد رفعت',
          mustafa: 'الشيخ مصطفى إسماعيل',
          makkah: 'الحرم المكي الشريف',
          quds: 'المسجد الأقصى (القدس)'
        };
        const mName = MUADHIN_NAMES[voice] || 'عبد الباسط عبد الصمد';
        window.showToast('prayer', '🕌 الله أكبر، الله أكبر', `أذان: ${mName} (تكبيرتان فقط)`, 0, 4500);
      }
    });
  }
// Prayer tab: today's times, next prayer with a live countdown, Hijri date, and reminders
// (10 minutes before and at the time). Also feeds the idle pill and the vertical pill.
(() => {
  const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const NAMES = { imsak: 'الإمساك', fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  const PRAYERS = ORDER.filter((k) => k !== 'sunrise');
  const isRamadan = (d) => d?.today?.hijriMonth === 9;
  const SOON_MIN = 10;

  const view = $('#v-prayer');
  const listEl = $('#pr-list');
  const bell = $('#pr-alerts');

  let data = null;
  const fired = new Set(); // reminders already shown this run

  // the bell and the Settings window share one switch (prayerAlerts)
  let alertsOn = true;
  const showBell = () => bell.classList.toggle('on', alertsOn);
  showBell();
  window.addEventListener('island:features', (e) => {
    alertsOn = e.detail.prayerAlerts !== false;
    showBell();
  });
  bell.addEventListener('click', () => {
    alertsOn = !alertsOn;
    showBell();
    bridge.setFeatures({ prayerAlerts: alertsOn });
  });

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  // "HH:MM" on `date` in the location's time zone -> the real moment (the PC may be elsewhere)
  let zone = '';
  function at(date, hhmm) {
    if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) {
      const now = new Date();
      return now;
    }
    if (!date || typeof date !== 'string') date = ymd(new Date());
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = hhmm.split(':').map(Number);
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    if (!zone) return new Date(y, mo - 1, d, h, mi);
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
      }).formatToParts(new Date(guess)).map((x) => [x.type, Number(x.value)]));
      const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
      return new Date(guess - (shown - guess));
    } catch {
      return new Date(y, mo - 1, d, h, mi);
    }
  }
  // shown in the location's own time, like a mosque timetable
  const clock = (d) => {
    try {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', ...(zone ? { timeZone: zone } : {}) });
    } catch {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  };
  const left = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  };
  const shortLeft = (ms) => {
    const m = Math.max(0, Math.ceil(ms / 60000));
    return m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)}` : `${m}m`;
  };

  // The cached set may be from yesterday; pick the entries that belong to today/tomorrow.
  function days() {
    if (!data) return null;
    const today = ymd(new Date());
    if (data.today?.date === today) return { today: data.today, tomorrow: data.tomorrow };
    if (data.tomorrow?.date === today) return { today: data.tomorrow, tomorrow: null };
    return null;
  }

  function nextPrayer(d, now) {
    for (const k of PRAYERS) {
      const t = at(d.today.date, d.today.times[k]);
      if (t > now) return { key: k, time: t };
    }
    if (d.tomorrow) return { key: 'fajr', time: at(d.tomorrow.date, d.tomorrow.times.fajr) };
    return null;
  }

  const FALLBACK_TIMES = {
    fajr: '04:45', sunrise: '06:12', dhuhr: '11:40', asr: '14:42', maghrib: '17:05', isha: '18:25'
  };

  function renderList(d, next, now) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const times = d?.today?.times || FALLBACK_TIMES;
    const dateStr = d?.today?.date || ymd(now);
    const order = isRamadan(d) && times.imsak ? ['imsak', ...ORDER] : ORDER;
    
    for (const k of order) {
      const timeStr = times[k] || FALLBACK_TIMES[k] || '12:00';
      const t = at(dateStr, timeStr);
      const isNext = next && next.key === k;
      const isPast = !isNext && t <= now;
      
      const pill = document.createElement('div');
      pill.className = `slim-prayer-pill ${isNext ? 'active-prayer' : ''} ${isPast ? 'past' : ''}`;
      pill.innerHTML = `
        <span class="font-bold ${isNext ? 'text-emerald-200' : 'text-zinc-200'} text-[11px]">${NAMES[k] || k}</span>
        <span class="font-mono ${isNext ? 'text-emerald-300 font-bold' : 'text-zinc-300'} text-[11px]" dir="ltr">${clock(t)}</span>
      `;
      listEl.append(pill);
    }

    if (next) {
      const lbl = document.getElementById('nextPrayerNameLabel');
      if (lbl) lbl.textContent = NAMES[next.key] || next.key;
    }
  }

  
  // Tracking for Sleep/Resume Detection & Missed Prayer Window
  let lastPrayerTick = Date.now();
  let quranWasPlayingBeforeAdhan = false;

  function handleAdhanAudioWithDucking(voice) {
    // 1. Duck or Pause Quran Radio if active
    if (window.quranRadio && window.quranRadio.state && window.quranRadio.state.isPlaying) {
      quranWasPlayingBeforeAdhan = true;
      window.quranRadio.pauseAudio();
    } else {
      quranWasPlayingBeforeAdhan = false;
    }

    // 2. Play Two Takbeers (offline Web Audio synthesis)
    if (typeof window.playTwoTakbeers === 'function') {
      window.playTwoTakbeers(voice);
    }

    // 3. Auto-resume Quran Radio 2 seconds after Takbeers complete (~5.5s + 2s = 7.5s)
    if (quranWasPlayingBeforeAdhan && window.state?.features?.adhanAutoResume !== false) {
      setTimeout(() => {
        if (window.quranRadio && window.quranRadio.state && window.quranRadio.state.isRadioMode) {
          window.quranRadio.playCurrent();
        }
        quranWasPlayingBeforeAdhan = false;
      }, 7500);
    }
  }

  // Check for wake from sleep and missed prayer within 60 minutes
  function checkWakeupPrayerCatchup(d, now) {
    if (!d || !d.today || !d.today.times) return;
    for (const k of PRAYERS) {
      const t = at(d.today.date, d.today.times[k]);
      const diff = now - t;
      const id = `${d.today.date}-${k}`;
      // If prayer passed while asleep: elapsed time is between 1 minute and 60 minutes
      if (diff > 60000 && diff < 3600000 && !fired.has(`${id}-now`)) {
        fired.add(`${id}-now`);
        const elapsedMins = Math.round(diff / 60000);
        const prayerName = NAMES[k] || k;
        if (typeof window.showToast === 'function') {
          window.showToast('prayer', '🕌 تنبيه الصلاة', `لا تفوتك صلاة ${prayerName}، مضى ${elapsedMins} دقيقة على الأذان`, 0, 7000);
        }
      }
    }
  }

  function remind(d, now) {
    const nowDelta = now - lastPrayerTick;
    if (nowDelta > 20000) {
      checkWakeupPrayerCatchup(d, now);
    }
    lastPrayerTick = now;

    if (!alertsOn) return;
    for (const k of PRAYERS) {
      const t = at(d.today.date, d.today.times[k]);
      const diff = t - now;
      const id = `${d.today.date}-${k}`;
      if (diff <= 0 && diff > -60000 && !fired.has(`${id}-now`)) {
        fired.add(`${id}-now`);
        note('🕌', `أذان ${NAMES[k]} ${clock(t)}`);
        const voice = window.state?.features?.adhanVoice || 'abdulbasit';
        handleAdhanAudioWithDucking(voice);
        // Expand island smoothly to prayer tab for dynamic island experience
        if (typeof selectTab === 'function') selectTab('prayer');
        if (typeof wake === 'function') wake(15000);

        const iftar = k === 'maghrib' && isRamadan(d) ? ' · تقبّل الله صيامك' : '';
        const shown = feat('novaPrayer') && window.playScene?.({
          who: 'nova', props: ['cap', 'rug'], arms: 'fold', tone: 'gold', badge: '☾ الأذان', lang: 'ar',
          title: 'الله أكبر، الله أكبر', quran: true,
          sub: `حان الآن موعد صلاة <b>${NAMES[k]}</b> (${clock(t)})${iftar}`,
          ms: 12000,
        });
        if (!shown) {
          island.classList.add('prayer-alert');
          showToast('prayer', `حان الآن موعد صلاة ${NAMES[k]}`, clock(t), 0, 9000);
          setTimeout(() => island.classList.remove('prayer-alert'), 9200);
        }
      } else if (diff > 0 && diff <= SOON_MIN * 60000 && diff > (SOON_MIN - 1) * 60000 && !fired.has(`${id}-soon`)) {
        fired.add(`${id}-soon`);
        showToast('prayer-soon', `${NAMES[k]} بعد ${SOON_MIN} دقائق`, clock(t), 0, 5000);
      }
    }
  }

  // Ramadan: until maghrib count down to iftar, after it to the next imsak
  function ramadan(d, now) {
    const on = isRamadan(d) && d.today.times.imsak && feat('slidePrayer');
    const rmdSlide = $('.rmd-slide');
    if (rmdSlide) rmdSlide.hidden = !on;
    const prRamadan = $('#pr-ramadan');
    if (prRamadan) prRamadan.hidden = !on;
    if (view) view.classList.toggle('ramadan', !!on);
    if (!on) return;
    const imsak = at(d.today.date, d.today.times.imsak);
    const iftar = at(d.today.date, d.today.times.maghrib);
    let label;
    let target;
    if (now >= imsak && now < iftar) {
      label = 'الإفطار';
      target = iftar;
    } else {
      label = 'الإمساك';
      target = now < imsak ? imsak : d.tomorrow?.times?.imsak ? at(d.tomorrow.date, d.tomorrow.times.imsak) : null;
    }
    if (!target) return;
    const elRmdName = $('#i-rmd-name');
    if (elRmdName) elRmdName.textContent = label;
    const elRmdTime = $('#i-rmd-time');
    if (elRmdTime) elRmdTime.textContent = clock(target);
    const elRmdLeft = $('#i-rmd-left');
    if (elRmdLeft) elRmdLeft.textContent = left(target - now);
    const ltr = (t) => `⁦${t}⁩`;
    if (prRamadan) prRamadan.textContent = `رمضان كريم · ${label} ${ltr(clock(target))} · بعد ${ltr(left(target - now))}`;
  }

  // soft descending three-note bell (shared AudioContext, renderer.js playTones)
  const chime = () => playTones([[0, 784], [0.35, 659], [0.7, 523]], { peak: 0.18, attack: 0.03, decay: 1.4 });

  let lastListKey = '';
  function tick() {
    const d = days();
    zone = d?.today?.tz || '';
    if (view) view.classList.toggle('loading', !d);
    const prSlide = $('.pr-slide');
    if (prSlide) prSlide.hidden = !d;
    const vPrItem = $('#v-pr-item');
    if (vPrItem) vPrItem.hidden = !d;
    if (!d) return;

    const now = new Date();
    const next = nextPrayer(d, now);
    if (next) {
      const ms = next.time - now;
      const elPrCount = $('#pr-count');
      if (elPrCount) elPrCount.textContent = `-${left(ms)}`;
      const lbl = document.getElementById('nextPrayerNameLabel');
      if (lbl) lbl.textContent = NAMES[next.key] || next.key;
      const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
      const EN_NAMES = { imsak: 'Imsak', fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
      const elIPrName = $('#i-pr-name');
      if (elIPrName) elIPrName.textContent = isAr ? NAMES[next.key] : EN_NAMES[next.key];
      const elIPrTime = $('#i-pr-time');
      if (elIPrTime) elIPrTime.textContent = clock(next.time);
      const elIPrLeft = $('#i-pr-left');
      if (elIPrLeft) elIPrLeft.textContent = left(ms);
      const elIPrLbl = $('#i-pr-lbl');
      if (elIPrLbl) elIPrLbl.textContent = isAr ? 'بعد' : 'in';
      const elVPrName = $('#v-pr-name');
      if (elVPrName) elVPrName.textContent = NAMES[next.key];
      const elVPrLeft = $('#v-pr-left');
      if (elVPrLeft) elVPrLeft.textContent = shortLeft(ms);
    }
    const elPrHijri = $('#pr-hijri');
    if (elPrHijri) elPrHijri.textContent = d.today.hijri || '';
    ramadan(d, now);
    const elPrCity = $('#pr-city');
    if (elPrCity) elPrCity.textContent = data?.city || 'القاهرة';
    const elPrMethod = $('#pr-method');
    if (elPrMethod) elPrMethod.textContent = d?.today?.method || '';

    // the list only changes when a prayer passes
    const key = `${d.today.date}-${next?.key}`;
    if (key !== lastListKey || !listEl || !listEl.children.length) {
      lastListKey = key;
      renderList(d, next, now);
    }
    remind(d, now);
  }

  // for the morning card: the next prayer as text
  
  // Helper for reminders: returns 'morning' (Fajr -> Dhuhr), 'evening' (Asr/Maghrib -> Isha+2h), or 'day'
  window.getPrayerPeriod = () => {
    const d = days();
    const now = new Date();
    if (d?.today?.times) {
      try {
        const fajr = at(d.today.date, d.today.times.fajr);
        const dhuhr = at(d.today.date, d.today.times.dhuhr);
        const asr = at(d.today.date, d.today.times.asr);
        const isha = at(d.today.date, d.today.times.isha);
        if (now >= fajr && now < dhuhr) return 'morning';
        if (now >= asr && now < new Date(isha.getTime() + 2 * 3600000)) return 'evening';
        return 'day';
      } catch {}
    }
    const h = now.getHours() + now.getMinutes() / 60;
    if (h >= 4.5 && h < 11.5) return 'morning';
    if (h >= 15.5 && h < 21.5) return 'evening';
    return 'day';
  };

  window.nextPrayerText = () => {
    const d = days();
    if (!d) return '';
    const now = new Date();
    const n = nextPrayer(d, now);
    return n ? `${NAMES[n.key]} ${clock(n.time)}` : '';
  };

  bridge.onPrayer((p) => {
    data = p;
    lastListKey = '';
    tick();
  });
  bridge.prayerSnapshot().then((p) => {
    if (p && !data) {
      data = p;
      tick();
    }
  });
  setInterval(tick, 1000);

  // Setup Expanded Interactive Daily Inspiration Hero Card
  function initDailyIslamicCorner() {
    const tabs = document.querySelectorAll('.pr-daily-tab');
    if (!tabs.length) return;

    const INSPIRATION_DATA = {
      dua: [
        { badge: 'دعاء الثبات', text: '«يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ، اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ»', ref: '📖 جامع الترمذي (٣٥٢٢) وصحيح مسلم (٢٦٥٤) • حديث صحيح' },
        { badge: 'دعاء الهدى والغنى', text: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى»', ref: '📖 صحيح مسلم (٢٧٢٥) • حديث صحيح' },
        { badge: 'دعاء تفريج الكرب', text: '«لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ»', ref: '📖 سورة الأنبياء ٨٧ • جامع الترمذي (٣٥٠٥)' }
      ],
      hadith: [
        { badge: 'حديث شريف', text: '«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»', ref: '📖 صحيح البخاري (٥٠٢٧) • عن عثمان بن عفان رضي الله عنه' },
        { badge: 'حديث شريف', text: '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»', ref: '📖 صحيح البخاري (١) وصحيح مسلم (١٩٠٧)' },
        { badge: 'حديث شريف', text: '«مَنْ سَلَكَ طَرِيقاً يَلْتَمِسُ فِيهِ عِلْماً، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقاً إِلَى الْجَنَّةِ»', ref: '📖 صحيح مسلم (٢٦٩٩)' }
      ],
      ayah: [
        { badge: 'آية وتدبر', text: '﴿ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾', ref: '📖 سورة الشرح (٥-٦)' },
        { badge: 'آية وتدبر', text: '﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ﴾', ref: '📖 سورة الطلاق (٢-٣)' },
        { badge: 'آية وتدبر', text: '﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾', ref: '📖 سورة الرعد (٢٨)' }
      ],
      dhikr: [
        { badge: 'سيد الاستغفار', text: '«اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ»', ref: '📖 صحيح البخاري (٦٣٠٦)' },
        { badge: 'الباقيات الصالحات', text: '«سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلا إِلَهَ إِلا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ»', ref: '📖 صحيح مسلم (٢١٣٧)' },
        { badge: 'تسبيح مضاعف', text: '«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ»', ref: '📖 صحيح مسلم (٢٧٢٦)' }
      ]
    };

    let curCat = 'dua';
    let curIdx = 0;
    let isLargeFont = false;
    let tasbihCount = 0;

    function renderActiveItem() {
      const list = INSPIRATION_DATA[curCat] || INSPIRATION_DATA.dua;
      if (curIdx >= list.length) curIdx = 0;
      if (curIdx < 0) curIdx = list.length - 1;
      const item = list[curIdx];

      const badgeEl = document.getElementById('pr-daily-badge');
      const textEl = document.getElementById('pr-daily-text');
      const refEl = document.getElementById('pr-daily-ref');
      const counterEl = document.getElementById('inspCounter');

      if (badgeEl) badgeEl.textContent = item.badge;
      if (textEl) {
        textEl.textContent = item.text;
        textEl.style.fontSize = isLargeFont ? '25px' : '21px';
      }
      if (refEl) refEl.textContent = item.ref;
      if (counterEl) counterEl.textContent = `${curIdx + 1}/${list.length}`;
    }

    // Switch on both CLICK and MOUSEOVER (hover-to-switch as requested!)
    tabs.forEach(tab => {
      const activate = () => {
        tabs.forEach(t => t.classList.remove('seg-btn-active'));
        tab.classList.add('seg-btn-active');
        curCat = tab.dataset.daily || 'dua';
        curIdx = 0;
        renderActiveItem();
      };
      tab.addEventListener('click', activate);
      tab.addEventListener('mouseover', activate);
    });

    // Font size toggle button
    const btnFont = document.getElementById('btnFontSizeToggle');
    if (btnFont) {
      btnFont.addEventListener('click', () => {
        isLargeFont = !isLargeFont;
        btnFont.textContent = isLargeFont ? 'خط عادي A-' : 'خط كبير A+';
        btnFont.classList.toggle('text-emerald-300', isLargeFont);
        renderActiveItem();
      });
    }

    // Steppers prev / next
    document.getElementById('btnPrevInsp')?.addEventListener('click', () => {
      curIdx--;
      renderActiveItem();
    });
    document.getElementById('btnNextInsp')?.addEventListener('click', () => {
      curIdx++;
      renderActiveItem();
    });

    // Copy button
    const btnCopy = document.getElementById('btnCopyInsp');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const textEl = document.getElementById('pr-daily-text');
        const refEl = document.getElementById('pr-daily-ref');
        const copyContent = `${textEl?.textContent || ''}
${refEl?.textContent || ''}`;
        try {
          await navigator.clipboard.writeText(copyContent);
          btnCopy.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(() => {
            btnCopy.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
          }, 1800);
        } catch (e) {}
      });
    }

    // Tasbih Counter pill
    const btnTasbih = document.getElementById('btnTasbihCount');
    const tasbihNum = document.getElementById('tasbihNum');
    if (btnTasbih && tasbihNum) {
      btnTasbih.addEventListener('click', () => {
        tasbihCount = (tasbihCount + 1) % 4; // Cycles 0, 1, 2, 3
        tasbihNum.textContent = String(tasbihCount);
        if (tasbihCount === 3) {
          btnTasbih.classList.add('bg-emerald-500/30', 'text-emerald-200');
        } else {
          btnTasbih.classList.remove('bg-emerald-500/30', 'text-emerald-200');
        }
      });
    }

    // Initial render
    renderActiveItem();
  }

  // Initialize once DOM is ready or after tick
  setTimeout(initDailyIslamicCorner, 100);

  tick();
})();
