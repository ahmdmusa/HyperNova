// ai/preload-snippet.js - ContextBridge Snippets for Preload Scripts

// For main preload.js (Exposed to window.nova):
const aiIslandBridge = {
  breakdown: (goal) => ipcRenderer.invoke('ai-breakdown', goal),
  getConfig: () => ipcRenderer.invoke('ai-get-config'),
};

// For prefs/preload.js (Exposed to window.prefs):
const aiPrefsBridge = {
  getConfig: () => ipcRenderer.invoke('ai-get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('ai-save-config', cfg),
  deleteKey: () => ipcRenderer.invoke('ai-delete-key'),
  testKey: (cfg) => ipcRenderer.invoke('ai-test-key', cfg),
};

module.exports = {
  aiIslandBridge,
  aiPrefsBridge,
};
