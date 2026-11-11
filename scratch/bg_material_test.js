const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false, transparent: true });
  const has = typeof win.setBackgroundMaterial;
  let res = 'none';
  if (has === 'function') {
    try {
      win.setBackgroundMaterial('acrylic');
      res = 'acrylic ok';
    } catch (e) {
      res = 'error: ' + e.message;
    }
  }
  fs.writeFileSync(path.join(__dirname, 'bg_material_test.txt'), `has: ${has}, res: ${res}`);
  app.quit();
});
