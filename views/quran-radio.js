// ============================================================================
// HyperNova — Quran Radio & Interactive Recitation Engine (راديو القرآن الكريم)
// Compact Dynamic Island Mode · Gapless Audio Streaming · Free APIs (No Auth)
// 100% Vector SVG Icon System (Zero Emojis) · Offline Cache · Media Session
// ============================================================================

(function () {
  'use strict';

  // --- SVG ICON SYSTEM (PIXEL-PERFECT APPLE HIG DESIGN) ---
  const SVG_ICONS = {
    radio: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2.5" y="7" width="19" height="14" rx="3.5"></rect>
      <path d="M16 3.5l-5 3.5"></path>
      <circle cx="7.5" cy="14" r="2.5"></circle>
      <path d="M14 11h4M14 14h4M14 17h2"></path>
    </svg>`,
    prev: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M6 5h2.2v14H6zm12 1.4-8 5.6 8 5.6z"/>
    </svg>`,
    next: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M15.8 5h2.2v14h-2.2zm-11.8 1.4l8 5.6-8 5.6z"/>
    </svg>`,
    play: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <polygon points="7 4 19 12 7 20 7 4"/>
    </svg>`,
    pause: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1.5"/>
      <rect x="14" y="5" width="4" height="14" rx="1.5"/>
    </svg>`,
    
    repeatSurah: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
    repeatAyah: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><circle cx="12" cy="12" r="3.5" fill="rgba(16, 185, 129, 0.25)" stroke="#34d399" stroke-width="1.2"/><text x="12" y="14" font-size="7" font-weight="900" fill="#34d399" text-anchor="middle" font-family="sans-serif">1</text></svg>`,
    repeatAuto: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><circle cx="6" cy="12" r="2.5" fill="currentColor"/><path d="M12 6a6 6 0 0 1 6 6"/></svg>`,

    repeat: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m17 2 4 4-4 4"></path>
      <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
      <path d="m7 22-4-4 4-4"></path>
      <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
    </svg>`,
    broadcast: `<svg class="qr-svg-ico" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path>
      <path d="M7.76 16.24a6 6 0 0 1 0-8.48"></path>
      <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
      <path d="M16.24 7.76a6 6 0 0 1 0 8.48"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>`,
    microphone: `<svg class="qr-pill-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
      <path d="M12 18v4"></path>
      <path d="M8 22h8"></path>
    </svg>`,
    book: `<svg class="qr-pill-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>`,
    star: `<svg class="qr-star-ico" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,
    chevronDown: `<svg class="qr-arr-ico" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>`,
    mosque: `<svg class="qr-dome-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C8 6 5 8 5 13v7h14v-7c0-5-3-7-7-11Z"></path>
      <path d="M9 20v-4a3 3 0 0 1 6 0v4"></path>
      <line x1="12" y1="2" x2="12" y2="0.5"></line>
    </svg>`
  };

  // --- 1. DATASET: 10 FAMOUS RECITERS (EGYPT & ISLAMIC WORLD) ---
  const QURAN_RECITERS = [
    {
      id: 'husary',
      name: 'محمود خليل الحصري',
      shortName: 'الحصري (مرتل)',
      country: 'مصر',
      style: 'مرتل • 128kbps',
      subfolder: 'Husary_128kbps',
      radioUrl: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary'
    },
    {
      id: 'minshawy',
      name: 'محمد صديق المنشاوي',
      shortName: 'المنشاوي (مرتل)',
      country: 'مصر',
      style: 'مرتل • 128kbps',
      subfolder: 'Minshawy_Murattal_128kbps',
      radioUrl: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi'
    },
    {
      id: 'abdulbasit',
      name: 'عبد الباسط عبد الصمد',
      shortName: 'عبد الباسط (مرتل)',
      country: 'مصر',
      style: 'مرتل • 192kbps',
      subfolder: 'Abdul_Basit_Murattal_192kbps',
      radioUrl: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad'
    },
    {
      id: 'banna',
      name: 'محمود علي البنا',
      shortName: 'محمود علي البنا',
      country: 'مصر',
      style: 'مرتل • 32kbps',
      subfolder: 'mahmoud_ali_al_banna_32kbps',
      radioUrl: 'https://backup.qurango.net/radio/mahmoud_ali__albanna'
    },
    {
      id: 'abdulbasit_muj',
      name: 'عبد الباسط عبد الصمد (مجود)',
      shortName: 'عبد الباسط (مجود)',
      country: 'مصر',
      style: 'مجود • 128kbps',
      subfolder: 'Abdul_Basit_Mujawwad_128kbps',
      radioUrl: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad'
    },
    {
      id: 'mustafa',
      name: 'مصطفى إسماعيل',
      shortName: 'مصطفى إسماعيل',
      country: 'مصر',
      style: 'مرتل • 128kbps',
      subfolder: 'Mustafa_Ismail_48kbps',
      radioUrl: 'https://backup.qurango.net/radio/mustafa_ismail'
    },
    {
      id: 'tablawy',
      name: 'محمد محمود الطبلاوي',
      shortName: 'الطبلاوي',
      country: 'مصر',
      style: 'مرتل • 128kbps',
      subfolder: 'Mohammad_al_Tablaway_128kbps',
      radioUrl: 'https://backup.qurango.net/radio/tarateel'
    },
    {
      id: 'alafasy',
      name: 'مشاري راشد العفاسي',
      shortName: 'العفاسي',
      country: 'الكويت',
      style: 'مرتل • 128kbps',
      subfolder: 'Alafasy_128kbps',
      radioUrl: 'https://backup.qurango.net/radio/mishary_alafasi'
    },
    {
      id: 'sudais',
      name: 'عبد الرحمن السديس',
      shortName: 'السديس (الحرم)',
      country: 'السعودية',
      style: 'مرتل • 192kbps',
      subfolder: 'Abdurrahmaan_As-Sudais_192kbps',
      radioUrl: 'https://backup.qurango.net/radio/abdulrahman_alsudaes'
    },
    {
      id: 'muaiqly',
      name: 'ماهر المعيقلي',
      shortName: 'المعيقلي (الحرم)',
      country: 'السعودية',
      style: 'مرتل • 128kbps',
      subfolder: 'Maher_AlMuaiqly_64kbps',
      radioUrl: 'https://backup.qurango.net/radio/maher'
    }
  ];

  // --- 2. DATASET: ALL 114 SURAHS (6,236 TOTAL AYAT CHECKSUM) ---
  const SURAHS_114 = [
    { id: 1, name: 'الفاتحة', ayahCount: 7, type: 'مكية' },
    { id: 2, name: 'البقرة', ayahCount: 286, type: 'مدنية' },
    { id: 3, name: 'آل عمران', ayahCount: 200, type: 'مدنية' },
    { id: 4, name: 'النساء', ayahCount: 176, type: 'مدنية' },
    { id: 5, name: 'المائدة', ayahCount: 120, type: 'مدنية' },
    { id: 6, name: 'الأنعام', ayahCount: 165, type: 'مكية' },
    { id: 7, name: 'الأعراف', ayahCount: 206, type: 'مكية' },
    { id: 8, name: 'الأنفال', ayahCount: 75, type: 'مدنية' },
    { id: 9, name: 'التوبة', ayahCount: 129, type: 'مدنية' },
    { id: 10, name: 'يونس', ayahCount: 109, type: 'مكية' },
    { id: 11, name: 'هود', ayahCount: 123, type: 'مكية' },
    { id: 12, name: 'يوسف', ayahCount: 111, type: 'مكية' },
    { id: 13, name: 'الرعد', ayahCount: 43, type: 'مدنية' },
    { id: 14, name: 'إبراهيم', ayahCount: 52, type: 'مكية' },
    { id: 15, name: 'الحجر', ayahCount: 99, type: 'مكية' },
    { id: 16, name: 'النحل', ayahCount: 128, type: 'مكية' },
    { id: 17, name: 'الإسراء', ayahCount: 111, type: 'مكية' },
    { id: 18, name: 'الكهف', ayahCount: 110, type: 'مكية' },
    { id: 19, name: 'مريم', ayahCount: 98, type: 'مكية' },
    { id: 20, name: 'طه', ayahCount: 135, type: 'مكية' },
    { id: 21, name: 'الأنبياء', ayahCount: 112, type: 'مكية' },
    { id: 22, name: 'الحج', ayahCount: 78, type: 'مدنية' },
    { id: 23, name: 'المؤمنون', ayahCount: 118, type: 'مكية' },
    { id: 24, name: 'النور', ayahCount: 64, type: 'مدنية' },
    { id: 25, name: 'الفرقان', ayahCount: 77, type: 'مكية' },
    { id: 26, name: 'الشعراء', ayahCount: 227, type: 'مكية' },
    { id: 27, name: 'النمل', ayahCount: 93, type: 'مكية' },
    { id: 28, name: 'القصص', ayahCount: 88, type: 'مكية' },
    { id: 29, name: 'العنكبوت', ayahCount: 69, type: 'مكية' },
    { id: 30, name: 'الروم', ayahCount: 60, type: 'مكية' },
    { id: 31, name: 'لقمان', ayahCount: 34, type: 'مكية' },
    { id: 32, name: 'السجدة', ayahCount: 30, type: 'مكية' },
    { id: 33, name: 'الأحزاب', ayahCount: 73, type: 'مدنية' },
    { id: 34, name: 'سبأ', ayahCount: 54, type: 'مكية' },
    { id: 35, name: 'فاطر', ayahCount: 45, type: 'مكية' },
    { id: 36, name: 'يس', ayahCount: 83, type: 'مكية' },
    { id: 37, name: 'الصافات', ayahCount: 182, type: 'مكية' },
    { id: 38, name: 'ص', ayahCount: 88, type: 'مكية' },
    { id: 39, name: 'الزمر', ayahCount: 75, type: 'مكية' },
    { id: 40, name: 'غافر', ayahCount: 85, type: 'مكية' },
    { id: 41, name: 'فصلت', ayahCount: 54, type: 'مكية' },
    { id: 42, name: 'الشورى', ayahCount: 53, type: 'مكية' },
    { id: 43, name: 'الزخرف', ayahCount: 89, type: 'مكية' },
    { id: 44, name: 'الدخان', ayahCount: 59, type: 'مكية' },
    { id: 45, name: 'الجاثية', ayahCount: 37, type: 'مكية' },
    { id: 46, name: 'الأحقاف', ayahCount: 35, type: 'مكية' },
    { id: 47, name: 'محمد', ayahCount: 38, type: 'مدنية' },
    { id: 48, name: 'الفتح', ayahCount: 29, type: 'مدنية' },
    { id: 49, name: 'الحجرات', ayahCount: 18, type: 'مدنية' },
    { id: 50, name: 'ق', ayahCount: 45, type: 'مكية' },
    { id: 51, name: 'الذاريات', ayahCount: 60, type: 'مكية' },
    { id: 52, name: 'الطور', ayahCount: 49, type: 'مكية' },
    { id: 53, name: 'النجم', ayahCount: 62, type: 'مكية' },
    { id: 54, name: 'القمر', ayahCount: 55, type: 'مكية' },
    { id: 55, name: 'الرحمن', ayahCount: 78, type: 'مدنية' },
    { id: 56, name: 'الواقعة', ayahCount: 96, type: 'مكية' },
    { id: 57, name: 'الحديد', ayahCount: 29, type: 'مدنية' },
    { id: 58, name: 'المجادلة', ayahCount: 22, type: 'مدنية' },
    { id: 59, name: 'الحشر', ayahCount: 24, type: 'مدنية' },
    { id: 60, name: 'الممتحنة', ayahCount: 13, type: 'مدنية' },
    { id: 61, name: 'الصف', ayahCount: 14, type: 'مدنية' },
    { id: 62, name: 'الجمعة', ayahCount: 11, type: 'مدنية' },
    { id: 63, name: 'المنافقون', ayahCount: 11, type: 'مدنية' },
    { id: 64, name: 'التغابن', ayahCount: 18, type: 'مدنية' },
    { id: 65, name: 'الطلاق', ayahCount: 12, type: 'مدنية' },
    { id: 66, name: 'التحريم', ayahCount: 12, type: 'مدنية' },
    { id: 67, name: 'الملك', ayahCount: 30, type: 'مكية' },
    { id: 68, name: 'القلم', ayahCount: 52, type: 'مكية' },
    { id: 69, name: 'الحاقة', ayahCount: 52, type: 'مكية' },
    { id: 70, name: 'المعارج', ayahCount: 44, type: 'مكية' },
    { id: 71, name: 'نوح', ayahCount: 28, type: 'مكية' },
    { id: 72, name: 'الجن', ayahCount: 28, type: 'مكية' },
    { id: 73, name: 'المزمل', ayahCount: 20, type: 'مكية' },
    { id: 74, name: 'المدثر', ayahCount: 56, type: 'مكية' },
    { id: 75, name: 'القيامة', ayahCount: 40, type: 'مكية' },
    { id: 76, name: 'الإنسان', ayahCount: 31, type: 'مدنية' },
    { id: 77, name: 'المرسلات', ayahCount: 50, type: 'مكية' },
    { id: 78, name: 'النبأ', ayahCount: 40, type: 'مكية' },
    { id: 79, name: 'النازعات', ayahCount: 46, type: 'مكية' },
    { id: 80, name: 'عبس', ayahCount: 42, type: 'مكية' },
    { id: 81, name: 'التكوير', ayahCount: 29, type: 'مكية' },
    { id: 82, name: 'الانفطار', ayahCount: 19, type: 'مكية' },
    { id: 83, name: 'المطففين', ayahCount: 36, type: 'مكية' },
    { id: 84, name: 'الانشقاق', ayahCount: 25, type: 'مكية' },
    { id: 85, name: 'البروج', ayahCount: 22, type: 'مكية' },
    { id: 86, name: 'الطارق', ayahCount: 17, type: 'مكية' },
    { id: 87, name: 'الأعلى', ayahCount: 19, type: 'مكية' },
    { id: 88, name: 'الغاشية', ayahCount: 26, type: 'مكية' },
    { id: 89, name: 'الفجر', ayahCount: 30, type: 'مكية' },
    { id: 90, name: 'البلد', ayahCount: 20, type: 'مكية' },
    { id: 91, name: 'الشمس', ayahCount: 15, type: 'مكية' },
    { id: 92, name: 'الليل', ayahCount: 21, type: 'مكية' },
    { id: 93, name: 'الضحى', ayahCount: 11, type: 'مكية' },
    { id: 94, name: 'الشرح', ayahCount: 8, type: 'مكية' },
    { id: 95, name: 'التين', ayahCount: 8, type: 'مكية' },
    { id: 96, name: 'العلق', ayahCount: 19, type: 'مكية' },
    { id: 97, name: 'القدر', ayahCount: 5, type: 'مكية' },
    { id: 98, name: 'البينة', ayahCount: 8, type: 'مدنية' },
    { id: 99, name: 'الزلزلة', ayahCount: 8, type: 'مدنية' },
    { id: 100, name: 'العاديات', ayahCount: 11, type: 'مكية' },
    { id: 101, name: 'القارعة', ayahCount: 11, type: 'مكية' },
    { id: 102, name: 'التكاثر', ayahCount: 8, type: 'مكية' },
    { id: 103, name: 'العصر', ayahCount: 3, type: 'مكية' },
    { id: 104, name: 'الهمزة', ayahCount: 9, type: 'مكية' },
    { id: 105, name: 'الفيل', ayahCount: 5, type: 'مكية' },
    { id: 106, name: 'قريش', ayahCount: 4, type: 'مكية' },
    { id: 107, name: 'الماعون', ayahCount: 7, type: 'مكية' },
    { id: 108, name: 'الكوثر', ayahCount: 3, type: 'مكية' },
    { id: 109, name: 'الكافرون', ayahCount: 6, type: 'مكية' },
    { id: 110, name: 'النصر', ayahCount: 3, type: 'مدنية' },
    { id: 111, name: 'المسد', ayahCount: 5, type: 'مكية' },
    { id: 112, name: 'الإخلاص', ayahCount: 4, type: 'مكية' },
    { id: 113, name: 'الفلق', ayahCount: 5, type: 'مكية' },
    { id: 114, name: 'الناس', ayahCount: 6, type: 'مكية' }
  ];

  // Verify Checksum: Total Ayat in Hafs Quran is 6,236
  const TOTAL_AYAT_CHECKSUM = SURAHS_114.reduce((sum, s) => sum + s.ayahCount, 0);
  if (TOTAL_AYAT_CHECKSUM !== 6236) {
    console.error('[quran-radio] Integrity checksum mismatch:', TOTAL_AYAT_CHECKSUM);
  }

  // --- 3. STATE & OFFLINE PERSISTENCE ---
  const STORAGE_KEY = 'hypernova_quran_radio_v2';
  const CACHE_KEY = 'hypernova_quran_cache_v2';

  let state = {
    isRadioMode: false,
    isLiveStream: false,
    reciterId: 'husary',
    surah: 1,
    ayah: 1,
    repeatMode: 'S', // 'S' = repeat surah, '1' = repeat ayah, 'A' = auto-advance
    playbackSpeed: 1.0,
    isPlaying: false,
    favorites: [1, 18, 36, 55, 67, 112, 113, 114],
    volume: 0.8
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
      state.isPlaying = false; // Always start paused on boot
    }
  } catch (e) {
    console.warn('[quran-radio] parse state error:', e);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isRadioMode: state.isRadioMode,
        isLiveStream: state.isLiveStream,
        reciterId: state.reciterId,
        surah: state.surah,
        ayah: state.ayah,
        repeatMode: state.repeatMode,
        playbackSpeed: state.playbackSpeed,
        favorites: state.favorites,
        volume: state.volume
      }));
    } catch (e) {}
  }

  // Local persistent memory for Uthmani verse texts
  let localCache = {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) localCache = JSON.parse(cached);
  } catch (e) {
    localCache = {};
  }

  function saveVerseToCache(key, text) {
    localCache[key] = text;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(localCache));
    } catch (e) {
      // LRU evict if quota reached
      const keys = Object.keys(localCache);
      if (keys.length > 300) {
        delete localCache[keys[0]];
      }
    }
  }

  // Calculate local Quran & audio cache size in Megabytes
  function getCacheSizeMb() {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('hypernova_quran') || k.startsWith('hypernova_audio'))) {
          totalBytes += (localStorage.getItem(k) || '').length * 2;
        }
      }
      return (totalBytes / (1024 * 1024)).toFixed(2);
    } catch (e) {
      return '0.00';
    }
  }

  function clearQuranCache() {
    try {
      localCache = {};
      localStorage.removeItem(CACHE_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('hypernova_audio_cache')) {
          localStorage.removeItem(k);
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- 4. DUAL HTML5 AUDIO ENGINE FOR GAPLESS PLAYBACK ---
  let primaryAudio = new Audio();
  let preloaderAudio = new Audio();
  primaryAudio.volume = state.volume;
  preloaderAudio.volume = state.volume;

  function getReciter() {
    return QURAN_RECITERS.find(r => r.id === state.reciterId) || QURAN_RECITERS[0];
  }

  function getSurah(id) {
    return SURAHS_114.find(s => s.id === (id || state.surah)) || SURAHS_114[0];
  }

  function buildAyahAudioUrl(reciter, surah, ayah) {
    const s = String(surah).padStart(3, '0');
    const a = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciter.subfolder}/${s}${a}.mp3`;
  }

  function buildAyahAudioFallbackUrl(reciter, surah, ayah) {
    const sStr = String(surah).padStart(3, '0');
    const aStr = String(ayah).padStart(3, '0');
    const fileName = `${sStr}${aStr}.mp3`;
    const subfolder = reciter.subfolder || 'Husary_128kbps';
    // Mustafa Ismail & Al-Banna subfolders are hosted directly on EveryAyah main CDN
    if (reciter.id === 'mustafa' || reciter.id === 'banna') {
      return `https://everyayah.com/data/${subfolder}/${fileName}?r=2`;
    }
    // High-speed CDN mirror for EveryAyah with the same exact reciter voice
    return `https://mirrors.quranicaudio.com/everyayah/${subfolder}/${fileName}`;
  }

  // Live SVG Artwork Generator for Quran Radio (Sacred Geometric Mandala matching Reference)
  function generateQuranArtworkSvg(titleText, subtitleText) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <radialGradient id="bg" cx="35%" cy="25%" r="85%">
            <stop offset="0%" stop-color="#3a2f21" />
            <stop offset="45%" stop-color="#17191c" />
            <stop offset="100%" stop-color="#0b0d10" />
          </radialGradient>
        </defs>
        <rect width="300" height="300" rx="36" fill="url(#bg)" />
        <g transform="translate(150, 140)" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <!-- Outer 8-point rosettes -->
          <g stroke="#10b981" stroke-width="1.3" opacity="0.45">
            <rect x="-72" y="-72" width="144" height="144" rx="8" />
            <rect x="-72" y="-72" width="144" height="144" rx="8" transform="rotate(45)" />
            <rect x="-72" y="-72" width="144" height="144" rx="8" transform="rotate(22.5)" />
            <rect x="-72" y="-72" width="144" height="144" rx="8" transform="rotate(67.5)" />
          </g>
          <!-- Middle golden geometric stars -->
          <g stroke="#d97706" stroke-width="1.4" opacity="0.65">
            <rect x="-46" y="-46" width="92" height="92" rx="4" />
            <rect x="-46" y="-46" width="92" height="92" rx="4" transform="rotate(45)" />
            <circle r="54" stroke-dasharray="3,4" />
          </g>
          <!-- Inner star mandala -->
          <g stroke="#fbbf24" stroke-width="1.4" opacity="0.8">
            <rect x="-24" y="-24" width="48" height="48" rx="2" />
            <rect x="-24" y="-24" width="48" height="48" rx="2" transform="rotate(45)" />
            <circle r="12" stroke="#10b981" stroke-width="1.5" />
          </g>
        </g>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Preload next Ayah audio to ensure seamless gapless transition
  function preloadNextAyah() {
    if (state.isLiveStream) return;
    const curSurah = getSurah();
    let nextAyah = state.ayah + 1;
    let nextSurah = state.surah;
    if (nextAyah > curSurah.ayahCount) {
      if (state.repeatMode === 'S') {
        nextAyah = 1;
      } else if (state.repeatMode === 'A') {
        nextSurah = (state.surah % 114) + 1;
        nextAyah = 1;
      } else {
        return;
      }
    }
    const reciter = getReciter();
    preloaderAudio.src = buildAyahAudioUrl(reciter, nextSurah, nextAyah);
    preloaderAudio.load();
  }

  // Built-in Offline Uthmani Text for common Surahs
  const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function toArabicDigits(num) {
    return String(num).split('').map(d => ARABIC_DIGITS[parseInt(d, 10)] || d).join('');
  }

  const OFFLINE_BUILTIN_AYAT = {
    '1:1': 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝١',
    '1:2': 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝٢',
    '1:3': 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝٣',
    '1:4': 'مَٰلِكِ يَوْمِ ٱلدِّينِ ۝٤',
    '1:5': 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝٥',
    '1:6': 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ۝٦',
    '1:7': 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ ۝٧',
    '112:1': 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١',
    '112:2': 'ٱللَّهُ ٱلصَّمَدُ ۝٢',
    '112:3': 'لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣',
    '112:4': 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ ۝٤',
    '113:1': 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝١',
    '113:2': 'مِن شَرِّ مَا خَلَقَ ۝٢',
    '113:3': 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝٣',
    '113:4': 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِي ٱلْعُقَدِ ۝٤',
    '113:5': 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝٥',
    '114:1': 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝١',
    '114:2': 'مَلِكِ ٱلنَّاسِ ۝٢',
    '114:3': 'إِلَٰهِ ٱلنَّاسِ ۝٣',
    '114:4': 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝٤',
    '114:5': 'ٱلَّذِي يُوَسْوِسُ فِي صُدُورِ ٱلنَّاسِ ۝٥',
    '114:6': 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ ۝٦',
    '2:255': 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ ۝٢٥٥'
  };

  // Fetch Uthmani Ayah text with caching & offline fallback
  async function fetchAyahText(surah, ayah) {
    const key = `${surah}:${ayah}`;
    if (OFFLINE_BUILTIN_AYAT[key]) return OFFLINE_BUILTIN_AYAT[key];
    if (localCache[key]) return localCache[key];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/quran-uthmani`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('API status: ' + res.status);
      const data = await res.json();
      if (data && data.data && data.data.text) {
        let text = data.data.text.trim();
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        if (surah !== 1 && ayah === 1 && text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
          text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
        }
        text = `${text} ۝${toArabicDigits(ayah)}`;
        saveVerseToCache(key, text);
        return text;
      }
    } catch (e) {
      console.warn('[quran-radio] text fetch error/offline:', e);
    }

    const surahObj = getSurah(surah);
    return `سورة ${surahObj.name} — الآية (${ayah} من ${surahObj.ayahCount})`;
  }

  // Hardware Media Session API sync
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const reciter = getReciter();
    const surahObj = getSurah();

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.isLiveStream ? `إذاعة ${reciter.name} (بث مباشر 24 ساعة)` : `سورة ${surahObj.name} · الآية ${state.ayah}/${surahObj.ayahCount}`,
      artist: reciter.name,
      album: 'راديو القرآن الكريم — HyperNova',
      artwork: [
        { src: generateQuranArtworkSvg(surahObj.name, reciter.shortName), sizes: '300x300', type: 'image/svg+xml' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => playCurrent());
    navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
    navigator.mediaSession.setActionHandler('previoustrack', () => previousAyah());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextAyah());
  }

  // Play current track (Ayah audio or 24/7 radio stream)
  async function playCurrent() {
    primaryAudio._didFallback = false;
    primaryAudio._didLiveFallback = false;
    const reciter = getReciter();

    if (state.isLiveStream) {
      primaryAudio.src = reciter.radioUrl;
      primaryAudio.playbackRate = 1.0;
    } else {
      primaryAudio.src = buildAyahAudioUrl(reciter, state.surah, state.ayah);
      primaryAudio.playbackRate = state.playbackSpeed;
    }

    primaryAudio.volume = (state.volume !== undefined && state.volume > 0) ? state.volume : 0.85;
    primaryAudio.muted = false;
    state.isPlaying = true;
    updateUI();

    try {
      await primaryAudio.play();
      state.isPlaying = true;
      updateUI();
      updateMediaSession();
      preloadNextAyah();
    } catch (e) {
      if (e && e.name === 'AbortError') {
        // Interrupted by a newer playCurrent() call (e.g., user clicked Next/Prev or changed Surah)
        return;
      }
      console.warn('[quran-radio] audio play failed:', e?.message || e);
      // Attempt immediate fallback CDN if primary rejected
      if (!state.isLiveStream && !primaryAudio._didFallback) {
        primaryAudio._didFallback = true;
        primaryAudio.src = buildAyahAudioFallbackUrl(reciter, state.surah, state.ayah);
        primaryAudio.play().then(() => {
          state.isPlaying = true;
          updateUI();
          updateMediaSession();
        }).catch((err2) => {
          if (err2 && err2.name === 'AbortError') return;
          state.isPlaying = false;
          updateUI();
        });
        return;
      }
      state.isPlaying = false;
      updateUI();
    }
  }

  function pauseAudio() {
    primaryAudio.pause();
    state.isPlaying = false;
    updateUI();
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      playCurrent();
    }
  }

  function advanceToNextAyah() {
    const surahObj = getSurah();
    if (state.repeatMode === '1') {
      // Repeat current Ayah infinitely
      primaryAudio.currentTime = 0;
      playCurrent();
      return;
    }

    if (state.ayah < surahObj.ayahCount) {
      state.ayah++;
      playCurrent();
    } else {
      // End of Surah reached
      if (state.repeatMode === 'S') {
        state.ayah = 1;
        playCurrent();
      } else if (state.repeatMode === 'A') {
        // Auto-advance to next Surah
        state.surah = (state.surah % 114) + 1;
        state.ayah = 1;
        playCurrent();
      } else {
        pauseAudio();
      }
    }
    saveState();
  }

  function previousAyah() {
    if (primaryAudio.currentTime > 2.5) {
      primaryAudio.currentTime = 0;
      return;
    }
    if (state.ayah > 1) {
      state.ayah--;
    } else if (state.surah > 1) {
      state.surah--;
      state.ayah = getSurah(state.surah).ayahCount;
    }
    saveState();
    playCurrent();
  }

  function nextAyah() {
    const surahObj = getSurah();
    if (state.ayah < surahObj.ayahCount) {
      state.ayah++;
    } else {
      state.surah = (state.surah % 114) + 1;
      state.ayah = 1;
    }
    saveState();
    playCurrent();
  }

  // Audio Event Listeners
  primaryAudio.addEventListener('ended', () => {
    if (!state.isLiveStream) {
      advanceToNextAyah();
    }
  });

  primaryAudio.addEventListener('timeupdate', () => {
    if (!state.isRadioMode) return;
    const pos = primaryAudio.currentTime || 0;
    const dur = primaryAudio.duration || 0;
    const posEl = document.getElementById('m-pos');
    const durEl = document.getElementById('m-dur');
    const barEl = document.getElementById('m-bar');
    if (state.isLiveStream) {
      if (posEl) posEl.textContent = 'مباشر';
      if (durEl) durEl.textContent = '24/7';
      if (barEl) {
        const fill = barEl.querySelector('.fill');
        if (fill) fill.style.width = '100%';
      }
      return;
    }
    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${String(sec).padStart(2, '0')}`;
    };
    if (posEl) posEl.textContent = fmt(pos);
    if (durEl) durEl.textContent = dur > 0 ? `-${fmt(Math.max(0, dur - pos))}` : '0:00';
    if (barEl && dur > 0) {
      const fill = barEl.querySelector('.fill');
      if (fill) fill.style.width = `${(pos / dur) * 100}%`;
    }
  });

  primaryAudio.addEventListener('error', () => {
    const errDetail = primaryAudio.error ? `${primaryAudio.error.code}:${primaryAudio.error.message}` : 'unknown';
    console.warn('[quran-radio] stream disruption:', primaryAudio.src, errDetail);
    if (!state.isLiveStream && !primaryAudio._didFallback) {
      primaryAudio._didFallback = true;
      const reciter = getReciter();
      primaryAudio.src = buildAyahAudioFallbackUrl(reciter, state.surah, state.ayah);
      primaryAudio.load();
      primaryAudio.play().then(() => {
        state.isPlaying = true;
        updateUI();
      }).catch(err => {
        if (err && err.name === 'AbortError') return;
        console.warn('[quran-radio] fallback audio failed:', err?.message || err);
        state.isPlaying = false;
        updateUI();
      });
      return;
    }
    primaryAudio._didFallback = false;
    // If live stream disconnected, try official Cairo Quran Radio fallback once, then fall back to Ayah recitation
    if (state.isLiveStream && state.isPlaying) {
      if (!primaryAudio._didLiveFallback) {
        primaryAudio._didLiveFallback = true;
        primaryAudio.src = 'https://stream.radiojar.com/8s5u5tpdtwzuv';
        primaryAudio.load();
        primaryAudio.play().then(() => {
          state.isPlaying = true;
          updateUI();
        }).catch(() => {
          state.isLiveStream = false;
          playCurrent();
        });
      } else {
        state.isLiveStream = false;
        playCurrent();
      }
    }
  });

  // --- 5. UI SYNCHRONIZATION AND IN-PLACE VIEW MORPH ---
  function updateUI() {
    const vMedia = document.getElementById('v-media');
    if (!vMedia) return;

    const radioToggleBtn = document.getElementById('qr-btn-toggle-radio');
    if (radioToggleBtn) {
      radioToggleBtn.classList.toggle('active', state.isRadioMode);
    }

    if (!state.isRadioMode) {
      vMedia.classList.remove('quran-mode');
      const defaultMediaArtist = document.getElementById('m-artist');
      if (defaultMediaArtist) defaultMediaArtist.style.display = '';
      const pillsBar = document.getElementById('qr-pills-bar');
      if (pillsBar) pillsBar.style.display = 'none';
      const extraTransport = document.getElementById('qr-extra-transport');
      if (extraTransport) extraTransport.style.display = 'none';
      const verseBox = document.getElementById('qr-verse-display');
      if (verseBox) verseBox.style.display = 'none';
      return;
    }

    // Activated Quran Radio Mode
    vMedia.classList.add('quran-mode');
    vMedia.classList.remove('none');

    // Keep Top Status Pill clean ('جاهز للعمل' with single green dot)
    const statusPill = document.getElementById('x-app-name');
    if (statusPill) {
      statusPill.textContent = 'جاهز للعمل';
    }

    // Update Equalizer Color to Emerald
    const eq = document.querySelector('#v-media .eq.big');
    if (eq) {
      eq.classList.toggle('paused', !state.isPlaying);
      eq.classList.add('emerald-eq');
    }

    const reciter = getReciter();
    const surahObj = getSurah();

    // 1. Artwork & Ambient Glow
    const artImg = document.getElementById('m-art');
    const artGlow = document.getElementById('m-art-glow');
    const artworkSrc = generateQuranArtworkSvg(surahObj.name, reciter.shortName);
    if (artImg) artImg.src = artworkSrc;
    if (artGlow) artGlow.src = artworkSrc;

    // Overlay Badge on Artwork (Matching Reference: Gold 'سورة الفاتحة' + Emerald '1/7')
    let badge = document.getElementById('qr-art-badge');
    if (!badge && artImg && artImg.parentElement) {
      badge = document.createElement('div');
      badge.id = 'qr-art-badge';
      badge.className = 'qr-art-badge';
      artImg.parentElement.appendChild(badge);
    }
    if (badge) {
      if (state.isLiveStream) {
        badge.innerHTML = '<span class="qr-live-dot"></span> بث مباشر';
        badge.classList.add('live');
      } else {
        badge.innerHTML = `<span class="qr-art-surah">سورة ${surahObj.name}</span><span class="qr-art-count" dir="ltr">${state.ayah}/${surahObj.ayahCount}</span>`;
        badge.classList.remove('live');
      }
    }

    // 2. Clean Apple Music-Style Title & Reciter Subtitle (Zero Verse Text Box Overlap)
    const titleEl = document.getElementById('m-title');
    const existingVerseBox = document.getElementById('qr-verse-display');
    if (existingVerseBox) existingVerseBox.remove();

    if (state.isLiveStream) {
      if (titleEl) titleEl.textContent = `إذاعة ${reciter.name} — بث مباشر 24 ساعة`;
    } else {
      if (titleEl) titleEl.textContent = `سورة ${surahObj.name} — الآية (${state.ayah} من ${surahObj.ayahCount})`;
    }

    // Show clean reciter subtitle below title
    const defaultMediaArtist = document.getElementById('m-artist');
    if (defaultMediaArtist) {
      defaultMediaArtist.style.display = 'block';
      defaultMediaArtist.textContent = state.isLiveStream
        ? `البث المباشر لإذاعة القرآن الكريم · ${reciter.country}`
        : `القارئ الشيخ ${reciter.name} (${reciter.style})`;
    }

    // 3. Compact Inline Dropdown Pills Bar (Matching Reference Colors & Layout)
    let pillsBar = document.getElementById('qr-pills-bar');
    if (!pillsBar) {
      pillsBar = document.createElement('div');
      pillsBar.id = 'qr-pills-bar';
      pillsBar.className = 'qr-pills-bar';
      const mText = document.querySelector('#v-media .m-text');
      if (mText) mText.appendChild(pillsBar);
    }
    pillsBar.style.display = 'flex';

    // Populate Pills matching reference screenshot
    const isFav = state.favorites.includes(state.surah);
    const styleShort = reciter.style.includes('مجود') ? 'مجود' : 'مرتل';
    pillsBar.innerHTML = `
      <button type="button" id="qr-pill-reciter" class="qr-pill-btn qr-pill-gold" title="تغيير القارئ (10 قراء)" aria-label="اختيار القارئ">
        <span>${reciter.shortName} (${styleShort})</span>
        ${SVG_ICONS.chevronDown}
      </button>
      <button type="button" id="qr-pill-surah" class="qr-pill-btn qr-pill-emerald" title="اختيار السورة من 114 سورة" aria-label="اختيار السورة">
        <span>${toArabicDigits(surahObj.id)}. سورة ${surahObj.name}</span>
        ${SVG_ICONS.chevronDown}
      </button>
      ${!state.isLiveStream ? `
      <div class="qr-ayah-select-wrapper">
        <select id="qr-select-ayah" class="qr-ayah-select" title="الانتقال لآية محددة" aria-label="اختيار الآية">
          ${Array.from({ length: surahObj.ayahCount }, (_, i) => i + 1)
            .map(a => `<option value="${a}" ${a === state.ayah ? 'selected' : ''}>الآية: ${toArabicDigits(a)}/${toArabicDigits(surahObj.ayahCount)}</option>`)
            .join('')}
        </select>
      </div>` : ''}
      <button type="button" id="qr-btn-fav" class="qr-fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" aria-label="المفضلة">
        ${SVG_ICONS.star}
      </button>
    `;

    // Bind Pills events
    document.getElementById('qr-pill-reciter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReciterPopover();
    });

    document.getElementById('qr-pill-surah')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSurahPopover();
    });

    document.getElementById('qr-btn-fav')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.favorites.includes(state.surah)) {
        state.favorites = state.favorites.filter(id => id !== state.surah);
      } else {
        state.favorites.push(state.surah);
      }
      saveState();
      updateUI();
    });

    document.getElementById('qr-select-ayah')?.addEventListener('change', (e) => {
      state.ayah = parseInt(e.target.value, 10) || 1;
      saveState();
      playCurrent();
    });

    // 4. Update Bottom Transport Extra Controls (100% Vector SVG + Repeat Badge)
    updateExtraControls();

    // 5. Sync Volume Slider & Percentage (75% / 80%) and Duration (-0:00)
    const volPctVal = Math.round(((state.volume !== undefined ? state.volume : 0.75)) * 100);
    const volPctEl = document.getElementById('vol-pct');
    if (volPctEl) volPctEl.textContent = `${volPctVal}%`;
    const volFill = document.querySelector('#vol-slider .fill');
    if (volFill) volFill.style.width = `${volPctVal}%`;
    const durEl = document.getElementById('m-dur');
    if (durEl && (durEl.textContent === '0:00' || !durEl.textContent)) {
      durEl.textContent = '-0:00';
    }

    // Play/Pause button icon sync
    vMedia.classList.toggle('playing', !!state.isPlaying);
    vMedia.classList.toggle('paused', !state.isPlaying);
    const playBtn = document.querySelector('#v-media [data-cmd="toggle"]');
    if (playBtn) {
      playBtn.classList.toggle('playing', !!state.isPlaying);
      const iPlay = playBtn.querySelector('.i-play');
      const iPause = playBtn.querySelector('.i-pause');
      if (iPlay) iPlay.style.removeProperty('display');
      if (iPause) iPause.style.removeProperty('display');
    }
  }

  // Update Transport Extra Vector Buttons with Divider Line
  function updateExtraControls() {
    let extraContainer = document.getElementById('qr-extra-transport');
    if (!extraContainer) {
      const transport = document.querySelector('#v-media .transport');
      if (!transport) return;
      extraContainer = document.createElement('div');
      extraContainer.id = 'qr-extra-transport';
      extraContainer.className = 'qr-extra-transport';
      transport.appendChild(extraContainer);
    }

    if (!state.isRadioMode) {
      extraContainer.style.display = 'none';
      return;
    }
    extraContainer.style.display = 'flex';

    extraContainer.innerHTML = `
      <!-- Divider line matching user reference -->
      <span class="qr-transport-divider"></span>
      
      <!-- 3-State Repeat Button with Dynamic Animated SVGs + Corner Badge (S / 1 / A) -->
      <button type="button" id="qr-btn-repeat" class="ctl mini-icon-btn qr-repeat-ctl" title="نمط التكرار: ${getRepeatTooltip()}" aria-label="نمط التكرار">
        ${state.repeatMode === '1' ? SVG_ICONS.repeatAyah : state.repeatMode === 'A' ? SVG_ICONS.repeatAuto : SVG_ICONS.repeatSurah}
        <span class="qr-rep-badge">${state.repeatMode || 'S'}</span>
      </button>
      
      <!-- 24/7 Live Stream Toggle Button -->
      <button type="button" id="qr-btn-live" class="ctl mini-icon-btn ${state.isLiveStream ? 'active' : ''}" title="${state.isLiveStream ? 'البث المباشر نشط (انقر للانتقال لتلاوة الآيات)' : 'تفعيل البث المباشر 24 ساعة للراديو'}" aria-label="البث المباشر">
        ${SVG_ICONS.broadcast}
      </button>
      
      <!-- Playback Speed Button -->
      <button type="button" id="qr-btn-speed" class="ctl mini-icon-btn" title="سرعة التلاوة (${state.playbackSpeed}x)" aria-label="سرعة التلاوة">
        <span class="qr-speed-txt">${state.playbackSpeed}x</span>
      </button>
    `;

    // Repeat button listener
    document.getElementById('qr-btn-repeat')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (state.repeatMode === 'S') state.repeatMode = '1';
      else if (state.repeatMode === '1') state.repeatMode = 'A';
      else state.repeatMode = 'S';
      saveState();
      updateUI();
      // Smooth Pop/Rotate Animation
      const newBtn = document.getElementById('qr-btn-repeat');
      if (newBtn) {
        newBtn.classList.remove('qr-btn-pop');
        void newBtn.offsetWidth;
        newBtn.classList.add('qr-btn-pop');
      }
    });

    // Live Stream listener
    document.getElementById('qr-btn-live')?.addEventListener('click', (e) => {
      e.stopPropagation();
      state.isLiveStream = !state.isLiveStream;
      saveState();
      playCurrent();
    });

    // Speed button listener
    document.getElementById('qr-btn-speed')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const speeds = [0.75, 1.0, 1.25, 1.5];
      const nextIdx = (speeds.indexOf(state.playbackSpeed) + 1) % speeds.length;
      state.playbackSpeed = speeds[nextIdx];
      if (!state.isLiveStream) {
        primaryAudio.playbackRate = state.playbackSpeed;
      }
      saveState();
      updateUI();
    });
  }

  function getRepeatTooltip() {
    if (state.repeatMode === 'S') return 'تكرار السورة كاملة [S]';
    if (state.repeatMode === '1') return 'تكرار الآية الحالية للمراجعة والتدبر [1]';
    return 'تشغيل تتابعي للسور تلقائياً [A]';
  }

  // --- 6. FLOATING GLASS POPOVERS (RECITERS & SURAHS) ---
  function closeAllPopovers() {
    document.getElementById('qr-popover-reciters')?.remove();
    document.getElementById('qr-popover-surahs')?.remove();
  }

  function toggleReciterPopover() {
    const existing = document.getElementById('qr-popover-reciters');
    if (existing) {
      existing.remove();
      return;
    }
    closeAllPopovers();

    const pop = document.createElement('div');
    pop.id = 'qr-popover-reciters';
    pop.className = 'qr-glass-popover';
    pop.innerHTML = `
      <div class="qr-pop-head">
        <div class="qr-pop-title-wrap">
          ${SVG_ICONS.microphone}
          <b>اختيار القارئ (10 قراء)</b>
        </div>
        <button type="button" class="qr-pop-close" id="qr-pop-reciters-close" aria-label="إغلاق">✕</button>
      </div>
      <div class="qr-pop-list">
        ${QURAN_RECITERS.map(r => `
          <div class="qr-pop-item ${r.id === state.reciterId ? 'active' : ''}" data-reciter="${r.id}">
            <div class="qr-reciter-avatar">${SVG_ICONS.mosque}</div>
            <div class="qr-reciter-info">
              <span class="qr-reciter-name">${r.name}</span>
              <span class="qr-reciter-sub">${r.style} · ${r.country}</span>
            </div>
            ${r.id === state.reciterId ? '<span class="qr-check">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;

    const vMedia = document.getElementById('v-media');
    if (vMedia) vMedia.appendChild(pop);

    document.getElementById('qr-pop-reciters-close')?.addEventListener('click', closeAllPopovers);
    pop.querySelectorAll('.qr-pop-item').forEach(item => {
      item.addEventListener('click', () => {
        state.reciterId = item.dataset.reciter;
        saveState();
        closeAllPopovers();
        playCurrent();
      });
    });
  }

  function toggleSurahPopover() {
    const existing = document.getElementById('qr-popover-surahs');
    if (existing) {
      existing.remove();
      return;
    }
    closeAllPopovers();

    let showFavsOnly = false;
    let searchQuery = '';

    const pop = document.createElement('div');
    pop.id = 'qr-popover-surahs';
    pop.className = 'qr-glass-popover';
    
    function renderSurahItems() {
      const filtered = SURAHS_114.filter(s => {
        if (showFavsOnly && !state.favorites.includes(s.id)) return false;
        if (searchQuery) {
          const q = searchQuery.trim().toLowerCase();
          return s.name.includes(q) || String(s.id) === q;
        }
        return true;
      });

      const listEl = pop.querySelector('.qr-pop-list');
      if (!listEl) return;

      if (!filtered.length) {
        listEl.innerHTML = '<div class="qr-empty-hint">لا توجد سور مطابقة للبحث</div>';
        return;
      }

      listEl.innerHTML = filtered.map(s => {
        const isFav = state.favorites.includes(s.id);
        const isActive = s.id === state.surah;
        return `
          <div class="qr-pop-item ${isActive ? 'active' : ''}" data-surah="${s.id}">
            <span class="qr-surah-num">${s.id}</span>
            <div class="qr-surah-info">
              <span class="qr-surah-name">سورة ${s.name}</span>
              <span class="qr-surah-sub">${s.type} · ${s.ayahCount} آية</span>
            </div>
            <button type="button" class="qr-item-fav-btn ${isFav ? 'active' : ''}" data-fav-surah="${s.id}" title="المفضلة" aria-label="إضافة للمفضلة">
              ${SVG_ICONS.star}
            </button>
            ${isActive ? '<span class="qr-check">✓</span>' : ''}
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.qr-pop-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.qr-item-fav-btn')) return;
          state.surah = parseInt(item.dataset.surah, 10) || 1;
          state.ayah = 1;
          saveState();
          closeAllPopovers();
          playCurrent();
        });
      });

      listEl.querySelectorAll('.qr-item-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sId = parseInt(btn.dataset.favSurah, 10);
          if (state.favorites.includes(sId)) {
            state.favorites = state.favorites.filter(id => id !== sId);
          } else {
            state.favorites.push(sId);
          }
          saveState();
          renderSurahItems();
          updateUI();
        });
      });
    }

    pop.innerHTML = `
      <div class="qr-pop-head">
        <div class="qr-search-wrap">
          <input type="text" id="qr-surah-search" class="qr-search-input" placeholder="بحث عن سورة بالاسم أو الرقم..." autocomplete="off">
          <button type="button" id="qr-filter-favs" class="qr-fav-filter-btn" title="عرض السور المفضلة فقط" aria-label="تصفية المفضلة">${SVG_ICONS.star}</button>
        </div>
        <button type="button" class="qr-pop-close" id="qr-pop-surahs-close" aria-label="إغلاق">✕</button>
      </div>
      <div class="qr-pop-list"></div>
    `;

    const vMedia = document.getElementById('v-media');
    if (vMedia) vMedia.appendChild(pop);

    renderSurahItems();

    const searchInput = document.getElementById('qr-surah-search');
    searchInput?.focus();
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSurahItems();
    });

    const filterFavsBtn = document.getElementById('qr-filter-favs');
    filterFavsBtn?.addEventListener('click', () => {
      showFavsOnly = !showFavsOnly;
      filterFavsBtn.classList.toggle('active', showFavsOnly);
      renderSurahItems();
    });

    document.getElementById('qr-pop-surahs-close')?.addEventListener('click', closeAllPopovers);
  }

  // --- 7. INITIALIZATION & TRANSPORT BUTTON INJECTION ---
  function initQuranRadio() {
    const vMedia = document.getElementById('v-media');
    if (!vMedia) return;

    // Inject the Radio Toggle Button with SVG icon into the transport bar
    const transport = document.querySelector('#v-media .transport');
    if (transport) {
      let radioBtn = document.getElementById('qr-btn-toggle-radio');
      if (!radioBtn) {
        radioBtn = document.createElement('button');
        radioBtn.type = 'button';
        radioBtn.id = 'qr-btn-toggle-radio';
        radioBtn.className = 'ctl quran-radio-btn';
        radioBtn.title = 'راديو وتلاوة القرآن الكريم (Interactive Quran Radio)';
        radioBtn.setAttribute('aria-label', 'راديو القرآن الكريم');
        transport.insertBefore(radioBtn, transport.firstChild);
      }
      radioBtn.innerHTML = SVG_ICONS.radio;

      radioBtn.onclick = (e) => {
        e.stopPropagation();
        state.isRadioMode = !state.isRadioMode;
        saveState();
        if (state.isRadioMode) {
          playCurrent();
        } else {
          pauseAudio();
          if (typeof render === 'function') render();
        }
        updateUI();
      };
    }

    // Connect empty state permanent radio launcher button
    const emptyRadioBtn = document.getElementById('qr-empty-launch-btn');
    if (emptyRadioBtn) {
      emptyRadioBtn.onclick = (e) => {
        e.stopPropagation();
        state.isRadioMode = true;
        saveState();
        playCurrent();
        updateUI();
      };
    }

    // Note: [data-cmd="prev"], [data-cmd="next"], and [data-cmd="toggle"] are routed to
    // window.quranRadio in renderer.js when state.isRadioMode is true. Avoid attaching
    // duplicate listeners here so clicks never fire twice.

    // Close popovers on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.qr-glass-popover') && !e.target.closest('.qr-pill-btn')) {
        closeAllPopovers();
      }
    });

    if (state.isRadioMode) {
      updateUI();
    }
  }

  // Export APIs for integration with Adhan priority ducking and Preferences cache manager
  window.quranRadio = {
    state,
    saveState,
    QURAN_RECITERS,
    SURAHS_114,
    TOTAL_AYAT_CHECKSUM,
    primaryAudio,
    playCurrent,
    pauseAudio,
    togglePlayPause,
    advanceToNextAyah,
    previousAyah,
    nextAyah,
    updateUI,
    getCacheSizeMb,
    clearQuranCache,
    duck: () => {
      if (state.isPlaying) {
        primaryAudio.volume = 0.15;
      }
    },
    unduck: () => {
      primaryAudio.volume = state.volume;
    },
    toggleRadioMode: (enable) => {
      state.isRadioMode = (enable !== undefined) ? !!enable : !state.isRadioMode;
      saveState();
      updateUI();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuranRadio);
  } else {
    setTimeout(initQuranRadio, 150);
  }
})();
