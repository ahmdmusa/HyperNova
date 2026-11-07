// ai/keystore.js - Secure Key Storage for HyperNova Island
// Strictly runs in Electron Main Process. Never expose raw keys to the Renderer.

const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

let inMemoryKey = null; // Used as session-only fallback if OS keyring / safeStorage is unavailable

function getConfigPath() {
  const dir = app.getPath('userData');
  return path.join(dir, 'ai-config.json');
}

function getBackupPath() {
  const dir = app.getPath('userData');
  return path.join(dir, 'ai-config.json.bak');
}

// Atomic file writer
function writeAtomic(filePath, data) {
  const tmpPath = filePath + '.tmp.' + Date.now();
  try {
    fs.writeFileSync(tmpPath, data, 'utf8');
    // If original exists, make a backup first
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, getBackupPath());
      } catch (bakErr) {
        // Non-fatal backup warning
      }
    }
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    throw err;
  }
}

function readConfigFile() {
  const file = getConfigPath();
  if (!fs.existsSync(file)) {
    // Try restoring from backup if present
    const bak = getBackupPath();
    if (fs.existsSync(bak)) {
      try {
        const raw = fs.readFileSync(bak, 'utf8');
        return JSON.parse(raw);
      } catch {}
    }
    return {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      customEndpoint: '',
      encryptedKey: null,
      updatedAt: 0,
    };
  }

  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // Corrupted file, attempt backup restore
    const bak = getBackupPath();
    if (fs.existsSync(bak)) {
      try {
        return JSON.parse(fs.readFileSync(bak, 'utf8'));
      } catch {}
    }
    return {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      customEndpoint: '',
      encryptedKey: null,
      updatedAt: 0,
    };
  }
}

/**
 * Returns safe metadata to send to the UI.
 * NEVER returns the raw or decrypted API key.
 */
function getPublicConfig() {
  const cfg = readConfigFile();
  const encryptionAvailable = typeof safeStorage?.isEncryptionAvailable === 'function' 
    ? safeStorage.isEncryptionAvailable() 
    : false;

  const hasEncryptedKey = !!(cfg.encryptedKey && cfg.encryptedKey.length > 0);
  const hasKey = hasEncryptedKey || !!(inMemoryKey && inMemoryKey.length > 0);

  return {
    provider: cfg.provider || 'gemini',
    model: cfg.model || (cfg.provider === 'openai' ? 'gpt-4o-mini' : (cfg.provider === 'ollama' ? 'llama3.2' : 'gemini-1.5-flash')),
    customEndpoint: cfg.customEndpoint || '',
    hasKey,
    isEncrypted: hasEncryptedKey,
    encryptionAvailable,
    inMemoryOnly: !hasEncryptedKey && !!inMemoryKey,
    updatedAt: cfg.updatedAt || 0,
  };
}

/**
 * Decrypts and returns the raw secret key for internal API dispatch in Main.
 * @returns {string|null}
 */
function getSecretKey() {
  const cfg = readConfigFile();
  if (inMemoryKey) return inMemoryKey;

  if (!cfg.encryptedKey) return null;

  try {
    const encryptionAvailable = typeof safeStorage?.isEncryptionAvailable === 'function' 
      ? safeStorage.isEncryptionAvailable() 
      : false;

    if (!encryptionAvailable) {
      console.warn('[AI Keystore] safeStorage encryption unavailable on this OS/session.');
      return null;
    }

    const encryptedBuffer = Buffer.from(cfg.encryptedKey, 'base64');
    const decrypted = safeStorage.decryptString(encryptedBuffer);
    return decrypted || null;
  } catch (err) {
    console.error('[AI Keystore] Failed to decrypt stored key:', err.message);
    return null;
  }
}

/**
 * Saves AI settings. If a new key is provided, encrypts it or holds it in memory.
 */
function saveConfig({ provider, model, customEndpoint, key }) {
  const cfg = readConfigFile();

  if (typeof provider === 'string' && provider.trim()) cfg.provider = provider.trim();
  if (typeof model === 'string' && model.trim()) cfg.model = model.trim();
  if (typeof customEndpoint === 'string') cfg.customEndpoint = customEndpoint.trim();

  // If a new key string was supplied:
  if (typeof key === 'string') {
    const trimmedKey = key.trim();
    if (trimmedKey.length === 0) {
      // Empty key string means delete key
      cfg.encryptedKey = null;
      inMemoryKey = null;
    } else {
      const encryptionAvailable = typeof safeStorage?.isEncryptionAvailable === 'function' 
        ? safeStorage.isEncryptionAvailable() 
        : false;

      if (encryptionAvailable) {
        try {
          const encrypted = safeStorage.encryptString(trimmedKey);
          cfg.encryptedKey = encrypted.toString('base64');
          inMemoryKey = null; // Persisted securely, clear in-memory
        } catch (encErr) {
          console.error('[AI Keystore] Encryption failed, retaining in-memory only:', encErr.message);
          cfg.encryptedKey = null;
          inMemoryKey = trimmedKey;
        }
      } else {
        // Fallback for Linux without keyring or environments without DPAPI
        cfg.encryptedKey = null;
        inMemoryKey = trimmedKey;
      }
    }
  }

  cfg.updatedAt = Date.now();
  writeAtomic(getConfigPath(), JSON.stringify(cfg, null, 2));
  return getPublicConfig();
}

/**
 * Completely removes stored key.
 */
function deleteKey() {
  const cfg = readConfigFile();
  cfg.encryptedKey = null;
  cfg.updatedAt = Date.now();
  inMemoryKey = null;
  writeAtomic(getConfigPath(), JSON.stringify(cfg, null, 2));
  return getPublicConfig();
}

module.exports = {
  getPublicConfig,
  getSecretKey,
  saveConfig,
  deleteKey,
  readConfigFile,
};
