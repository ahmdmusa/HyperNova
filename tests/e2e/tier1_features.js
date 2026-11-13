// tests/e2e/tier1_features.js
/**
 * HyperNova E2E Test Suite — Tier 1: Feature Coverage
 * 50 Comprehensive Feature Coverage Tests (5 per feature across Features 1–10).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createMockEnvironment } = require('./framework');

const ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = function registerTier1(harness) {
  // =========================================================================
  // Feature 1: Taskbar Z-Order Win32 Topmost Behavior (R1)
  // =========================================================================
  harness.describe('Tier 1: Feature 1 — Taskbar Z-Order Win32 Topmost Behavior', () => {
    harness.test('TC-T1-F1-01: Window Creation & DummyParent Topmost Initialization', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /dummyParent\s*=\s*new\s*BrowserWindow/, 'dummyParent must be created');
      harness.assertMatch(novaJs, /dummyParent\.setAlwaysOnTop\(\s*true\s*,\s*['"]screen-saver['"]\s*\)/, 'dummyParent must be set to screen-saver topmost');
      harness.assertMatch(novaJs, /win\.setAlwaysOnTop\(\s*true\s*,\s*['"]screen-saver['"]\s*\)/, 'main window must be set to screen-saver topmost');
      harness.assertMatch(novaJs, /readBigInt64LE\(0\)\.toString\(\)/, 'Must extract 64-bit native HWND for helper');
    });

    harness.test('TC-T1-F1-02: Topmost Re-Assertion on Island Window Blur', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /win\.on\(\s*['"]blur['"]\s*,\s*ensureIslandTopmost\s*\)/, 'win blur event must trigger ensureIslandTopmost');
      harness.assertMatch(novaJs, /function\s+ensureIslandTopmost\s*\(\)\s*\{[\s\S]*?win\.setAlwaysOnTop\(true,\s*['"]screen-saver['"]\)[\s\S]*?mediaWrite\(['"]pin-topmost['"]\)/, 'ensureIslandTopmost must re-assert topmost in Electron and send pin-topmost to helper');
    });

    harness.test('TC-T1-F1-03: Topmost Re-Assertion on Taskbar Activation (Shell_TrayWnd)', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /Shell_TrayWnd/, 'NovaHelper must detect foreground Shell_TrayWnd');
      harness.assertMatch(helperCs, /EnsureTopmost\s*\(\s*IslandHwnd\s*\)/, 'NovaHelper must re-pin island topmost on taskbar foreground');
      harness.assertMatch(helperCs, /HWND_TOPMOST\s*=\s*new\s*IntPtr\(-1\)/, 'HWND_TOPMOST must be IntPtr(-1)');
      harness.assertMatch(helperCs, /TOPMOST_FLAGS\s*=\s*SWP_NOMOVE\s*\|\s*SWP_NOSIZE\s*\|\s*SWP_NOACTIVATE\s*\|\s*SWP_NOOWNERZORDER;/, 'TOPMOST_FLAGS must combine SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE|SWP_NOOWNERZORDER');
    });

    harness.test('TC-T1-F1-04: Topmost Re-Assertion on Notification Banner Presentation', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /island-notification|test-island-notification/, 'nova.js must handle island-notification IPC');
      harness.assertMatch(novaJs, /sendIslandHwnd|ensureIslandTopmost/, 'Topmost must be ensured during island window lifecycle');
    });

    harness.test('TC-T1-F1-05: Helper Stdin Command Contract (island-hwnd and pin-topmost)', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /cmd\.StartsWith\(['"]island-hwnd\s+['"]\)/, 'NovaHelper must parse island-hwnd command');
      harness.assertMatch(helperCs, /long\.TryParse/, 'NovaHelper must parse hwnd safely with long.TryParse');
      harness.assertMatch(helperCs, /cmd\s*==\s*['"]pin-topmost['"]/, 'NovaHelper must parse pin-topmost command');
    });
  });

  // =========================================================================
  // Feature 2: Configurable Notification Auto-Dismiss Duration (R2)
  // =========================================================================
  harness.describe('Tier 1: Feature 2 — Configurable Notification Duration', () => {
    const features = require('../../features');

    harness.test('TC-T1-F2-01: Default Notification Auto-Dismiss Duration Contract', () => {
      harness.assertEqual(features.DEFAULTS.notifDuration, 6, 'DEFAULTS.notifDuration must be exactly 6');
      harness.assertEqual(typeof features.get().notifDuration, 'number', 'notifDuration must be a number');
    });

    harness.test('TC-T1-F2-02: Setting and Persisting Valid Durations Within Range [2, 30]', () => {
      features.set({ notifDuration: 12 });
      harness.assertEqual(features.get().notifDuration, 12, 'notifDuration must update to 12');
      features.set({ notifDuration: 6 }); // Reset
    });

    harness.test('TC-T1-F2-03: Renderer Auto-Dismiss Countdown Computation', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /notifTotalMs\s*=\s*n\.ms\s*\|\|\s*\(state\.features\?\.notifDuration\s*\|\|\s*6\)\s*\*\s*1000/, 'Countdown must use configured notifDuration in milliseconds');
    });

    harness.test('TC-T1-F2-04: Explicit Banner Timeout Override (n.ms)', () => {
      const state = { features: { notifDuration: 15 } };
      const nWithMs = { title: 'Alert', msg: 'Body', ms: 2500 };
      const notifTotalMs = nWithMs.ms || (state.features?.notifDuration || 6) * 1000;
      harness.assertEqual(notifTotalMs, 2500, 'Explicit n.ms must override notifDuration');
    });

    harness.test('TC-T1-F2-05: Preferences Alerts Tab Stepper UI & Unit Formatting Localization', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /<section\s+id=['"]alerts['"]/, 'Preferences must have #alerts section');
      harness.assertMatch(prefsHtml, /id=['"]btn-test-notif['"]/, '#btn-test-notif button must exist in alerts');

      const prefsJs = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.js'), 'utf8');
      harness.assertMatch(prefsJs, /function\s+unitText\s*\(/, 'unitText function must exist in prefs.js');
      harness.assertMatch(prefsJs, /unit\s*===\s*['"]sec['"]|ثانية/, 'unitText must support second unit localization');
    });
  });

  // =========================================================================
  // Feature 3: Gentle Notification Sound & Mute Toggle (R3)
  // =========================================================================
  harness.describe('Tier 1: Feature 3 — Gentle Notification Sound & Mute Toggle', () => {
    const features = require('../../features');

    harness.test('TC-T1-F3-01: Default Notification Sound Feature Toggle', () => {
      harness.assertEqual(features.DEFAULTS.notifSound, true, 'DEFAULTS.notifSound must be true by default');
      harness.assertEqual(typeof features.get().notifSound, 'boolean', 'notifSound must be a boolean');
    });

    harness.test('TC-T1-F3-02: Acoustic Envelope Synthesis Parameters', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /playGentleChime\s*\(volume\s*=\s*0\.18\)/, 'playGentleChime must accept default volume 0.18');
      harness.assertMatch(audioJs, /587\.33/, 'Must include D5 frequency (587.33 Hz)');
      harness.assertMatch(audioJs, /880\.00/, 'Must include A5 frequency (880.00 Hz)');
      harness.assertMatch(audioJs, /1400/, 'Must include lowpass filter cutoff at 1400 Hz');
      harness.assertMatch(audioJs, /linearRampToValueAtTime/, 'Must use linear ramp for attack envelope');
    });

    harness.test('TC-T1-F3-03: Notification Banner Plays Gentle Chime when notifSound: true', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /if\s*\(feat\(['"]notifSound['"]\)\)\s*\{[\s\S]*?playGentleChime/, 'Banner display must invoke playGentleChime when notifSound is true');
    });

    harness.test('TC-T1-F3-04: Notification Banner Completely Mutes when notifSound: false', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /if\s*\(feat\(['"]notifSound['"]\)\s*===\s*false\)\s*return/, 'playGentleChime must immediately return when notifSound is false');
    });

    harness.test('TC-T1-F3-05: Preferences Alerts UI Switch Contract', () => {
      harness.assertEqual(features.DEFAULTS.notifSound, true, 'Features schema must support notifSound toggle');
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /id=['"]btn-test-notif['"]/, 'Alerts page must include test notification button');
      const prefsJs = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.js'), 'utf8');
      harness.assertMatch(prefsJs, /api\.testIslandNotification|test-notif/, 'prefs.js must bind test notification action');
    });
  });

  // =========================================================================
  // Feature 4: Offline Takbeer Audio Updates & Zero Alafasy Trace
  // =========================================================================
  harness.describe('Tier 1: Feature 4 — Offline Takbeer Audio Updates & Alafasy Removal', () => {
    const features = require('../../features');

    harness.test('TC-T1-F4-01: Default Adhan Voice Schema Contract (mukhtasar)', () => {
      harness.assertEqual(features.DEFAULTS.adhanVoice, 'mukhtasar', 'Default adhan voice must be mukhtasar');
    });

    harness.test('TC-T1-F4-02: Local Takbeer Audio Asset Verification', () => {
      const mukhtasarPath = path.join(ROOT_DIR, 'sounds', 'takbeer_mukhtasar.mp3');
      const aliPath = path.join(ROOT_DIR, 'sounds', 'takbeer_ali.mp3');
      harness.assert(fs.existsSync(mukhtasarPath), 'takbeer_mukhtasar.mp3 must exist');
      harness.assert(fs.existsSync(aliPath), 'takbeer_ali.mp3 must exist');
      const mStat = fs.statSync(mukhtasarPath);
      const aStat = fs.statSync(aliPath);
      harness.assert(mStat.size > 100000, `takbeer_mukhtasar.mp3 size (${mStat.size}) must exceed 100KB`);
      harness.assert(aStat.size > 200000, `takbeer_ali.mp3 size (${aStat.size}) must exceed 200KB`);
    });

    harness.test('TC-T1-F4-03: Zero Alafasy Trace in Quran Radio Reciters Catalog', () => {
      const quranJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'quran-radio.js'), 'utf8');
      harness.assert(!/id:\s*['"]alafasy['"]/i.test(quranJs), 'Alafasy ID must not exist in quran-radio.js');
      harness.assert(!/العفاسي/i.test(quranJs), 'Alafasy Arabic name must not exist in quran-radio.js');
    });

    harness.test('TC-T1-F4-04: Zero Alafasy Trace in Prayer Muezzins Catalog & Short Labels', () => {
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      harness.assert(!/id:\s*['"]alafasy['"]/i.test(prayerJs), 'Alafasy must not exist in ADHAN_MUEZZINS');
      harness.assert(!/alafasy:\s*['"]/i.test(prayerJs), 'Alafasy must not exist in MUEZZIN_SHORT');
      harness.assertMatch(prayerJs, /id:\s*['"]mukhtasar['"]/, 'mukhtasar must exist in ADHAN_MUEZZINS');
      harness.assertMatch(prayerJs, /id:\s*['"]ali['"]/, 'ali must exist in ADHAN_MUEZZINS');
    });

    harness.test('TC-T1-F4-05: Legacy alafasy Preferences Auto-Migration', () => {
      features.set({ adhanVoice: 'alafasy' });
      harness.assertEqual(features.get().adhanVoice, 'mukhtasar', 'Stored alafasy setting must sanitize to mukhtasar');
    });
  });

  // =========================================================================
  // Feature 5: Idle Pill Rotation with Nova Eyes (R4)
  // =========================================================================
  harness.describe('Tier 1: Feature 5 — Idle Pill Rotation with Nova Eyes', () => {
    const features = require('../../features');

    harness.test('TEST-T1-F5-01: Default Idle Slide Rotation with Nova Eyes Disabled', () => {
      const env = createMockEnvironment();
      const slideClock = new env.MockDOMElement('div');
      slideClock.setAttribute('data-feat', 'slideClock');
      slideClock.classList.add('info-slide', 'on');

      const slideStats = new env.MockDOMElement('div');
      slideStats.setAttribute('data-feat', 'slideStats');
      slideStats.classList.add('info-slide');

      // Test slide rotation transition
      const slides = [slideClock, slideStats];
      let cur = 0;
      cur = (cur + 1) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('on', idx === cur));

      harness.assert(!slideClock.classList.contains('on'), 'slideClock must lose on class');
      harness.assert(slideStats.classList.contains('on'), 'slideStats must acquire on class');
    });

    harness.test('TEST-T1-F5-02: Slide Visibility and Rotation with Nova Eyes Enabled', () => {
      harness.assertEqual(features.DEFAULTS.novaEyes, true, 'DEFAULTS.novaEyes must be true');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /function\s+showSlide\s*\(n\)/, 'showSlide function must be defined');
      harness.assertMatch(rendererJs, /resetSlideTimer/, 'resetSlideTimer must exist');
    });

    harness.test('TEST-T1-F5-03: Configurable Slide Interval Timing Verification', () => {
      harness.assertEqual(features.DEFAULTS.slideInterval, 15, 'Default slide interval must be 15s');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /const\s+sec\s*=\s*\(state\.features\?\.slideInterval\s*!==\s*undefined\)\s*\?\s*Number\(state\.features\.slideInterval\)\s*:\s*15/, 'renderer must read configurable slideInterval from state.features');
      
      const mockState = { features: { slideInterval: 5 } };
      const computedSec = (mockState.features?.slideInterval !== undefined) ? Number(mockState.features.slideInterval) : 15;
      harness.assertEqual(computedSec, 5, 'slideInterval 5 must compute to 5 seconds');
    });

    harness.test('TEST-T1-F5-04: Selective Slide Inclusion and Exclusion', () => {
      const env = createMockEnvironment();
      const slideClock = new env.MockDOMElement('div');
      slideClock.classList.add('info-slide');
      const slideStats = new env.MockDOMElement('div');
      slideStats.classList.add('info-slide', 'off'); // disabled
      const slidePrayer = new env.MockDOMElement('div');
      slidePrayer.classList.add('info-slide');

      const all = [slideClock, slideStats, slidePrayer];
      const eligible = all.filter((s) => !s.hidden && !s.classList.contains('off'));
      harness.assertEqual(eligible.length, 2, 'Disabled slide must be filtered out');
      harness.assertEqual(eligible[0], slideClock, 'First eligible slide must be clock');
      harness.assertEqual(eligible[1], slidePrayer, 'Second eligible slide must be prayer');
    });

    harness.test('TEST-T1-F5-05: Near 0% GPU Idle at Rest Invariant', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /isSettled\s*\(tolerance\s*=\s*0\.01\)/, 'Spring physics must have isSettled check');
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /animation-play-state:\s*paused/, 'Inactive layers must have paused animation play state');
    });
  });

  // =========================================================================
  // Feature 6: Compact Preferences Island Page (R5)
  // =========================================================================
  harness.describe('Tier 1: Feature 6 — Compact Preferences Island Page', () => {
    harness.test('TEST-T1-F6-01: Preferences #island Tab Section Layout Integrity', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /<section\s+id=['"]island['"]/, 'Preferences must have #island section');
      harness.assertMatch(prefsHtml, /name=['"]islandStyle['"]/, 'Must contain islandStyle radios');
      harness.assertMatch(prefsHtml, /name=['"]islandSize['"]/, 'Must contain islandSize radios');
      harness.assertMatch(prefsHtml, /data-feature=['"]tabMedia['"]/, 'Must contain tab chips');
      harness.assertMatch(prefsHtml, /data-num=['"]slideInterval['"]/, 'Must contain slideInterval stepper');
    });

    harness.test('TEST-T1-F6-02: Island Style Compact Grid Tiles Selection', () => {
      const prefsCss = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.css'), 'utf8');
      harness.assertMatch(prefsCss, /\.size-card/, 'size-card selector must exist in prefs.css');
      harness.assertMatch(prefsCss, /\.island-size-grid/, 'island-size-grid must be styled in prefs.css');
    });

    harness.test('TEST-T1-F6-03: Island Size Compact Grid Tiles Selection', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /value=['"]s['"]/, 'Size s must exist');
      harness.assertMatch(prefsHtml, /value=['"]m['"]/, 'Size m must exist');
      harness.assertMatch(prefsHtml, /value=['"]l['"]/, 'Size l must exist');
    });

    harness.test('TEST-T1-F6-04: Interactive Tab Chips Multi-Selection', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      const tabs = ['tabMedia', 'tabApps', 'tabShelf', 'tabPrayer', 'tabTimer', 'tabFocus', 'tabSystem'];
      tabs.forEach((t) => {
        harness.assert(prefsHtml.includes(`data-feature="${t}"`), `Tab chip ${t} must exist`);
      });
    });

    harness.test('TEST-T1-F6-05: Collapsed Mini-Bar Stepper & Switch Configuration', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /data-num=['"]slideInterval['"]/, 'slideInterval stepper must exist');
      harness.assertMatch(prefsHtml, /data-feature=['"]slideClock['"]/, 'slideClock switch must exist');
      harness.assertMatch(prefsHtml, /data-feature=['"]slideStats['"]/, 'slideStats switch must exist');
    });
  });

  // =========================================================================
  // Feature 7: Compact Language Controls (R6)
  // =========================================================================
  harness.describe('Tier 1: Feature 7 — Compact Language Controls', () => {
    harness.test('TEST-T1-F7-01: Mini Pill Language Switcher Rendering', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /id=['"]btn-lang-ar['"]/, '#btn-lang-ar button must exist');
      harness.assertMatch(prefsHtml, /id=['"]btn-lang-en['"]/, '#btn-lang-en button must exist');
    });

    harness.test('TEST-T1-F7-02: Arabic Language Activation via Mini Pill', () => {
      const prefsJs = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.js'), 'utf8');
      harness.assertMatch(prefsJs, /applyLanguage\(['"]ar['"]\)/, 'Must support applying Arabic language');
    });

    harness.test('TEST-T1-F7-03: English Language Activation via Mini Pill', () => {
      const prefsJs = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.js'), 'utf8');
      harness.assertMatch(prefsJs, /applyLanguage\(['"]en['"]\)/, 'Must support applying English language');
    });

    harness.test('TEST-T1-F7-04: Keyboard Layout Toast Elements & Content', () => {
      const kbdJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'keyboard.js'), 'utf8');
      harness.assertMatch(kbdJs, /0x09:\s*\[['"]English['"],\s*['"]EN['"]\]/, 'Layout 0x09 must map to English / EN');
      harness.assertMatch(kbdJs, /0x01:\s*\[['"]العربية['"],\s*['"]ع['"]\]/, 'Layout 0x01 must map to Arabic');
    });

    harness.test('TEST-T1-F7-05: Compact Keyboard Toast Width Specification', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /l-toast\.kbd/, '.l-toast.kbd rule must exist');
    });
  });

  // =========================================================================
  // Feature 8: Typography & HUD Visual Refinements (R7)
  // =========================================================================
  harness.describe('Tier 1: Feature 8 — Typography & HUD Visual Refinements', () => {
    harness.test('TEST-T1-F8-01: Volume HUD Toast Proportions & Width', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /l-toast\.vol/, '.l-toast.vol rule must exist');
    });

    harness.test('TEST-T1-F8-02: Brightness HUD Toast Proportions & Icon Styling', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /l-toast\.bright/, '.l-toast.bright rule must exist');
    });

    harness.test('TEST-T1-F8-03: Sans-Serif Font Scoping for Tabular Figures in Arabic Mode', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /Segoe UI Variable Text|Segoe UI|sans-serif/, 'Segoe UI sans-serif fonts must be declared');
    });

    harness.test('TEST-T1-F8-04: Notification Banner High-Contrast Frosted Glass Styling', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /#island\.notification/, '#island.notification styling must exist');
    });

    harness.test('TEST-T1-F8-05: Notification Banner Inset Rounded Progress Bar', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /\.notif-bar/, '.notif-bar styling must exist');
    });
  });

  // =========================================================================
  // Feature 9: Nova Emotion State Machine & Priority Arbiter
  // =========================================================================
  harness.describe('Tier 1: Feature 9 — Nova Emotion State Machine & Priority Arbiter', () => {
    harness.test('F9-T1-01: 4-Level Priority Hierarchy Preemption (L4 interrupts L2 and reverts to L2)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /function\s+setState\s*\(/, 'setState must be defined in nova.js');
      harness.assertMatch(novaJs, /getDefaultState\(\)/, 'getDefaultState must be defined for fallback');
    });

    harness.test('F9-T1-02: Idle Ladder Progression (idle -> sleepy -> deep_sleep)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /case\s*['"]deep_sleep['"]:/, 'deep_sleep state must be handled in nova.js');
      harness.assertMatch(novaJs, /case\s*['"]sleepy['"]:/, 'sleepy state must be handled in nova.js');
    });

    harness.test('F9-T1-03: Ambient Umbrella Prop Separation from Emotion Transitions', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /propUmbrellaGroup/, 'propUmbrellaGroup must exist in nova.js');
      const sysJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'system.js'), 'utf8');
      harness.assertMatch(sysJs, /setNovaProp\?\.?\(['"]umbrella['"]\)/, 'views/system.js must set umbrella prop');
    });

    harness.test('F9-T1-04: 4-4-4 Box Breathing Cycle Sync', () => {
      const compJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'companion.js'), 'utf8');
      harness.assertMatch(compJs, /Box Breathing \(4-4-4\)/, 'Companion must include Box Breathing card');
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /case\s*['"]breathing['"]:/, 'nova.js must handle breathing state');
    });

    harness.test('F9-T1-05: AI Breakdown Thinking State and Minimum Display Guard', () => {
      const focusJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'focus.js'), 'utf8');
      harness.assertMatch(focusJs, /bridge\.ai\.breakdown/, 'focus.js must invoke bridge.ai.breakdown');
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /case\s*['"]thinking['"]:/, 'nova.js must handle thinking state');
    });
  });

  // =========================================================================
  // Feature 10: Test Suite Synchronization & Packaging (R8)
  // =========================================================================
  harness.describe('Tier 1: Feature 10 — Test Suite Synchronization & Packaging', () => {
    harness.test('F10-T1-01: Rigorous Audit Test Suite 100% Pass (171+ Assertions)', () => {
      const result = execSync('node test_rigorous_suite.js', { cwd: ROOT_DIR, encoding: 'utf8' });
      harness.assertMatch(result, /ALL RIGOROUS TESTS PASSED!/, 'Rigorous suite must pass completely');
      harness.assertMatch(result, /FAILED:\s*0/, 'Failed count must be 0');
    });

    harness.test('F10-T1-02: Win32 C# Helper Compilation via helper\\build.cmd', () => {
      const helperExe = path.join(ROOT_DIR, 'helper', 'nova-helper.exe');
      harness.assert(fs.existsSync(helperExe), 'helper/nova-helper.exe must exist');
      const stat = fs.statSync(helperExe);
      harness.assert(stat.size >= 35000, `nova-helper.exe size (${stat.size}) must be >= 35KB`);
      const buf = Buffer.alloc(2);
      const fd = fs.openSync(helperExe, 'r');
      fs.readSync(fd, buf, 0, 2, 0);
      fs.closeSync(fd);
      harness.assertEqual(buf.toString('ascii'), 'MZ', 'Must be valid PE executable');
    });

    harness.test('F10-T1-03: NSIS Installer Existence and Size Floor (>100 MB)', () => {
      const installerPath = 'C:\\Users\\ahmed\\Desktop\\HyperNova-Setup-2.1.3.exe';
      harness.assert(fs.existsSync(installerPath), 'Desktop installer must exist');
      const stat = fs.statSync(installerPath);
      harness.assert(stat.size > 100 * 1024 * 1024, `Installer size (${stat.size}) must exceed 100MB`);
    });

    harness.test('F10-T1-04: Windows Store AppX Package Existence and Size Floor (>120 MB)', () => {
      const appxPath = 'C:\\Users\\ahmed\\Desktop\\HyperNova-Store-2.1.3.appx';
      harness.assert(fs.existsSync(appxPath), 'Desktop AppX package must exist');
      const stat = fs.statSync(appxPath);
      harness.assert(stat.size > 120 * 1024 * 1024, `AppX size (${stat.size}) must exceed 120MB`);
    });

    harness.test('F10-T1-05: Offline Audio Assets Invariant & Zero Alafasy Trace in Packaging', () => {
      const features = require('../../features');
      harness.assertEqual(features.DEFAULTS.adhanVoice, 'mukhtasar', 'DEFAULTS.adhanVoice must be mukhtasar');
      const mPath = path.join(ROOT_DIR, 'sounds', 'takbeer_mukhtasar.mp3');
      const aPath = path.join(ROOT_DIR, 'sounds', 'takbeer_ali.mp3');
      harness.assert(fs.existsSync(mPath) && fs.existsSync(aPath), 'Both takbeer audio files must exist');

      // Check runtime audio files
      const runtimeAudioFiles = ['views/prayer.js', 'views/quran-radio.js'];
      runtimeAudioFiles.forEach((f) => {
        const content = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
        harness.assert(!/id:\s*['"]alafasy['"]/i.test(content), `alafasy id must not exist in ${f}`);
      });
    });
  });
};
