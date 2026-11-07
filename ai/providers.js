// ai/providers.js - Multi-Provider AI Engine (Gemini, OpenAI, Ollama)
// Strictly handles outbound API requests inside the Main Process.

const https = require('https');
const http = require('http');

/**
 * Strips any potential secret tokens from error strings or logs.
 */
function maskSecret(text, secret) {
  if (!text || typeof text !== 'string') return text;
  let masked = text;
  if (secret && typeof secret === 'string' && secret.length > 4) {
    const replacement = secret.startsWith('AIza') ? 'AIza-****' : 'sk-****';
    masked = masked.split(secret).join(replacement);
  }
  // Generic regex for API keys
  masked = masked.replace(/AIza[0-9A-Za-z-_]{30,45}/g, 'AIza-****');
  masked = masked.replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-****');
  return masked;
}

/**
 * Standard fetch helper using native Node.js fetch or http/https.
 */
async function postJson(urlStr, headers, body, signal) {
  const url = new URL(urlStr);
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  const payload = typeof body === 'string' ? body : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            body: rawData,
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        req.destroy();
        const err = new Error('Request aborted due to timeout');
        err.name = 'AbortError';
        reject(err);
      });
    }

    req.write(payload);
    req.end();
  });
}

/**
 * Test Connection logic for each provider.
 */
async function testConnection({ provider, key, model, endpoint, signal }) {
  try {
    if (provider === 'gemini') {
      if (!key) throw { code: 'NO_KEY', message: 'مفتاح Gemini مفقود' };
      const m = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await postJson(
        url,
        {},
        {
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 2 },
        },
        signal
      );
      if (!res.ok) {
        if (res.status === 400 || res.status === 403 || res.status === 401) {
          throw { code: 'BAD_KEY', message: 'مفتاح Gemini غير صالح أو منتهي الصلاحية.' };
        } else if (res.status === 429) {
          throw { code: 'RATE_LIMIT', message: 'تجاوزت حصة الاستخدام لدى Google Gemini.' };
        } else {
          throw { code: 'SERVER_ERR', message: `خطأ من مزود الخدمة (كود: ${res.status}).` };
        }
      }
      return { ok: true, provider: 'gemini', model: m };
    }

    if (provider === 'openai') {
      if (!key) throw { code: 'NO_KEY', message: 'مفتاح OpenAI مفقود' };
      const m = model || 'gpt-4o-mini';
      const url = 'https://api.openai.com/v1/chat/completions';
      const res = await postJson(
        url,
        { Authorization: `Bearer ${key}` },
        {
          model: m,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 2,
        },
        signal
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw { code: 'BAD_KEY', message: 'مفتاح OpenAI غير صالح أو منتهي الصلاحية.' };
        } else if (res.status === 429) {
          throw { code: 'RATE_LIMIT', message: 'تجاوزت حصة الاستخدام لدى OpenAI.' };
        } else {
          throw { code: 'SERVER_ERR', message: `خطأ من خادم OpenAI (كود: ${res.status}).` };
        }
      }
      return { ok: true, provider: 'openai', model: m };
    }

    if (provider === 'ollama') {
      const ep = endpoint ? endpoint.replace(/\/+$/, '') : 'http://127.0.0.1:11434';
      const m = model || 'llama3.2';
      const url = `${ep}/api/generate`;
      const res = await postJson(
        url,
        {},
        {
          model: m,
          prompt: 'ping',
          stream: false,
          options: { num_predict: 2 },
        },
        signal
      );
      if (!res.ok) {
        throw { code: 'SERVER_ERR', message: `تعذر الاتصال بـ Ollama (كود: ${res.status}). تأكد من تشغيله.` };
      }
      return { ok: true, provider: 'ollama', model: m };
    }

    throw { code: 'BAD_CONFIG', message: `المزود ${provider} غير مدعوم.` };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw { code: 'TIMEOUT', message: 'انتهت مهلة الاتصال (15 ثانية). تحقق من سرعة الإنترنت.' };
    }
    if (err.code && err.message) throw err;
    throw { code: 'NETWORK_ERR', message: maskSecret(err.message || 'تعذر الاتصال بالإنترنت', key) };
  }
}

/**
 * Breakdown user goal into actionable sub-steps.
 */
async function breakdownTask({ provider, key, model, endpoint, goal, signal }) {
  if (!goal || typeof goal !== 'string' || !goal.trim()) {
    throw { code: 'INVALID_INPUT', message: 'يرجى إدخال نص المهمة أو الهدف.' };
  }

  const cleanGoal = goal.trim().slice(0, 500); // Max 500 chars limit

  const prompt = `أنت مساعد تنفيذي لكسر الشلل التنفيذي والتشتت لمرضى ADHD وزيادة الإنتاجية.
الهدف الكبير أو المهمة: "${cleanGoal}".
قم بتفكيك هذه المهمة إلى 3 إلى 4 خطوات مجهرية متتالية وقابلة للتنفيذ فوراً.
القاعدة الذهبية: الخطوة الأولى يجب أن تكون سهلة جداً وفيزيائية وتستغرق دقيقتين أو أقل (مثال: فتح البرنامج أو كتابة العنوان).
أجب حصراً بصيغة JSON التالية بدون أي مقدمات أو شروحات:
{
  "steps": [
    {
      "title": "نص الخطوة",
      "duration": 5,
      "category": "مشاريع"
    }
  ]
}`;

  try {
    let rawText = '';

    if (provider === 'gemini') {
      if (!key) throw { code: 'NO_KEY', message: 'لم يتم ضبط مفتاح Gemini API. يرجى إضافته من الإعدادات.' };
      const m = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await postJson(
        url,
        {},
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        },
        signal
      );

      if (!res.ok) {
        if (res.status === 400 || res.status === 403 || res.status === 401) {
          throw { code: 'BAD_KEY', message: 'مفتاح Gemini API غير صالح.' };
        } else if (res.status === 429) {
          throw { code: 'RATE_LIMIT', message: 'تجاوزت معدل طلبات Gemini.' };
        } else {
          throw { code: 'SERVER_ERR', message: `خطأ من Gemini API (${res.status}).` };
        }
      }

      const json = JSON.parse(res.body);
      rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai') {
      if (!key) throw { code: 'NO_KEY', message: 'لم يتم ضبط مفتاح OpenAI API. يرجى إضافته من الإعدادات.' };
      const m = model || 'gpt-4o-mini';
      const url = 'https://api.openai.com/v1/chat/completions';
      const res = await postJson(
        url,
        { Authorization: `Bearer ${key}` },
        {
          model: m,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        signal
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw { code: 'BAD_KEY', message: 'مفتاح OpenAI API غير صالح.' };
        } else if (res.status === 429) {
          throw { code: 'RATE_LIMIT', message: 'تجاوزت معدل طلبات OpenAI.' };
        } else {
          throw { code: 'SERVER_ERR', message: `خطأ من OpenAI API (${res.status}).` };
        }
      }

      const json = JSON.parse(res.body);
      rawText = json?.choices?.[0]?.message?.content || '';
    } else if (provider === 'ollama') {
      const ep = endpoint ? endpoint.replace(/\/+$/, '') : 'http://127.0.0.1:11434';
      const m = model || 'llama3.2';
      const url = `${ep}/api/generate`;
      const res = await postJson(
        url,
        {},
        {
          model: m,
          prompt,
          format: 'json',
          stream: false,
        },
        signal
      );

      if (!res.ok) {
        throw { code: 'SERVER_ERR', message: `تعذر الاتصال بـ Ollama (${res.status}).` };
      }

      const json = JSON.parse(res.body);
      rawText = json?.response || '';
    } else {
      throw { code: 'BAD_CONFIG', message: `المزود ${provider} غير مدعوم.` };
    }

    // Parse JSON response safely
    let parsed;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : rawText);
    } catch {
      throw { code: 'PARSE_ERR', message: 'لم نتمكن من تحليل استجابة الذكاء الاصطناعي.' };
    }

    if (Array.isArray(parsed?.steps) && parsed.steps.length > 0) {
      return parsed.steps.map((s, idx) => ({
        id: 'ai_step_' + Date.now() + '_' + idx,
        title: typeof s === 'string' ? s : (s.title || `خطوة ${idx + 1}`),
        duration: s.duration || 5,
        category: s.category || 'مشاريع',
      }));
    }

    throw { code: 'EMPTY_RESPONSE', message: 'لم يتم استلام خطوات صالحة من النموذج.' };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw { code: 'TIMEOUT', message: 'انتهت مهلة معالجة الهدف (15 ثانية). يرجى المحاولة لاحقاً.' };
    }
    if (err.code && err.message) throw err;
    throw { code: 'NETWORK_ERR', message: maskSecret(err.message || 'خطأ في الشبكة', key) };
  }
}

module.exports = {
  breakdownTask,
  testConnection,
  maskSecret,
};
