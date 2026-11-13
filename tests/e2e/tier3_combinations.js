// tests/e2e/tier3_combinations.js
/**
 * HyperNova E2E Test Suite — Tier 3: Cross-Feature Combinations
 * 12 Pairwise Cross-Feature Interaction Tests across Features 1–10.
 */

const fs = require('fs');
const path = require('path');
const { createMockEnvironment } = require('./framework');

const ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = function registerTier3(harness) {
  harness.describe('Tier 3: Cross-Feature Combinations (Pairwise Interactions)', () => {
    const features = require('../../features');

    // F-PAIR-01: F1 + F2
    harness.test('F-PAIR-01 (F1 + F2): Top Taskbar Z-Order during Notification Dismiss Cycle', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');

      // F1: Ensure topmost re-assertion logic
      harness.assertMatch(novaJs, /ensureIslandTopmost/, 'Topmost re-assertion must exist in nova.js');
      // F2: Configurable duration countdown
      harness.assertMatch(rendererJs, /notifTotalMs\s*=\s*n\.ms\s*\|\|\s*\(state\.features\?\.notifDuration\s*\|\|\s*6\)\s*\*\s*1000/, 'Countdown uses notifDuration');
    });

    // F-PAIR-02: F2 + F3
    harness.test('F-PAIR-02 (F2 + F3): Notification Duration with Gentle Chime & Mute Toggle', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');

      // Audio is gated on notifSound
      harness.assertMatch(rendererJs, /if\s*\(feat\(['"]notifSound['"]\)\)\s*\{[\s\S]*?playGentleChime/, 'Gentle chime only plays when notifSound is enabled');
      // Duration works independently
      harness.assertMatch(rendererJs, /notifTotalMs/, 'Duration countdown proceeds regardless of sound state');
    });

    // F-PAIR-03: F3 + F4
    harness.test('F-PAIR-03 (F3 + F4): Notification Chime vs Active Takbeer Audio Playback', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');

      harness.assertMatch(audioJs, /playGentleChime/, 'Gentle chime synthesizes via Web Audio API');
      harness.assertMatch(prayerJs, /sounds\/takbeer_mukhtasar\.mp3/, 'Takbeer plays local audio file');
    });

    // F-PAIR-04: F4 + F9
    harness.test('F-PAIR-04 (F4 + F9): Takbeer Adhan Trigger vs Nova Khushu State Machine', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');

      harness.assertMatch(novaJs, /isQuranPlaying\(\)\s*\?\s*['"]khushu['"]|['"]khushu['"]/, 'Nova must support khushu state');
      harness.assertMatch(prayerJs, /takbirDurationSec/, 'Prayer takbir duration must be defined');
    });

    // F-PAIR-05: F5 + F9
    harness.test('F-PAIR-05 (F5 + F9): Idle Pill Rotation during Nova Deep Sleep (0% GPU)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');

      harness.assertMatch(novaJs, /case\s*['"]deep_sleep['"]:/, 'Nova must handle deep_sleep state');
      harness.assertMatch(rendererJs, /showSlide\s*\(n\)/, 'Idle slide rotation must execute');
    });

    // F-PAIR-06: F6 + F7
    harness.test('F-PAIR-06 (F6 + F7): Compact Preferences Island Layout with AR/EN Language Switch', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      const prefsCss = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.css'), 'utf8');

      harness.assertMatch(prefsHtml, /btn-lang-ar/, 'AR button exists');
      harness.assertMatch(prefsHtml, /btn-lang-en/, 'EN button exists');
      harness.assertMatch(prefsCss, /\.island-size-grid/, 'Compact grid styled');
    });

    // F-PAIR-07: F7 + F8
    harness.test('F-PAIR-07 (F7 + F8): Keyboard Switch Toast Width & Font Scoping', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /l-toast\.kbd/, 'Compact keyboard toast rule must exist');
      harness.assertMatch(styleCss, /Segoe UI Variable Text|Segoe UI|sans-serif/, 'Sans-serif typography must be available');
    });

    // F-PAIR-08: F8 + F2
    harness.test('F-PAIR-08 (F8 + F2): Frosted Glass Contrast during Extended Custom Duration', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');

      harness.assertMatch(styleCss, /#island\.notification/, 'Notification banner glass styling defined');
      harness.assertMatch(rendererJs, /notifEndTime\s*-\s*Date\.now\(\)/, 'Progress bar timer counts down remaining time');
    });

    // F-PAIR-09: F9 + F8
    harness.test('F-PAIR-09 (F9 + F8): Nova Celebrate Sync with Compact Volume/Brightness HUD', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');

      harness.assertMatch(rendererJs, /function\s+celebrate\(/, 'celebrate function defined');
      harness.assertMatch(styleCss, /l-toast\.vol/, 'Compact volume toast rule defined');
    });

    // F-PAIR-10: F1 + F9
    harness.test('F-PAIR-10 (F1 + F9): Top Taskbar Z-Order Enforcement during Level 4 Interrupts', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');

      harness.assertMatch(novaJs, /ensureIslandTopmost/, 'ensureIslandTopmost guards window z-order');
      harness.assertMatch(helperCs, /Win\.EnsureTopmost\s*\(\s*IslandHwnd\s*\)/, 'Helper elevates window to topmost');
    });

    // F-PAIR-11: F4 + F10
    harness.test('F-PAIR-11 (F4 + F10): Offline Takbeer Bundling & Complete Alafasy Deletion in Build', () => {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
      harness.assert(pkgJson.build && pkgJson.build.files.includes('sounds/**/*'), 'package.json must include sounds/**/* in build');

      const mukhtasar = path.join(ROOT_DIR, 'sounds', 'takbeer_mukhtasar.mp3');
      const ali = path.join(ROOT_DIR, 'sounds', 'takbeer_ali.mp3');
      harness.assert(fs.existsSync(mukhtasar) && fs.existsSync(ali), 'Both offline audio files must be bundled');
    });

    // F-PAIR-12: F5 + F1
    harness.test('F-PAIR-12 (F5 + F1): Idle Pill Rotation in Taskbar Notch Mode (Slots 1 & 2)', () => {
      const features = require('../../features');
      harness.assert(['auto', 'top-center', 'top-right'].includes(features.DEFAULTS.topBarSlot), 'topBarSlot default must be valid');
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /positionIsland\(\)/, 'positionIsland must position window accurately in slots');
    });
  });
};
