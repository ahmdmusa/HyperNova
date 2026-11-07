const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'prefs', 'prefs.js');
let code = fs.readFileSync(filePath, 'utf8');

// Ensure applyPrefsTheme is at the top
if (!code.includes('function applyPrefsTheme')) {
  const funcDef = `function applyPrefsTheme(theme) {
  const t = theme || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.body.classList.remove('theme-dark', 'theme-black', 'theme-light');
  document.body.classList.add('theme-' + t);
  const darkBtn = document.querySelector('#btn-theme-dark');
  const blackBtn = document.querySelector('#btn-theme-black');
  const lightBtn = document.querySelector('#btn-theme-light');
  if (darkBtn) darkBtn.classList.toggle('sel', t === 'dark');
  if (blackBtn) blackBtn.classList.toggle('sel', t === 'black');
  if (lightBtn) lightBtn.classList.toggle('sel', t === 'light');
}

`;
  code = funcDef + code;
}

// In showFeatures, replace the theme check with applyPrefsTheme
code = code.replace(/if\s*\(features\.islandTheme\)\s*\{[\s\S]*?#btn-theme-light[\s\S]*?\}/, 'if (features.islandTheme) applyPrefsTheme(features.islandTheme);');

// Replace the old btnThemeDark/btnThemeLight event listeners
const oldPattern = /\/\/\s*Theme Mode \(Dark \/ Light\)[\s\S]*?api\.setFeatures\(\{\s*islandTheme:\s*'light'\s*\}\);[\s\S]*?\}\s*\}/;
const newListener = `// Theme Mode (Dark / Black OLED / Apple Light)
  const themeButtons = [
    { id: '#btn-theme-dark', val: 'dark', msgAr: 'تم تفعيل النمط الداكن', msgEn: 'Dark Mode Enabled' },
    { id: '#btn-theme-black', val: 'black', msgAr: 'تم تفعيل نمط الأسود الفائق (OLED)', msgEn: 'Black OLED Mode Enabled' },
    { id: '#btn-theme-light', val: 'light', msgAr: 'تم تفعيل النمط الفاتح (Apple Light)', msgEn: 'Apple Light Mode Enabled' }
  ];
  themeButtons.forEach(({ id, val, msgAr, msgEn }) => {
    const btn = document.querySelector(id);
    if (btn) {
      btn.addEventListener('click', () => {
        applyPrefsTheme(val);
        api.setFeatures({ islandTheme: val });
        saved(currentLang === 'ar' ? msgAr : msgEn);
      });
    }
  });`;

if (oldPattern.test(code)) {
  code = code.replace(oldPattern, newListener);
} else {
  console.log('Old theme button pattern not found directly, checking alternative...');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('prefs.js updated successfully!');
