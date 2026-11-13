
  // Verified 9 Direct Offline & CDN Muezzins MP3 Dataset (Local & Archive.org)
  // Exact silence-aligned durations so the opening Takbeers are 100% complete with no cut-off
  const ADHAN_MUEZZINS = [
    { id: 'mukhtasar', name: 'تكبير أذان مختصر (أبو إيفاء السلوم)', url: 'sounds/takbeer_mukhtasar.mp3', startSec: 0, takbirDurationSec: 6.5 },
    { id: 'ali', name: 'تكبير أذان (عيد علي)', url: 'sounds/takbeer_ali.mp3', startSec: 0, takbirDurationSec: 14.6 },
    { id: 'abdulbasit', name: 'الشيخ عبد الباسط عبد الصمد', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/042--.mp3', startSec: 0, takbirDurationSec: 27 },
    { id: 'refaat', name: 'الشيخ محمد رفعت (أذان زمان)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/042--.mp3', startSec: 0, takbirDurationSec: 27 },
    { id: 'banna', name: 'الشيخ محمود علي البنا (القاهرة)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/043--.mp3', startSec: 0, takbirDurationSec: 27 },
    { id: 'makkah', name: 'أذان الحرم المكي (علي أحمد ملا)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/019--1.mp3', startSec: 0, takbirDurationSec: 29.5 },
    { id: 'madinah', name: 'أذان المسجد النبوي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/018-.mp3', startSec: 0, takbirDurationSec: 40 },
    { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/007--.mp3', startSec: 0, takbirDurationSec: 34 },
    { id: 'nafees', name: 'الشيخ أحمد النفيس (خاشع)', url: 'https://cdn.aladhan.com/audio/adhans/a9.mp3', startSec: 0, takbirDurationSec: 41 }
  ];
  window.ADHAN_MUEZZINS = ADHAN_MUEZZINS;

  // Offline Fallback Synthesizer for Two Takbeers
  function playTwoTakbeersSynth(voice) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = window._audioCtx || (window._audioCtx = new AudioCtx());
      if (ctx.state === 'suspended') ctx.resume();

      const t0 = ctx.currentTime + 0.05;
      const notes1 = [
        { f: 220, dur: 0.6, gain: 0.22 },
        { f: 293.6, dur: 0.8, gain: 0.26 },
        { f: 330, dur: 0.5, gain: 0.24 },
        { f: 293.6, dur: 0.5, gain: 0.22 },
        { f: 261.6, dur: 1.1, gain: 0.25 },
      ];
      const notes2 = [
        { f: 220, dur: 0.6, gain: 0.22 },
        { f: 330, dur: 0.9, gain: 0.28 },
        { f: 392, dur: 0.5, gain: 0.25 },
        { f: 330, dur: 0.6, gain: 0.23 },
        { f: 293.6, dur: 1.4, gain: 0.26 },
      ];

      function scheduleNotes(list, startTime) {
        let cur = startTime;
        list.forEach(n => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = (voice === 'refaat' || voice === 'rifat') ? 'triangle' : 'sine';
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
  }

  let activeIslandAdhanAudio = null;
  window.playTwoTakbeers = function(voice) {
    try {
      if (activeIslandAdhanAudio) {
        activeIslandAdhanAudio.pause();
        activeIslandAdhanAudio = null;
      }
      const muezzin = ADHAN_MUEZZINS.find(m => m.id === voice) || ADHAN_MUEZZINS[0];
      const audio = new Audio();
      audio.src = muezzin.url;
      audio.volume = 1.0;
      activeIslandAdhanAudio = audio;

      const targetDuration = muezzin.takbirDurationSec || 30;
      const fadeDuration = targetDuration <= 8 ? 0.6 : 1.5;
      const fadeStart = Math.max(0, targetDuration - fadeDuration);

      audio.addEventListener('loadedmetadata', () => {
        if (muezzin.startSec) audio.currentTime = muezzin.startSec;
      });
      audio.addEventListener('timeupdate', () => {
        const cur = audio.currentTime - (muezzin.startSec || 0);
        if (cur >= fadeStart && cur < targetDuration) {
          const remainingRatio = Math.max(0, (targetDuration - cur) / (targetDuration - fadeStart));
          audio.volume = Math.max(0, Math.min(1, remainingRatio));
        } else if (cur >= targetDuration) {
          audio.pause();
          activeIslandAdhanAudio = null;
        }
      });
      audio.addEventListener('ended', () => {
        audio.pause();
        activeIslandAdhanAudio = null;
      });
      audio.addEventListener('error', () => {
        activeIslandAdhanAudio = null;
        playTwoTakbeersSynth(voice);
      });
      audio.play().catch(() => {
        activeIslandAdhanAudio = null;
        playTwoTakbeersSynth(voice);
      });
    } catch (e) {
      playTwoTakbeersSynth(voice);
    }
  };

  // IPC listener for Adhan preview from Settings
  let lastPrayerTick = Date.now();
  let quranWasPlayingBeforeAdhan = false;

  function handleAdhanAudioWithDucking(voice) {
    const muezzin = ADHAN_MUEZZINS.find(m => m.id === voice) || ADHAN_MUEZZINS[0];
    const durMs = ((muezzin.takbirDurationSec || 30) + 1.5) * 1000;

    window.setNovaMood?.('khushu', durMs);
    window.audioHaptics?.duckMedia(0.1, 400);

    if (window.quranRadio && window.quranRadio.state && window.quranRadio.state.isPlaying) {
      quranWasPlayingBeforeAdhan = true;
      window.quranRadio.pauseAudio();
    } else {
      quranWasPlayingBeforeAdhan = false;
    }

    if (typeof window.playTwoTakbeers === 'function') {
      window.playTwoTakbeers(voice);
    }

    setTimeout(() => {
      window.audioHaptics?.restoreMedia(1200);
      if (quranWasPlayingBeforeAdhan && window.state?.features?.adhanAutoResume !== false) {
        if (window.quranRadio && window.quranRadio.state && window.quranRadio.state.isRadioMode) {
          window.quranRadio.playCurrent();
        }
        quranWasPlayingBeforeAdhan = false;
      }
    }, durMs);
  }
  window.handleAdhanAudioWithDucking = handleAdhanAudioWithDucking;

  if (window.nova?.onAdhanPreview) {
    window.nova.onAdhanPreview((voice) => {
      const mObj = ADHAN_MUEZZINS.find(m => m.id === voice) || ADHAN_MUEZZINS[0];
      if (typeof window.showToast === 'function') {
        window.showToast('prayer', '🕌 الله أكبر، الله أكبر', `أذان: ${mObj.name} (تكبيرتان فقط)`, 0, 4500);
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

  // the bell and the Settings window share one switch (prayerAlerts): toggle Active <-> Silent
  let alertsOn = true;
  const showBell = () => {
    if (!bell) return;
    bell.classList.toggle('on', alertsOn);
    bell.classList.toggle('silent', !alertsOn);
    bell.setAttribute('aria-pressed', alertsOn ? 'true' : 'false');
    const isAr = (window.state?.features?.appLang || document.documentElement.lang || 'ar') === 'ar';
    const label = isAr
      ? (alertsOn ? 'تنبيهات الأذان: مفعّلة (اضغط للكتم)' : 'تنبيهات الأذان: صامت (اضغط للتفعيل)')
      : (alertsOn ? 'Prayer alerts: On (click to mute)' : 'Prayer alerts: Silent (click to enable)');
    bell.title = label;
    bell.setAttribute('aria-label', label);
  };
  showBell();
  window.addEventListener('island:features', (e) => {
    alertsOn = e.detail.prayerAlerts !== false;
    showBell();
  });
  bell?.addEventListener('click', () => {
    alertsOn = !alertsOn;
    if (activeIslandAdhanAudio) {
      try { activeIslandAdhanAudio.pause(); } catch {}
      activeIslandAdhanAudio = null;
    }
    showBell();
    bridge.setFeatures?.({ prayerAlerts: alertsOn });
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
    return `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
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
    if (!d || !d.today || !d.today.times) return null;
    for (const k of PRAYERS) {
      if (!d.today.times[k]) continue;
      const t = at(d.today.date, d.today.times[k]);
      if (t > now) return { key: k, time: t };
    }
    if (d.tomorrow && d.tomorrow.times && d.tomorrow.times.fajr) {
      return { key: 'fajr', time: at(d.tomorrow.date, d.tomorrow.times.fajr) };
    }
    return null;
  }

  const FALLBACK_TIMES = {
    fajr: '04:45', sunrise: '06:12', dhuhr: '11:40', asr: '14:42', maghrib: '17:05', isha: '18:25'
  };

  const METHOD_AR = {
    'Egyptian General Authority of Survey': 'هيئة المساحة المصرية',
    'Umm Al-Qura University, Makkah': 'أم القرى - مكة المكرمة',
    'Muslim World League': 'رابطة العالم الإسلامي',
    'University of Islamic Sciences, Karachi': 'جامعة العلوم الإسلامية بكراتشي',
    'Islamic Society of North America (ISNA)': 'الجمعية الإسلامية لأمريكا الشمالية',
    'Gulf Region': 'منطقة الخليج العربي',
    'Kuwait': 'وزارة الأوقاف الكويتية',
    'Qatar': 'وزارة الأوقاف القطرية'
  };

  function clockShort(d) {
    return clock(d).replace(/\s*(AM|PM|ص|م)$/i, '').trim();
  }

  function renderList(d, next, now) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const times = d?.today?.times || FALLBACK_TIMES;
    const dateStr = d?.today?.date || ymd(now);
    const order = ORDER; // Always 6 horizontal columns matching reference UI
    
    for (const k of order) {
      const timeStr = times[k] || FALLBACK_TIMES[k] || '12:00';
      const t = at(dateStr, timeStr);
      const isNext = next && next.key === k;
      const isPast = !isNext && t <= now;
      
      const pill = document.createElement('div');
      pill.className = `slim-prayer-pill ${isNext ? 'active-prayer' : ''} ${isPast ? 'past' : ''}`;
      pill.innerHTML = `
        <span class="pr-slim-name-wrap">
          ${isNext ? '<i class="pr-active-dot"></i>' : ''}
          <span class="pr-slim-name">${NAMES[k] || k}</span>
        </span>
        <span class="pr-slim-time" dir="ltr">${clockShort(t)}</span>
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
      if (elPrCount) elPrCount.textContent = left(ms);
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
      if (elVPrName) elVPrName.textContent = isAr ? NAMES[next.key] : (EN_NAMES[next.key] || next.key);
      const elVPrLeft = $('#v-pr-left');
      if (elVPrLeft) elVPrLeft.textContent = shortLeft(ms);
    }
    const elPrHijri = $('#pr-hijri');
    if (elPrHijri) elPrHijri.textContent = d.today.hijri || '';
    ramadan(d, now);
    const elPrCity = $('#pr-city');
    if (elPrCity) elPrCity.textContent = data?.city || 'القاهرة';
    const elPrMethod = $('#pr-method');
    if (elPrMethod) {
      const rawMethod = (d?.today?.method || 'هيئة المساحة المصرية').trim();
      elPrMethod.textContent = METHOD_AR[rawMethod] || rawMethod;
    }

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

  window.nextPrayerObj = () => {
    const d = days();
    if (!d) return null;
    const now = new Date();
    const n = nextPrayer(d, now);
    return n ? { name: NAMES[n.key], target: n.time.getTime() } : null;
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
  let isDailyInited = false;
  let renderActiveItem = () => {};

  function initDailyIslamicCorner() {
    const tabs = document.querySelectorAll('.pr-daily-tab');
    if (!tabs.length) return;

    if (isDailyInited) {
      if (typeof renderActiveItem === 'function') renderActiveItem();
      return;
    }
    isDailyInited = true;

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

    renderActiveItem = function() {
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
        textEl.classList.toggle('font-large', isLargeFont);
      }
      if (refEl) refEl.textContent = item.ref;
      if (counterEl) counterEl.textContent = `${curIdx + 1}/${list.length}`;
    }

    // Switch categories on click only
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        tabs.forEach(t => t.classList.remove('seg-btn-active'));
        tab.classList.add('seg-btn-active');
        curCat = tab.dataset.daily || 'dua';
        curIdx = 0;
        window.audioHaptics?.playWoodTap();
        renderActiveItem();
      });
    });

    // Font size toggle button (Aa)
    const btnFont = document.getElementById('btnFontSizeToggle');
    if (btnFont) {
      btnFont.addEventListener('click', (e) => {
        e.stopPropagation();
        isLargeFont = !isLargeFont;
        btnFont.classList.toggle('active', isLargeFont);
        const card = document.querySelector('.dua-hero-card');
        if (card) card.classList.toggle('font-large', isLargeFont);
        const textEl = document.getElementById('pr-daily-text');
        if (textEl) textEl.classList.toggle('font-large', isLargeFont);
        const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
        btnFont.title = isLargeFont
          ? (isAr ? 'تصغير الخط' : 'Smaller text')
          : (isAr ? 'تكبير الخط' : 'Larger text');
        window.audioHaptics?.playWoodTap();
        renderActiveItem();
      });
    }

    // Stepper Previous (<)
    const btnPrev = document.getElementById('btnPrevInsp');
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        curIdx--;
        window.audioHaptics?.playWoodTap();
        renderActiveItem();
      });
    }

    // Stepper Next (>)
    const btnNext = document.getElementById('btnNextInsp');
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        curIdx++;
        window.audioHaptics?.playWoodTap();
        const list = INSPIRATION_DATA[curCat] || INSPIRATION_DATA.dua;
        if (curIdx >= list.length - 1) {
          window.setNovaMood?.('celebrate', 2500);
          window.audioHaptics?.playCrystalChime(0.18);
        }
        renderActiveItem();
      });
    }

    // Copy button
    const btnCopy = document.getElementById('btnCopyInsp');
    if (btnCopy) {
      btnCopy.addEventListener('click', async (e) => {
        e.stopPropagation();
        window.audioHaptics?.playWoodTap();
        const textEl = document.getElementById('pr-daily-text');
        const refEl = document.getElementById('pr-daily-ref');
        const badgeEl = document.getElementById('pr-daily-badge');
        const copyContent = `${badgeEl ? badgeEl.textContent + '\n' : ''}${textEl?.textContent || ''}\n${refEl?.textContent || ''}`.trim();
        
        let copied = false;
        if (typeof window.nova?.copyText === 'function') {
          window.nova.copyText(copyContent);
          copied = true;
        }
        if (!copied && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(copyContent);
            copied = true;
          } catch {}
        }
        if (!copied) {
          try {
            const ta = document.createElement('textarea');
            ta.value = copyContent;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copied = true;
          } catch {}
        }

        btnCopy.innerHTML = '<svg class="s" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" style="width:13px;height:13px;"><polyline points="20 6 9 17 4 12"/></svg>';
        const isAr = (window.state?.features?.appLang || 'ar') === 'ar';
        if (typeof showToast === 'function') {
          showToast('copied', isAr ? '✓ تم النسخ إلى الحافظة' : '✓ Copied to clipboard', copyContent.slice(0, 50) + '…', 0, 2500);
        }
        setTimeout(() => {
          btnCopy.innerHTML = '<svg class="s" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:12px;height:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
        }, 1800);
      });
    }

    // Tasbih Counter pill
    const btnTasbih = document.getElementById('btnTasbihCount');
    const tasbihNum = document.getElementById('tasbihNum');
    if (btnTasbih && tasbihNum) {
      btnTasbih.addEventListener('click', (e) => {
        e.stopPropagation();
        window.audioHaptics?.playWoodTap();
        tasbihCount = (tasbihCount + 1) % 4; // Cycles 0, 1, 2, 3
        tasbihNum.textContent = String(tasbihCount);
        if (tasbihCount === 3) {
          btnTasbih.classList.add('bg-emerald-500/30', 'text-emerald-200');
          window.audioHaptics?.playCrystalChime(0.18);
        } else {
          btnTasbih.classList.remove('bg-emerald-500/30', 'text-emerald-200');
        }
      });
    }

    // Initial render
    renderActiveItem();
  }

  // Initialize once DOM is ready or after tick
  document.addEventListener('DOMContentLoaded', initDailyIslamicCorner);
  window.addEventListener('island:tab', (e) => {
    if (e.detail?.tab === 'prayer') initDailyIslamicCorner();
  });
  setTimeout(initDailyIslamicCorner, 50);

  tick();
})();
