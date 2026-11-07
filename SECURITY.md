# Security Policy

## 🛡️ Architecture & Security Commitments

HyperNova Island is designed with a **Zero-Trust, Zero-Telemetry, Bring-Your-Own-Key (BYOK)** architecture.

### 1. Bring Your Own Key (BYOK) for AI Services
- **No Embedded Credentials**: HyperNova Island does **not** bundle, ship, or hardcode any API keys or tokens in its source code, repositories, or compiled packages (`app.asar`).
- **Process Isolation**: The renderer process (UI layer) never sees, reads, or caches raw API keys. All outbound AI calls are handled exclusively by the Electron Main Process via IPC.
- **Local Native Encryption**: API keys are encrypted at rest using Electron's `safeStorage.encryptString()` (backed by Windows DPAPI or macOS Keychain). If OS-level keyring encryption is unavailable, keys are held in volatile memory only for the active session.
- **Credential Masking**: Logs, error outputs, and crash diagnostics strictly redact any strings resembling API keys (e.g. `sk-****` or `AIza-****`).
- **Cost Protection & Rate Limiting**: Outbound AI calls are strictly throttled (10 requests/minute max, 15-second timeout) to protect users from inadvertent consumption.

### 2. Supported Versions

| Version | Supported |
| :--- | :--- |
| 1.3.x | :white_check_mark: |
| < 1.3.0 | :x: |

### 3. Reporting a Vulnerability

If you discover a security vulnerability or credential handling concern, please do **NOT** open a public issue.
Instead, report it confidentially via GitHub Security Advisories or by emailing:
`security@novaisland.internal` (or contacting the core maintainer).

All legitimate reports receive an acknowledgement within 48 hours and an expedited fix release.
