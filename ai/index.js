// ai/index.js - IPC Dispatcher, Rate Limiter & Security Gate for HyperNova Island
// Strictly runs in Electron Main Process.

const { getPublicConfig, getSecretKey, saveConfig, deleteKey } = require('./keystore');
const { breakdownTask, testConnection, maskSecret } = require('./providers');

// In-memory sliding window rate limiter: max 10 requests per 60 seconds
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestamps = [];

function checkRateLimit() {
  const now = Date.now();
  // Filter out timestamps older than 60s
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = requestTimestamps[0];
    const waitSec = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    throw {
      code: 'RATE_LIMIT',
      message: `تجاوزت الحد المسموح (10 طلبات/دقيقة). يرجى الانتظار ${waitSec} ثانية.`,
    };
  }
  requestTimestamps.push(now);
}

function register(ipcMain) {
  if (!ipcMain) return;

  // 1. Get Public AI Configuration (No Secrets)
  ipcMain.handle('ai-get-config', async () => {
    try {
      return { ok: true, data: getPublicConfig() };
    } catch (err) {
      return { ok: false, error: { code: 'KE_ERR', message: err.message } };
    }
  });

  // 2. Save Configuration (Optionally encrypts and stores key)
  ipcMain.handle('ai-save-config', async (_event, payload) => {
    try {
      const publicCfg = saveConfig(payload || {});
      return { ok: true, data: publicCfg };
    } catch (err) {
      return { ok: false, error: { code: 'SAVE_ERR', message: err.message } };
    }
  });

  // 3. Delete Stored Key
  ipcMain.handle('ai-delete-key', async () => {
    try {
      const publicCfg = deleteKey();
      return { ok: true, data: publicCfg };
    } catch (err) {
      return { ok: false, error: { code: 'DEL_ERR', message: err.message } };
    }
  });

  // 4. Test Key / Connection
  ipcMain.handle('ai-test-key', async (_event, customPayload) => {
    const cfg = getPublicConfig();
    const payload = customPayload || {};
    const provider = payload.provider || cfg.provider;
    const model = payload.model || cfg.model;
    const endpoint = payload.customEndpoint || cfg.customEndpoint;
    
    // If user typed a test key in the input field, test that key.
    // Otherwise use the stored secret key.
    const key = (typeof payload.key === 'string' && payload.key.trim().length > 0)
      ? payload.key.trim()
      : getSecretKey();

    if (!key && provider !== 'ollama') {
      return {
        ok: false,
        error: { code: 'NO_KEY', message: 'لم يتم إدخال أو العثور على أي مفتاح API لاختباره.' },
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      checkRateLimit();
      const res = await testConnection({
        provider,
        key,
        model,
        endpoint,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { ok: true, data: res };
    } catch (err) {
      clearTimeout(timeout);
      return {
        ok: false,
        error: {
          code: err.code || 'TEST_FAILED',
          message: maskSecret(err.message || 'فشل اختبار الاتصال', key),
        },
      };
    }
  });

  // 5. Decompose Goal (Breakdown)
  ipcMain.handle('ai-breakdown', async (_event, goal) => {
    const cfg = getPublicConfig();
    const key = getSecretKey();

    if (!key && cfg.provider !== 'ollama') {
      return {
        ok: false,
        error: {
          code: 'NO_KEY',
          message: 'لم يتم ضبط مفتاح الذكاء الاصطناعي (API Key). يرجى التوجه للإعدادات وإدخال مفتاحك الخاص.',
        },
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      checkRateLimit();
      const steps = await breakdownTask({
        provider: cfg.provider,
        key,
        model: cfg.model,
        endpoint: cfg.customEndpoint,
        goal,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { ok: true, data: steps };
    } catch (err) {
      clearTimeout(timeout);
      return {
        ok: false,
        error: {
          code: err.code || 'BREAKDOWN_FAILED',
          message: maskSecret(err.message || 'فشل تفكيك الهدف', key),
        },
      };
    }
  });
}

module.exports = {
  register,
};
