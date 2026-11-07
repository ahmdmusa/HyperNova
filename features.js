// Which parts of the island are on. Edited in the Settings window, applied live by the island.
const settings = require('./settings');

const DEFAULTS = {
  // expanded tabs
  tabMedia: true,
  tabApps: true,
  tabShelf: true,
  tabPrayer: true,
  tabTimer: true,
  tabFocus: true,
  tabSystem: true,
  // idle pill slides
  slideClock: true,
  slideStats: true,
  slidePrayer: true,
  slideInterval: 15, // seconds between idle pill rotations
  // live activities
  mediaPill: true,
  mediaTitle: true,
  trackPeek: true,
  // notifications
  kbdToast: true,
  capsToast: true,
  hudVolume: true,
  hudBrightness: true,
  battery: true,
  prayerAlerts: true,
  asrHanafi: false, // Asr by the Hanafi shadow rule
  hijriAdjust: 0, // days added to the Hijri date (local moon sighting)
  // IDM Nova
  downloads: true,
  dlToasts: true,
  // window
  hideFullscreen: false,
  autoUpdate: false, // download new versions from GitHub and offer a restart on the island
  addrIsland: false, // take the right third of the browser's address bar
  // System tab
  clipboardHistory: true,
  // copied image / screenshot -> toast with "Add to Shelf"
  screenshotToast: true,
  // mic / camera in use
  privacyDots: true,
  // companion
  netToasts: true,
  welcomeBack: true,
  morningBrief: true,
  wellbeing: true,
  smartClipboard: true,
  novaEyes: true,
  novaPrayer: true, // Nova in her prayer cap at the adhan
  novaFocus: true, // Nova with her headband at focus start / end
  water: true, // the Drop reminds you to drink
  waterEvery: 60, // minutes at the computer between glasses
  waterGoal: 8, // glasses a day (~2 L)
  celebrate: true,
  // upcoming meetings (iCal link in calendar.json)
  meetings: true,
  // reminders: dhikr, du'a, Qur'an
  reminders: true,
  adhanVoice: 'abdulbasit',
  adhanAutoResume: true,
  remindAyah: true,
  remindDhikr: true,
  remindDua: true,
  remindEvery: 5, // minutes
  remindFor: 30, // seconds on screen
  tasbeehPerHour: 4, // 0 to 12 short tasbeeh per hour
  dailyAdhkarQuota: 7, // 3, 5, 7, 10, 15 adhkar daily
  dailyAyatQuota: 3, // 1, 3, 5, 7 ayat daily
  // quiet hours for reminders (minutes after midnight; may wrap past midnight)
  quietHours: false,
  quietFrom: 23 * 60,
  quietTo: 7 * 60,
  // focus sessions (Pomodoro)
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  appLang: 'ar',
  themeColor: '#38bdf8',
  deepFocus: false,
  focusSound: true,
  microSteps: true,
  aiModel: 'flash',
  islandTheme: 'dark',
  glassOpacity: 90,
  skipTaskbar: true,
};

// number settings and their allowed range
const RANGES = {
  remindEvery: [1, 240], remindFor: [5, 300], tasbeehPerHour: [0, 60], dailyAdhkarQuota: [1, 30], dailyAyatQuota: [1, 20], quietFrom: [0, 1439], quietTo: [0, 1439],
  focusMin: [5, 120], breakMin: [1, 60], longBreakMin: [5, 60], hijriAdjust: [-2, 2], waterEvery: [15, 240], waterGoal: [4, 16],
};

let values = { ...DEFAULTS, ...pick(settings.load('features.json', {})) };
const listeners = [];

// keep only known keys with values of the right type (numbers clamped to their range)
function pick(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!(k in DEFAULTS)) continue;
    if (RANGES[k]) {
      if (Number.isFinite(v)) out[k] = Math.min(Math.max(Math.round(v), RANGES[k][0]), RANGES[k][1]);
    } else if (k === 'appLang') {
      if (v === 'ar' || v === 'en') out[k] = v;
    } else if (k === 'themeColor') {
      if (typeof v === 'string') out[k] = v;
    } else if (k === 'aiModel') {
      if (v === 'flash' || v === 'pro') out[k] = v;
    } else if (k === 'islandTheme') {
      if (v === 'dark' || v === 'light' || v === 'black') out[k] = v;
    } else if (k === 'glassOpacity') {
      if (Number.isFinite(v)) out[k] = Math.min(Math.max(Math.round(v), 20), 100);
    } else if (k === 'skipTaskbar') {
      if (typeof v === 'boolean') out[k] = v;
      if (v === 'flash' || v === 'pro') out[k] = v;
    } else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

function get() {
  return { ...values };
}

function set(patch) {
  const clean = pick(patch);
  if (!Object.keys(clean).length) return values;
  values = { ...values, ...clean };
  settings.save('features.json', values);
  listeners.forEach((fn) => fn(get()));
  return get();
}

function reset() {
  values = { ...DEFAULTS };
  settings.save('features.json', values);
  listeners.forEach((fn) => fn(get()));
}

const onChange = (fn) => listeners.push(fn);

module.exports = { get, set, reset, onChange, DEFAULTS };

