// The Settings window: a normal, focusable top-level window.
const path = require('path');
const { BrowserWindow, ipcMain, shell } = require('electron');

let win = null;

function openExternalSafe(url) {
  if (/^https?:\/\//i.test(String(url || ''))) {
    shell.openExternal(url).catch(() => {});
  }
}

function open() {
  if (win && !win.isDestroyed()) {
    if (win.webContents.isCrashed()) {
      try { win.destroy(); } catch {}
      win = null;
    } else {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      return win;
    }
  }

  const indexFile = path.join(__dirname, 'prefs', 'index.html');
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 660,
    minHeight: 480,
    center: true,
    frame: false,
    show: false,
    backgroundColor: '#101016',
    title: 'HyperNova — Settings',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'prefs', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setMenu(null);

  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    e.preventDefault();
    openExternalSafe(url);
  });

  win.webContents.on('preload-error', (_e, p, err) => {
    console.error('[prefs-preload-error]', p, err);
  });

  win.webContents.on('console-message', (e, level, message, line, source) => {
    const lv = typeof e.level === 'string' ? e.level : level;
    const msg = e.message ?? message;
    const src = e.sourceId ?? source;
    const ln = e.lineNumber ?? line;
    if (lv === 'warning' || lv === 'error' || lv >= 2) {
      console.error('[prefs]', msg, src ? `(${path.basename(src)}:${ln})` : '');
    }
  });

  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[prefs] did-fail-load:', code, desc);
    setTimeout(() => {
      if (win && !win.isDestroyed()) win.loadFile(indexFile).catch(() => {});
    }, 300);
  });

  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('[prefs] render-process-gone:', details?.reason);
    setTimeout(() => {
      if (win && !win.isDestroyed()) win.loadFile(indexFile).catch(() => {});
    }, 300);
  });

  win.loadFile(indexFile);

  win.once('ready-to-show', () => {
    if (!win || win.isDestroyed()) return;
    win.show();
    win.focus();
  });

  win.webContents.on('did-finish-load', () => {
    if (!win || win.isDestroyed()) return;
    try { win.webContents.setAudioMuted(false); } catch {}
    if (!win.isVisible()) {
      win.show();
      win.focus();
    }
  });

  win.on('closed', () => {
    win = null;
  });
  return win;
}

function getWindow() {
  return win && !win.isDestroyed() ? win : null;
}

function send(channel, data) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

ipcMain.on('prefs-window', (e, action) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w || w !== win) return;
  if (action === 'close') w.close();
  else if (action === 'minimize') w.minimize();
});

module.exports = { open, send, getWindow };
