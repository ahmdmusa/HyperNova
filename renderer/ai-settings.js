// renderer/ai-settings.js - Frontend Component for Bring-Your-Own-Key (BYOK) AI Management
// Strictly interfaces via window.prefs.ai or window.nova.ai (never reads raw keys from disk).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AISettings = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getBridge() {
    if (typeof window !== 'undefined') {
      if (window.prefs && window.prefs.ai) return window.prefs.ai;
      if (window.nova && window.nova.ai) return window.nova.ai;
    }
    return null;
  }

  const PROVIDER_DEFAULTS = {
    gemini: { model: 'gemini-1.5-flash', label: 'Google Gemini (الموصى به)', endpoint: '' },
    openai: { model: 'gpt-4o-mini', label: 'OpenAI (GPT-4o mini)', endpoint: '' },
    ollama: { model: 'llama3.2', label: 'Ollama (محلي بدون إنترنت)', endpoint: 'http://127.0.0.1:11434' },
  };

  /**
   * Renders the complete BYOK settings card inside any container element.
   */
  async function renderAISettings(container) {
    if (!container) return;

    const bridge = getBridge();
    if (!bridge) {
      container.innerHTML = '<p class="error">جسر الأمان غير متاح.</p>';
      return;
    }

    let currentConfig = {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      customEndpoint: '',
      hasKey: false,
      isEncrypted: false,
      encryptionAvailable: true,
    };

    try {
      const res = await bridge.getConfig();
      if (res && res.ok && res.data) {
        currentConfig = { ...currentConfig, ...res.data };
      }
    } catch (e) {
      console.warn('[AI Settings] Could not load config:', e);
    }

    container.innerHTML = `
      <div class="ai-byok-card" style="display:flex; flex-direction:column; gap:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:12px; padding:16px;">
        <!-- Header & Status Badge -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <b style="font-size:14px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🤖</span> محرك الذكاء الاصطناعي (Bring Your Own Key)
            </b>
            <small style="color:#94a3b8; font-size:11px; display:block; margin-top:2px;">
              استخدم مفتاحك الخاص مجاناً لتفكيك المهام لخطوات مجهرية تناسب ADHD دون مشاركة بياناتك.
            </small>
          </div>
          <span id="ai-status-badge" style="font-size:11px; padding:4px 10px; border-radius:20px; font-weight:600;">
            ${currentConfig.hasKey 
              ? (currentConfig.isEncrypted ? '🔒 مفتاحك مشفر محلياً' : '⚠️ مفتاح مؤقت بالذاكرة') 
              : '⚪ لم يتم إدخال مفتاح'}
          </span>
        </div>

        <!-- Provider Selection -->
        <div style="display:grid; grid-template-columns: 140px 1fr; gap:10px; align-items:center;">
          <label style="font-size:12px; color:#cbd5e1;">مزود الخدمة:</label>
          <select id="ai-select-provider" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 10px; font-size:12px; outline:none;">
            <option value="gemini" ${currentConfig.provider === 'gemini' ? 'selected' : ''}>Google Gemini (سريع ومجاني)</option>
            <option value="openai" ${currentConfig.provider === 'openai' ? 'selected' : ''}>OpenAI (ChatGPT)</option>
            <option value="ollama" ${currentConfig.provider === 'ollama' ? 'selected' : ''}>Ollama (محلي على جهازك)</option>
          </select>
        </div>

        <!-- Model Name -->
        <div style="display:grid; grid-template-columns: 140px 1fr; gap:10px; align-items:center;">
          <label style="font-size:12px; color:#cbd5e1;">اسم النموذج (Model):</label>
          <input type="text" id="ai-input-model" value="${currentConfig.model || ''}" placeholder="gemini-1.5-flash" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 10px; font-size:12px; outline:none; direction:ltr;">
        </div>

        <!-- Custom Endpoint (Ollama / Proxy) -->
        <div id="ai-endpoint-row" style="display:${currentConfig.provider === 'ollama' ? 'grid' : 'none'}; grid-template-columns: 140px 1fr; gap:10px; align-items:center;">
          <label style="font-size:12px; color:#cbd5e1;">عنوان الخادم المحلي:</label>
          <input type="text" id="ai-input-endpoint" value="${currentConfig.customEndpoint || ''}" placeholder="http://127.0.0.1:11434" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 10px; font-size:12px; outline:none; direction:ltr;">
        </div>

        <!-- API Key Input -->
        <div id="ai-key-row" style="display:${currentConfig.provider === 'ollama' ? 'none' : 'grid'}; grid-template-columns: 140px 1fr; gap:10px; align-items:center;">
          <label style="font-size:12px; color:#cbd5e1;">مفتاح API الخاص بك:</label>
          <div style="position:relative; display:flex; align-items:center;">
            <input type="password" id="ai-input-key" placeholder="${currentConfig.hasKey ? '•••••••••••••••• (محفوظ بأمان)' : 'أدخل مفتاحك (AIza... أو sk-...)'}" style="width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 36px 6px 10px; font-size:12px; outline:none; direction:ltr;">
            <button type="button" id="ai-btn-toggle-key" style="position:absolute; right:8px; background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px;" title="إظهار/إخفاء">👁️</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:4px;">
          <button type="button" id="ai-btn-save" style="background:#8b5cf6; color:#fff; border:none; border-radius:8px; padding:7px 14px; font-size:12px; font-weight:600; cursor:pointer;">
            💾 حفظ الإعدادات
          </button>
          <button type="button" id="ai-btn-test" style="background:rgba(255,255,255,0.09); color:#e2e8f0; border:1px solid rgba(255,255,255,0.18); border-radius:8px; padding:7px 14px; font-size:12px; cursor:pointer;">
            ⚡ اختبار الاتصال
          </button>
          <button type="button" id="ai-btn-delete" style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:7px 12px; font-size:12px; cursor:pointer;" ${currentConfig.hasKey ? '' : 'disabled'}>
            🗑️ مسح المفتاح
          </button>
        </div>

        <!-- Result / Feedback Banner -->
        <div id="ai-feedback-msg" style="display:none; font-size:12px; padding:8px 12px; border-radius:8px;"></div>

        <!-- Compact Security & Key Links -->
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:6px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; font-size:11px; color:var(--text-2, #94a3b8);">
          <span>🔒 <b>تشفير محلي (DPAPI)</b> · مفتاحك لا يغادر جهازك</span>
          <div style="display:flex; gap:12px;">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#38bdf8; text-decoration:none; font-size:10.5px;">🔗 مفتاح Gemini</a>
            <a href="https://platform.openai.com/api-keys" target="_blank" style="color:#38bdf8; text-decoration:none; font-size:10.5px;">🔗 مفتاح OpenAI</a>
          </div>
        </div>
      </div>
    `;

    // Elements
    const badge = container.querySelector('#ai-status-badge');
    const selectProvider = container.querySelector('#ai-select-provider');
    const inputModel = container.querySelector('#ai-input-model');
    const inputEndpoint = container.querySelector('#ai-input-endpoint');
    const inputKey = container.querySelector('#ai-input-key');
    const endpointRow = container.querySelector('#ai-endpoint-row');
    const keyRow = container.querySelector('#ai-key-row');
    const btnToggleKey = container.querySelector('#ai-btn-toggle-key');
    const btnSave = container.querySelector('#ai-btn-save');
    const btnTest = container.querySelector('#ai-btn-test');
    const btnDelete = container.querySelector('#ai-btn-delete');
    const feedback = container.querySelector('#ai-feedback-msg');

    function updateBadgeStyle(cfg) {
      if (cfg.hasKey) {
        if (cfg.isEncrypted) {
          badge.style.background = 'rgba(16, 185, 129, 0.2)';
          badge.style.color = '#34d399';
          badge.style.border = '1px solid rgba(16, 185, 129, 0.4)';
          badge.textContent = '🔒 مفتاحك مشفر محلياً';
        } else {
          badge.style.background = 'rgba(245, 158, 11, 0.2)';
          badge.style.color = '#fbbf24';
          badge.style.border = '1px solid rgba(245, 158, 11, 0.4)';
          badge.textContent = '⚠️ جلسة مؤقتة (ذاكرة فقط)';
        }
        btnDelete.disabled = false;
      } else {
        badge.style.background = 'rgba(255, 255, 255, 0.08)';
        badge.style.color = '#94a3b8';
        badge.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        badge.textContent = '⚪ لم يتم إدخال مفتاح';
        btnDelete.disabled = true;
      }
    }

    updateBadgeStyle(currentConfig);

    // Show/Hide endpoint row depending on provider
    selectProvider.addEventListener('change', () => {
      const p = selectProvider.value;
      const def = PROVIDER_DEFAULTS[p];
      if (def) {
        inputModel.value = def.model;
        inputModel.placeholder = def.model;
        if (def.endpoint) inputEndpoint.value = def.endpoint;
      }
      if (p === 'ollama') {
        endpointRow.style.display = 'grid';
        keyRow.style.display = 'none';
      } else {
        endpointRow.style.display = 'none';
        keyRow.style.display = 'grid';
      }
    });

    // Toggle password visibility
    btnToggleKey.addEventListener('click', () => {
      if (inputKey.type === 'password') {
        inputKey.type = 'text';
        btnToggleKey.textContent = '🙈';
      } else {
        inputKey.type = 'password';
        btnToggleKey.textContent = '👁️';
      }
    });

    function showFeedback(msg, type) {
      feedback.style.display = 'block';
      feedback.textContent = msg;
      if (type === 'success') {
        feedback.style.background = 'rgba(16, 185, 129, 0.15)';
        feedback.style.color = '#34d399';
        feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      } else if (type === 'error') {
        feedback.style.background = 'rgba(239, 68, 68, 0.15)';
        feedback.style.color = '#f87171';
        feedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      } else {
        feedback.style.background = 'rgba(59, 130, 246, 0.15)';
        feedback.style.color = '#60a5fa';
        feedback.style.border = '1px solid rgba(59, 130, 246, 0.3)';
      }
    }

    // Save button
    btnSave.addEventListener('click', async () => {
      btnSave.disabled = true;
      btnSave.textContent = '⏳ جاري الحفظ...';

      const payload = {
        provider: selectProvider.value,
        model: inputModel.value.trim(),
        customEndpoint: inputEndpoint.value.trim(),
      };

      if (inputKey.value.trim().length > 0) {
        payload.key = inputKey.value.trim();
      }

      try {
        const res = await bridge.saveConfig(payload);
        if (res && res.ok && res.data) {
          currentConfig = res.data;
          updateBadgeStyle(currentConfig);
          inputKey.value = '';
          inputKey.placeholder = '•••••••••••••••• (محفوظ ومُشفّر)';
          showFeedback('تم حفظ وتشفير إعدادات الذكاء الاصطناعي بنجاح ✓', 'success');
        } else {
          showFeedback(res?.error?.message || 'حدث خطأ أثناء الحفظ', 'error');
        }
      } catch (err) {
        showFeedback(err.message || 'فشل الاتصال بجسر الأمان', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = '💾 حفظ الإعدادات';
      }
    });

    // Test button
    btnTest.addEventListener('click', async () => {
      btnTest.disabled = true;
      btnTest.textContent = '⏳ جاري الاختبار...';
      showFeedback('جاري إرسال طلب اختبار خفيف للمزود...', 'info');

      const testPayload = {
        provider: selectProvider.value,
        model: inputModel.value.trim(),
        customEndpoint: inputEndpoint.value.trim(),
      };

      if (inputKey.value.trim().length > 0) {
        testPayload.key = inputKey.value.trim();
      }

      try {
        const res = await bridge.testKey(testPayload);
        if (res && res.ok) {
          showFeedback(`الاتصال ناجح تماماً مع ${testPayload.provider} (${res.data.model}) ✓`, 'success');
        } else {
          showFeedback(`فشل الاختبار: ${res?.error?.message || 'تحقق من المفتاح أو الاتصال'}`, 'error');
        }
      } catch (err) {
        showFeedback(`فشل الاختبار: ${err.message}`, 'error');
      } finally {
        btnTest.disabled = false;
        btnTest.textContent = '⚡ اختبار الاتصال';
      }
    });

    // Delete key button
    btnDelete.addEventListener('click', async () => {
      if (!confirm('هل أنت متأكد من حذف مفتاح الـ API المشفر نهائياً؟')) return;
      btnDelete.disabled = true;
      try {
        const res = await bridge.deleteKey();
        if (res && res.ok && res.data) {
          currentConfig = res.data;
          updateBadgeStyle(currentConfig);
          inputKey.value = '';
          inputKey.placeholder = 'أدخل مفتاحك (AIza... أو sk-...)';
          showFeedback('تم مسح المفتاح بنجاح 🗑️', 'info');
        }
      } catch (err) {
        showFeedback('فشل مسح المفتاح: ' + err.message, 'error');
      } finally {
        btnDelete.disabled = false;
      }
    });
  }

  /**
   * Helper function for the Focus view to decompose a goal.
   * If AI fails or is not configured, automatically degrades gracefully to the offline heuristics engine.
   */
  async function breakdownGoal(goal, addTaskCallback, fallbackEngineCallback) {
    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return { ok: false, error: 'الهدف فارغ' };
    }

    const bridge = getBridge();
    if (!bridge || !bridge.breakdown) {
      if (typeof fallbackEngineCallback === 'function') {
        return fallbackEngineCallback(goal);
      }
      return { ok: false, error: 'جسر الذكاء الاصطناعي غير متوفر' };
    }

    try {
      const res = await bridge.breakdown(goal.trim());
      if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
        if (typeof addTaskCallback === 'function') {
          for (const step of res.data) {
            addTaskCallback(step.title, step.category || 'مشاريع');
          }
        }
        return { ok: true, count: res.data.length, data: res.data };
      } else {
        const errMsg = res?.error?.message || 'تعذر استجابة الذكاء الاصطناعي';
        console.warn('[AI Breakdown] Degrading gracefully to offline heuristics:', errMsg);
        if (typeof fallbackEngineCallback === 'function') {
          return fallbackEngineCallback(goal);
        }
        return { ok: false, error: errMsg };
      }
    } catch (err) {
      console.warn('[AI Breakdown] Network/Execution error, using fallback:', err);
      if (typeof fallbackEngineCallback === 'function') {
        return fallbackEngineCallback(goal);
      }
      return { ok: false, error: err.message };
    }
  }

  return {
    renderAISettings,
    breakdownGoal,
    getBridge,
  };
});
