// deep-focus.js - PAC Server & Distraction Blocker for HyperNova
const http = require('http');

let pacServer = null;
const PAC_PORT = 28472;

const BLOCKED_DOMAINS = [
  'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com',
  'twitter.com', 'x.com', 'reddit.com', 'netflix.com', 'twitch.tv',
  'discord.com', 'web.telegram.org'
];

function buildPac() {
  return `function FindProxyForURL(url, host) {
  var h = (host || "").toLowerCase();
  var blocked = ${JSON.stringify(BLOCKED_DOMAINS)};
  for (var i = 0; i < blocked.length; i++) {
    var d = blocked[i];
    if (dnsDomainIs(h, d) || h === d || shExpMatch(h, "*." + d) || shExpMatch(h, "*" + d + "*")) {
      return "PROXY 127.0.0.1:${PAC_PORT}; PROXY 127.0.0.1:9999";
    }
  }
  return "DIRECT";
}`;
}

function startPacServer() {
  if (pacServer) return;
  try {
    const pacBody = buildPac();
    pacServer = http.createServer((req, res) => {
      // If browser visits blocked site via HTTP proxy on port 28472, show blocker screen
      if (req.url && !req.url.endsWith('.pac')) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>🔒 وضع التركيز العميق مفعّل</title>
  <style>
    body {
      background: #0f0f14;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .box {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 36px 44px;
      max-width: 480px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1 { color: #f87171; font-size: 22px; margin: 0 0 12px; }
    p { color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔒 تم حظر الموقع (وضع التركيز العميق)</h1>
    <p>هذا الموقع مدرج ضمن قائمة المشتتات المحظورة أثناء جلسة التركيز الحالية لمساعدتك على إنجاز مهامك.</p>
  </div>
</body>
</html>`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/x-ns-proxy-autoconfig',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(pacBody);
    });

    pacServer.listen(PAC_PORT, '127.0.0.1', () => {
      console.log('[deep-focus] PAC blocker server running on 127.0.0.1:' + PAC_PORT);
    });
    pacServer.unref();
  } catch (err) {
    console.error('[deep-focus] PAC server error:', err.message);
  }
}

function stopPacServer() {
  if (pacServer) {
    try { pacServer.close(); } catch {}
    pacServer = null;
    console.log('[deep-focus] PAC server stopped.');
  }
}

module.exports = {
  startPacServer,
  stopPacServer,
  BLOCKED_DOMAINS
};
