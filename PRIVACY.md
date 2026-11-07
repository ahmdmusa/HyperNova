# Privacy Policy

HyperNova Island is an open-source ambient productivity hub designed to run 100% locally on your personal desktop.

## 🔒 Fundamental Privacy Principles

1. **Zero Telemetry**:
   - HyperNova Island contains **no tracking codes, no user analytics, and no third-party telemetry libraries**.
   - Your computer usage, open applications, keystrokes, and clipboard history never leave your device.

2. **Local Data Persistence**:
   - All tasks, streak statistics, notes, and prayer caches are stored in local JSON/localStorage files on your local drive (`%APPDATA%/Nova Island/`).
   - You retain complete ownership of your data at all times.

3. **External Network Requests**:
   - **Prayer Times**: Only coordinates/city are queried against public astronomical APIs (AlAdhan) or calculated entirely locally offline.
   - **AI Task Decomposition**: When you explicitly provide an API key and click "✨ فكك", the specific task goal is transmitted directly over HTTPS to the provider you configured (Google Gemini, OpenAI, or local Ollama). No intermediary server ever touches your request.
