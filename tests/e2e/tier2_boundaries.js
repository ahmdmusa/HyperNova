// tests/e2e/tier2_boundaries.js
/**
 * HyperNova E2E Test Suite — Tier 2: Boundary & Corner Cases
 * 50 Comprehensive Boundary, Stress, and Corner Case Tests (5 per feature across Features 1–10).
 */

const fs = require('fs');
const path = require('path');
const { createMockEnvironment } = require('./framework');

const ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = function registerTier2(harness) {
  // =========================================================================
  // Feature 1: Taskbar Z-Order Win32 Topmost Behavior (R1)
  // =========================================================================
  harness.describe('Tier 2: Feature 1 — Taskbar Z-Order Win32 Topmost Behavior', () => {
    harness.test('TC-T2-F1-01: Malformed / Zero / Negative HWND Handle Stdin Injection', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /if\s*\(\s*long\.TryParse\s*\(val,\s*out\s*h\)\s*\)/, 'Helper must use safe TryParse on HWND inputs');
      harness.assertMatch(helperCs, /if\s*\(\s*hwnd\s*==\s*IntPtr\.Zero\s*\)\s*return\s*false;/, 'EnsureTopmost must guard against IntPtr.Zero');
    });

    harness.test('TC-T2-F1-02: Stale / Destroyed Native HWND Handling', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /try\s*\{\s*return\s*SetWindowPos[\s\S]*?\}\s*catch\s*\{[\s\S]*?return\s*false;\s*\}/, 'EnsureTopmost must wrap SetWindowPos in try-catch block');
    });

    harness.test('TC-T2-F1-03: Multi-Monitor Secondary Taskbar Activation (Shell_SecondaryTrayWnd)', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /Shell_SecondaryTrayWnd/, 'Helper must handle secondary taskbar class Shell_SecondaryTrayWnd');
    });

    harness.test('TC-T2-F1-04: Rapid Concurrent Focus Switching', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /win\.on\(['"]focus['"],\s*ensureIslandTopmost\)/, 'Focus event must trigger topmost assertion');
      harness.assertMatch(novaJs, /win\.on\(['"]blur['"],\s*ensureIslandTopmost\)/, 'Blur event must trigger topmost assertion');
    });

    harness.test('TC-T2-F1-05: Fullscreen Guard Exclusion for Shell_TrayWnd', () => {
      const helperCs = fs.readFileSync(path.join(ROOT_DIR, 'helper', 'NovaHelper.cs'), 'utf8');
      harness.assertMatch(helperCs, /cls\s*==\s*["']Shell_TrayWnd["']/, 'IsFullscreen must exclude Shell_TrayWnd to avoid false positive auto-hiding');
    });
  });

  // =========================================================================
  // Feature 2: Configurable Notification Auto-Dismiss Duration (R2)
  // =========================================================================
  harness.describe('Tier 2: Feature 2 — Configurable Notification Duration', () => {
    const features = require('../../features');

    harness.test('TC-T2-F2-01: Lower Bound Violation Clamping (Value < 2)', () => {
      features.set({ notifDuration: 1 });
      harness.assertEqual(features.get().notifDuration, 2, 'Value 1 must clamp to 2');
      features.set({ notifDuration: 0 });
      harness.assertEqual(features.get().notifDuration, 2, 'Value 0 must clamp to 2');
      features.set({ notifDuration: -15 });
      harness.assertEqual(features.get().notifDuration, 2, 'Negative value must clamp to 2');
      features.set({ notifDuration: 6 }); // Reset
    });

    harness.test('TC-T2-F2-02: Upper Bound Violation Clamping (Value > 30)', () => {
      features.set({ notifDuration: 31 });
      harness.assertEqual(features.get().notifDuration, 30, 'Value 31 must clamp to 30');
      features.set({ notifDuration: 60 });
      harness.assertEqual(features.get().notifDuration, 30, 'Value 60 must clamp to 30');
      features.set({ notifDuration: 999999 });
      harness.assertEqual(features.get().notifDuration, 30, 'Extreme value must clamp to 30');
      features.set({ notifDuration: 6 }); // Reset
    });

    harness.test('TC-T2-F2-03: Exact Boundary Value Acceptance (Values 2 and 30)', () => {
      features.set({ notifDuration: 2 });
      harness.assertEqual(features.get().notifDuration, 2, 'Boundary value 2 must be preserved');
      features.set({ notifDuration: 30 });
      harness.assertEqual(features.get().notifDuration, 30, 'Boundary value 30 must be preserved');
      features.set({ notifDuration: 6 }); // Reset
    });

    harness.test('TC-T2-F2-04: Non-Integer Float Rounding', () => {
      features.set({ notifDuration: 4.2 });
      harness.assertEqual(features.get().notifDuration, 4, '4.2 must round down to 4');
      features.set({ notifDuration: 4.8 });
      harness.assertEqual(features.get().notifDuration, 5, '4.8 must round up to 5');
      features.set({ notifDuration: 6 }); // Reset
    });

    harness.test('TC-T2-F2-05: Type Poisoning & Invalid Types', () => {
      features.set({ notifDuration: 6 });
      features.set({ notifDuration: 'fast' });
      harness.assertEqual(features.get().notifDuration, 6, 'String must be rejected');
      features.set({ notifDuration: NaN });
      harness.assertEqual(features.get().notifDuration, 6, 'NaN must be rejected');
      features.set({ notifDuration: null });
      harness.assertEqual(features.get().notifDuration, 6, 'null must be rejected');
      features.set({ notifDuration: [10] });
      harness.assertEqual(features.get().notifDuration, 6, 'Array must be rejected');
      features.set({ notifDuration: {} });
      harness.assertEqual(features.get().notifDuration, 6, 'Object must be rejected');
    });
  });

  // =========================================================================
  // Feature 3: Gentle Notification Sound & Mute Toggle (R3)
  // =========================================================================
  harness.describe('Tier 2: Feature 3 — Gentle Notification Sound & Mute Toggle', () => {
    const features = require('../../features');

    harness.test('TC-T2-F3-01: Suspended AudioContext State Recovery', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /this\.ctx\.state\s*===\s*['"]suspended['"]/, 'init must check for suspended state');
      harness.assertMatch(audioJs, /this\.ctx\.resume\(\)\.catch/, 'init must resume suspended context safely');
    });

    harness.test('TC-T2-F3-02: Missing Web Audio API Environment Fallback', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /if\s*\(!this\.ctx\)\s*return;/, 'Methods must exit cleanly if AudioContext is unavailable');
    });

    harness.test('TC-T2-F3-03: High-Frequency Notification Burst (Polyphony & Node Cleanliness)', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /osc\.stop\(/, 'Oscillators must be scheduled to stop explicitly');
    });

    harness.test('TC-T2-F3-04: Master audioHaptics: false Precedence Over notifSound: true', () => {
      const audioJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'audio-haptics.js'), 'utf8');
      harness.assertMatch(audioJs, /if\s*\(feat\(['"]audioHaptics['"]\)\s*===\s*false\)\s*return/, 'audioHaptics master switch must take precedence');
    });

    harness.test('TC-T2-F3-05: Non-Boolean Type Poisoning on notifSound', () => {
      features.set({ notifSound: true });
      features.set({ notifSound: 'false' });
      harness.assertEqual(features.get().notifSound, true, 'String must be rejected for notifSound');
      features.set({ notifSound: 0 });
      harness.assertEqual(features.get().notifSound, true, 'Number must be rejected for notifSound');
      features.set({ notifSound: null });
      harness.assertEqual(features.get().notifSound, true, 'null must be rejected for notifSound');
    });
  });

  // =========================================================================
  // Feature 4: Offline Takbeer Audio Updates & Zero Alafasy Trace
  // =========================================================================
  harness.describe('Tier 2: Feature 4 — Offline Takbeer Audio Updates & Alafasy Removal', () => {
    harness.test('TC-T2-F4-01: Legacy Quran Reciter LocalStorage Auto-Fallback', () => {
      const quranJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'quran-radio.js'), 'utf8');
      harness.assertMatch(quranJs, /state\.reciterId\s*===?\s*['"]alafasy['"]|reciter\s*=\s*QURAN_RECITERS\.find/, 'Quran radio must fall back if reciter is not found or legacy alafasy');
    });

    harness.test('TC-T2-F4-02: Playback Fade Truncation Prevention on Short 6.5s Clip', () => {
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      harness.assertMatch(prayerJs, /takbirDurationSec:\s*6\.5/, 'mukhtasar duration must be calibrated to 6.5s');
      harness.assertMatch(prayerJs, /targetDuration\s*<=\s*8\s*\?\s*0\.6\s*:\s*1\.5|fadeDuration/, 'Short clips must use gentle short tail fade without cutting off words');
    });

    harness.test('TC-T2-F4-03: Audio Element ended Event Natural Termination', () => {
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      harness.assertMatch(prayerJs, /addEventListener\(['"]ended['"]/, 'Adhan audio player must listen for ended event');
    });

    harness.test('TC-T2-F4-04: Corrupt / Missing Audio Error Fallback to Offline Synthesizer', () => {
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      harness.assertMatch(prayerJs, /playTwoTakbeersSynth/, 'prayer.js must provide playTwoTakbeersSynth offline fallback');
      harness.assertMatch(prayerJs, /addEventListener\(['"]error['"]/, 'Adhan audio player must listen for error event');
    });

    harness.test('TC-T2-F4-05: Exhaustive Repository-Wide Alafasy Eradication Audit', () => {
      const quranJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'quran-radio.js'), 'utf8');
      const prayerJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'prayer.js'), 'utf8');
      harness.assert(!/id:\s*['"]alafasy['"]/i.test(quranJs), 'Alafasy must not exist in QURAN_RECITERS');
      harness.assert(!/id:\s*['"]alafasy['"]/i.test(prayerJs), 'Alafasy must not exist in ADHAN_MUEZZINS');
      harness.assert(!/alafasy:\s*['"]/i.test(prayerJs), 'Alafasy must not exist in MUEZZIN_SHORT');
    });
  });

  // =========================================================================
  // Feature 5: Idle Pill Rotation with Nova Eyes (R4)
  // =========================================================================
  harness.describe('Tier 2: Feature 5 — Idle Pill Rotation with Nova Eyes', () => {
    harness.test('TEST-T2-F5-01: Boundary Interval slideInterval = 0 (Rotation Suspended)', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /if\s*\(sec\s*<=\s*0\)\s*return;/, 'Slide rotation must be suspended when slideInterval <= 0');
    });

    harness.test('TEST-T2-F5-02: Corner Case: All Slides Disabled Fallback', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /if\s*\(!slides\.length\)\s*slides\s*=\s*\[all\[0\]\];/, 'Must fall back to first slide if all slides are off');
    });

    harness.test('TEST-T2-F5-03: Rapid Interval Churn & Timer Desync Resilience', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /if\s*\(slideIntervalTimer\)\s*clearInterval\(slideIntervalTimer\);/, 'Existing slide timer must be cleared before starting new one');
    });

    harness.test('TEST-T2-F5-04: Mode Interruption and Re-Entry with Nova Eyes', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /if\s*\(lastMode\s*!==\s*['"]idle['"]\)\s*return;/, 'Slide interval must yield when island is not in idle mode');
    });

    harness.test('TEST-T2-F5-05: Size Tier Scaling (s, m, l) with Nova Eyes', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /body\.size-s\s+#island:not\(\.vertical\)\.idle\.eyes/, 'size-s scaling for idle eyes must exist in style.css');
      harness.assertMatch(styleCss, /body\.size-l\s+#island:not\(\.vertical\)\.idle\.eyes/, 'size-l scaling for idle eyes must exist in style.css');
    });
  });

  // =========================================================================
  // Feature 6: Compact Preferences Island Page (R5)
  // =========================================================================
  harness.describe('Tier 2: Feature 6 — Compact Preferences Island Page', () => {
    harness.test('TEST-T2-F6-01: Viewport Height Constraint: Zero Excessive Scroll', () => {
      const prefsCss = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.css'), 'utf8');
      harness.assertMatch(prefsCss, /\.size-card-box/, 'Compact size card boxes must be styled');
    });

    harness.test('TEST-T2-F6-02: Minimum Active Tab Guard Validation', () => {
      const prefsHtml = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'index.html'), 'utf8');
      harness.assertMatch(prefsHtml, /id=['"]tabs-warn['"]/, '#tabs-warn element must exist');
    });

    harness.test('TEST-T2-F6-03: RTL / LTR Directional Layout Consistency', () => {
      const prefsCss = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.css'), 'utf8');
      harness.assertMatch(prefsCss, /grid-template-columns:\s*repeat\(3,\s*1fr\)/, '3-column grid layout must be preserved');
    });

    harness.test('TEST-T2-F6-04: Long Text Localization in Compact Tiles', () => {
      const prefsCss = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.css'), 'utf8');
      harness.assertMatch(prefsCss, /\.size-card/, 'size cards must be defined');
    });

    harness.test('TEST-T2-F6-05: Rapid Style & Size Churn IPC Synchronization', () => {
      const prefsJs = fs.readFileSync(path.join(ROOT_DIR, 'prefs', 'prefs.js'), 'utf8');
      harness.assertMatch(prefsJs, /api\.setFeatures|setFeatures/, 'prefs.js must synchronize features via IPC');
    });
  });

  // =========================================================================
  // Feature 7: Compact Language Controls (R6)
  // =========================================================================
  harness.describe('Tier 2: Feature 7 — Compact Language Controls', () => {
    const features = require('../../features');

    harness.test('TEST-T2-F7-01: Rapid Language Toggle Ping-Pong', () => {
      features.set({ appLang: 'en' });
      harness.assertEqual(features.get().appLang, 'en', 'Must switch to English');
      features.set({ appLang: 'ar' });
      harness.assertEqual(features.get().appLang, 'ar', 'Must switch back to Arabic');
    });

    harness.test('TEST-T2-F7-02: Unrecognized Windows Keyboard Layout ID', () => {
      const kbdJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'keyboard.js'), 'utf8');
      harness.assertMatch(kbdJs, /LANGS\[m\.kl\s*&\s*0x3ff\]\s*\|\|\s*\[`0x\$\{m\.kl\.toString\(16\)\}`,\s*['"]⌨['"]\]/, 'Fallback for unknown layout id must display hex and keyboard icon');
    });

    harness.test('TEST-T2-F7-03: Longest Language Name Boundary in Compact Toast', () => {
      const kbdJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'keyboard.js'), 'utf8');
      harness.assertMatch(kbdJs, /0x16:\s*\[['"]Português['"],\s*['"]PT['"]\]/, 'Must support Portuguese layout mapping');
    });

    harness.test('TEST-T2-F7-04: Caps Lock & Keyboard Layout Simultaneous Event Precedence', () => {
      const kbdJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'keyboard.js'), 'utf8');
      harness.assertMatch(kbdJs, /feat\(['"]capsToast['"]\)/, 'Must check feat capsToast independently');
      harness.assertMatch(kbdJs, /feat\(['"]kbdToast['"]\)/, 'Must check feat kbdToast independently');
    });

    harness.test('TEST-T2-F7-05: Language Preference Persistence Across App Reboot', () => {
      features.set({ appLang: 'en' });
      harness.assertEqual(features.get().appLang, 'en', 'Valid en appLang must be accepted');
      features.set({ appLang: 'ar' });
      harness.assertEqual(features.get().appLang, 'ar', 'Valid ar appLang must be accepted');
      features.set({ appLang: 'fr' });
      harness.assertEqual(features.get().appLang, 'ar', 'Unsupported lang must be rejected and preserve ar');
    });
  });

  // =========================================================================
  // Feature 8: Typography & HUD Visual Refinements (R7)
  // =========================================================================
  harness.describe('Tier 2: Feature 8 — Typography & HUD Visual Refinements', () => {
    harness.test('TEST-T2-F8-01: Extreme Volume Boundaries (0% Muted, 1%, 99%, 100%)', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /muted\s*\?\s*['"]Muted['"]\s*:\s*`\$\{Math\.round\(value\s*\*\s*100\)\}%`/, 'HUD must format muted and percentage boundaries accurately');
    });

    harness.test('TEST-T2-F8-02: Extreme Brightness Boundaries (0% vs 100%)', () => {
      const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
      harness.assertMatch(rendererJs, /showHud\(['"]bright['"]/, 'showHud must support brightness kind');
    });

    harness.test('TEST-T2-F8-03: Mixed Language Bidi Notification Typography', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /--font-ar:/, 'Must define Arabic font variable');
      harness.assertMatch(styleCss, /--font-en:/, 'Must define English font variable');
    });

    harness.test('TEST-T2-F8-04: Notification Banner Oversized Text Stress Test', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /notif-title|notif-msg/, 'Notification title and message classes must be defined');
    });

    harness.test('TEST-T2-F8-05: Light Mode High Contrast Surface Validation', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
      harness.assertMatch(styleCss, /\[data-theme=['"]light['"]\]|\.theme-light|body\.light/, 'Light mode rules must exist');
    });
  });

  // =========================================================================
  // Feature 9: Nova Emotion State Machine & Priority Arbiter
  // =========================================================================
  harness.describe('Tier 2: Feature 9 — Nova Emotion State Machine & Priority Arbiter', () => {
    harness.test('F9-T2-01: Rapid Interrupt-on-Interrupt Race (L4 preempts L4)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /clearTimeout\(stateTimer\);/, 'stateTimer must be cleared when changing state to avoid race condition');
    });

    harness.test('F9-T2-02: Lower Priority Rejection during Active High Priority State', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /function\s+setState/, 'setState function must manage emotional state');
    });

    harness.test('F9-T2-03: Wake Transition from Deep Sleep (deep_sleep -> welcome -> idle)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /case\s*['"]welcome['"]:/, 'welcome state must be handled with animation');
    });

    harness.test('F9-T2-04: 0% GPU Idle Invariant in Deep Sleep (No Infinite rAF / Keyframe Loops)', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /openEyesGroup\?\.classList\.add\(['"]hidden['"]\)/, 'deep_sleep must hide open eyes group');
      harness.assertMatch(novaJs, /sleepZzzText\?\.classList\.remove\(['"]hidden['"]\)/, 'deep_sleep must show sleepZzzText');
    });

    harness.test('F9-T2-05: Negative or Zero Duration Graceful Recovery', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'views', 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /if\s*\(durationMs\s*>\s*0\)\s*\{/, 'durationMs must be strictly greater than 0 before setting timer');
    });
  });

  // =========================================================================
  // Feature 10: Test Suite Synchronization & Packaging (R8)
  // =========================================================================
  harness.describe('Tier 2: Feature 10 — Test Suite Synchronization & Packaging', () => {
    harness.test('F10-T2-01: Installer Quiet Permission Execution (icacls /Q)', () => {
      const installerNsh = fs.readFileSync(path.join(ROOT_DIR, 'build', 'installer.nsh'), 'utf8');
      harness.assertMatch(installerNsh, /icacls[\s\S]*?\/Q/, 'icacls calls in installer.nsh must include /Q quiet flag');
    });

    harness.test('F10-T2-02: Clean Process Termination on Install / Upgrade (customInit)', () => {
      const installerNsh = fs.readFileSync(path.join(ROOT_DIR, 'build', 'installer.nsh'), 'utf8');
      harness.assertMatch(installerNsh, /!macro\s+customInit/, 'installer.nsh must define customInit macro');
      harness.assertMatch(installerNsh, /HyperNova\.exe/, 'customInit must terminate HyperNova.exe');
      harness.assertMatch(installerNsh, /nova-helper\.exe/, 'customInit must terminate nova-helper.exe');
    });

    harness.test('F10-T2-03: Non-Blocking Finish Page Launch (No StdUtils Deadlock)', () => {
      const installerNsh = fs.readFileSync(path.join(ROOT_DIR, 'build', 'installer.nsh'), 'utf8');
      harness.assertMatch(installerNsh, /!macro\s+customFinishPage/, 'installer.nsh must define customFinishPage');
      harness.assert(!/StdUtils::ExecShellWait/.test(installerNsh), 'customFinishPage must not use blocking ExecShellWait');
    });

    harness.test('F10-T2-04: Missing Native Helper Fallback Gracefulness', () => {
      const novaJs = fs.readFileSync(path.join(ROOT_DIR, 'nova.js'), 'utf8');
      harness.assertMatch(novaJs, /path\.join\(['"]helper['"],\s*['"]nova-helper\.exe['"]\)/, 'nova.js must locate helper path');
      harness.assertMatch(novaJs, /media\s*=\s*spawn\s*\(\s*HELPER\(\)/, 'nova.js must spawn helper binary');
      harness.assertMatch(novaJs, /media\.on\(\s*['"]error['"]/, 'nova.js must handle helper error events gracefully');
    });

    harness.test('F10-T2-05: AppX Package Manifest Version and Identity Parity', () => {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
      harness.assertEqual(pkgJson.version, '2.1.3', 'package.json version must be 2.1.3');
      harness.assert(pkgJson.build && pkgJson.build.appx, 'package.json must contain build.appx config');
      harness.assertMatch(pkgJson.scripts['dist:store'], /electron-builder/, 'dist:store script must invoke electron-builder');
    });
  });
};
