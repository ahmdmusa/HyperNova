// tests/e2e/tier4_scenarios.js
/**
 * HyperNova E2E Test Suite — Tier 4: Real-World Application Scenarios
 * 5 Comprehensive End-to-End Application Workflow Tests.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createMockEnvironment } = require('./framework');

const ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = function registerTier4(harness) {
  harness.describe('Tier 4: Real-World Application Scenarios', () => {
    // -----------------------------------------------------------------------
    // Scenario 1: Focus Pomodoro Work Session & AI Task Breakdown
    // -----------------------------------------------------------------------
    harness.test('Scenario 1: Focus Pomodoro Work Session & AI Task Breakdown (F1, F2, F7, F8, F9)', () => {
      const features = require('../../features');
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      const focusJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'focus.js'), 'utf8');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');

      // 1. Z-Order: Island remains topmost
      harness.assertMatch(novaJs, /ensureIslandTopmost/, 'Topmost re-assertion active');

      // 2. Pomodoro configuration defaults
      harness.assertEqual(features.DEFAULTS.focusMin, 25, 'Default focus time must be 25 mins');
      harness.assertEqual(features.DEFAULTS.breakMin, 5, 'Default break time must be 5 mins');

      // 3. AI Breakdown integration in focus view
      harness.assertMatch(focusJs, /bridge\.ai\.breakdown/, 'Focus view must connect to AI breakdown bridge');

      // 4. Celebration upon completion
      harness.assertMatch(rendererJs, /function\s+celebrate\(/, 'Celebration confetti must be defined');

      // 5. Notification banner with custom duration
      harness.assertMatch(rendererJs, /notifTotalMs\s*=/, 'Notification countdown must be computed');
    });

    // -----------------------------------------------------------------------
    // Scenario 2: Prayer Time Transition & Adhan Takbeer with Active Media
    // -----------------------------------------------------------------------
    harness.test('Scenario 2: Prayer Time Transition & Adhan Takbeer with Active Media (F3, F4, F8, F9)', () => {
      const features = require('../../features');
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      const compJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'companion.js'), 'utf8');
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');

      // 1. Companion pre-prayer alert (10 mins before prayer)
      harness.assertMatch(compJs, /pre_prayer/, 'Pre-prayer alert must be handled');

      // 2. Default offline Adhan Takbeer (mukhtasar, 6.5s)
      harness.assertEqual(features.DEFAULTS.adhanVoice, 'mukhtasar', 'Default adhan voice must be mukhtasar');
      const takbeerPath = path.join(ROOT_DIR, 'sounds', 'takbeer_mukhtasar.mp3');
      harness.assert(fs.existsSync(takbeerPath), 'Local mukhtasar audio file must exist');

      // 3. Complete absence of Alafasy in prayer muezzins
      harness.assert(!/id:\s*['"]alafasy['"]/i.test(prayerJs), 'prayer.js must contain zero alafasy muezzin IDs');

      // 4. Gentle notification chime available without interrupting takbeer
      harness.assertMatch(audioJs, /playGentleChime/, 'Gentle chime method must exist');
    });

    // -----------------------------------------------------------------------
    // Scenario 3: Extended Inactivity, Deep Sleep & Return Box Breathing
    // -----------------------------------------------------------------------
    harness.test('Scenario 3: Extended Inactivity, Deep Sleep & Return Box Breathing (F5, F8, F9)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      const compJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'companion.js'), 'utf8');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');

      // 1. Sleepy and deep_sleep states handled in Nova state machine
      harness.assertMatch(novaJs, /case\s*['"]sleepy['"]:/, 'sleepy state must be defined');
      harness.assertMatch(novaJs, /case\s*['"]deep_sleep['"]:/, 'deep_sleep state must be defined');

      // 2. 0% GPU resting conditions
      harness.assertMatch(novaJs, /isSettled/, 'Physics solver must have isSettled check');

      // 3. Idle slide rotation continues
      harness.assertMatch(rendererJs, /showSlide\s*\(n\)/, 'Slide rotation must be supported');

      // 4. Welcome state upon waking up
      harness.assertMatch(novaJs, /case\s*['"]welcome['"]:/, 'welcome state must be defined');

      // 5. Box Breathing 4-4-4 card in companion
      harness.assertMatch(compJs, /Box Breathing \(4-4-4\)/, 'Box breathing card must exist');
    });

    // -----------------------------------------------------------------------
    // Scenario 4: Preferences Customization & Multi-Language Configuration
    // -----------------------------------------------------------------------
    harness.test('Scenario 4: Preferences Customization & Multi-Language Configuration (F2, F3, F6, F7, F8)', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      const features = require('../../features');

      // 1. Mini pill language buttons
      harness.assertMatch(prefsHtml, /id=['"]btn-lang-ar['"]/, 'AR language button must exist');
      harness.assertMatch(prefsHtml, /id=['"]btn-lang-en['"]/, 'EN language button must exist');

      // 2. Alerts page: #alerts section and test notification button
      harness.assertMatch(prefsHtml, /<section\s+id=['"]alerts['"]/, '#alerts section must exist');
      harness.assertMatch(prefsHtml, /id=['"]btn-test-notif['"]/, 'Test notification button must exist');

      // 3. Compact Island page: islandStyle and islandSize
      harness.assertMatch(prefsHtml, /name=['"]islandStyle['"]/, 'islandStyle radios must exist');
      harness.assertMatch(prefsHtml, /name=['"]islandSize['"]/, 'islandSize radios must exist');

      // 4. Verify features schema clamping
      features.set({ notifDuration: 99, appLang: 'en' });
      harness.assertEqual(features.get().notifDuration, 30, 'Duration 99 must clamp to 30');
      harness.assertEqual(features.get().appLang, 'en', 'appLang must be en');
      features.set({ notifDuration: 6, appLang: 'ar' }); // Reset
    });

    // -----------------------------------------------------------------------
    // Scenario 5: End-to-End Release Build & Packaging Validation
    // -----------------------------------------------------------------------
    harness.test('Scenario 5: End-to-End Release Build & Packaging Validation (F1, F4, F10)', () => {
      // 1. Win32 Helper compilation
      const helperExe = path.join(ROOT_DIR, 'helper', 'nova-helper.exe');
      harness.assert(fs.existsSync(helperExe), 'nova-helper.exe must exist');
      const hStat = fs.statSync(helperExe);
      harness.assert(hStat.size >= 35000, 'nova-helper.exe size must be >= 35KB');

      // 2. Rigorous test suite pass
      const rigorousOutput = execSync('node test_rigorous_suite.js', { cwd: ROOT_DIR, encoding: 'utf8' });
      harness.assertMatch(rigorousOutput, /ALL RIGOROUS TESTS PASSED!/, 'Rigorous suite must pass');

      // 3. Installer artifacts on Desktop
      const nsisInstaller = 'C:\\Users\\ahmed\\Desktop\\HyperNova-Setup-2.1.3.exe';
      const storeAppx = 'C:\\Users\\ahmed\\Desktop\\HyperNova-Store-2.1.3.appx';
      harness.assert(fs.existsSync(nsisInstaller), 'NSIS installer must exist on Desktop');
      harness.assert(fs.existsSync(storeAppx), 'AppX store package must exist on Desktop');

      // 4. Offline audio assets present
      const mPath = path.join(ROOT_DIR, 'sounds', 'takbeer_mukhtasar.mp3');
      const aPath = path.join(ROOT_DIR, 'sounds', 'takbeer_ali.mp3');
      harness.assert(fs.existsSync(mPath) && fs.existsSync(aPath), 'Offline takbeer files must exist');

      // 5. Zero Alafasy occurrences in runtime audio players
      const runtimeAudioFiles = ['views/prayer.js', 'views/quran-radio.js'];
      runtimeAudioFiles.forEach((f) => {
        const text = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
        harness.assert(!/id:\s*['"]alafasy['"]/i.test(text), `Alafasy reciter/muezzin found in ${f}`);
      });
    });
  });
};
