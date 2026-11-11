// Network companion: a toast when Wi-Fi connects, the internet drops, or it comes back (with how
// long it was gone), and the current connection in the System tab.
(() => {
  let downAt = 0;

  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';
  const label = (n) => {
    const ar = isAr();
    if (n.link === 'wifi') {
      return n.ssid || (ar ? 'واي فاي' : 'Wi-Fi');
    }
    if (n.link === 'ethernet') return ar ? 'إيثرنت' : 'Ethernet';
    return ar ? 'غير متصل' : 'Offline';
  };
  const ago = (ms) => {
    const ar = isAr();
    const m = Math.round(ms / 60000);
    if (ar) {
      return m < 1 ? 'بعد بضع ثوانٍ' : m < 60 ? `بعد ${m} دقيقة` : `بعد ${Math.floor(m / 60)} س و ${m % 60} د`;
    }
    return m < 1 ? 'after a few seconds' : m < 60 ? `after ${m} min` : `after ${Math.floor(m / 60)} h ${m % 60} min`;
  };

  function row(n) {
    const off = n.link === 'none' || n.internet === false;
    $('#net-row')?.classList.toggle('off', off);
    const val = $('#net-val');
    if (!val) return;
    const ar = isAr();
    val.textContent = n.link !== 'none' && n.internet === false
      ? `${label(n)} · ${ar ? 'لا يوجد إنترنت' : 'no internet'}`
      : label(n);
    if (n.link === 'wifi') {
      val.title = `Wi-Fi: ${n.ssid || 'Connected'}${n.signal ? ` (${n.signal}%)` : ''}${n.desc ? `\nAdapter: ${n.desc}` : ''}`;
    } else if (n.link === 'ethernet') {
      val.title = ar ? 'اتصال سلكي (إيثرنت)' : 'Ethernet connection';
    } else {
      val.title = ar ? 'غير متصل بالإنترنت' : 'Offline';
    }
    if (off) {
      const netBar = $('#net-bar');
      if (netBar) netBar.style.width = '0%';
      const rxEl = $('#net-rx');
      const txEl = $('#net-tx');
      if (rxEl) rxEl.textContent = '↓ 0 Kbps';
      if (txEl) txEl.textContent = '↑ 0 Kbps';
    }
  }

  let lastNet = null;
  function update(n) {
    lastNet = n;
    row(n);
    const p = n.prev;
    // the first reading after start is not news
    if (!p || p.internet === null || !feat('netToasts')) return;
    const ar = isAr();
    if (p.internet && n.internet === false) {
      downAt = Date.now();
      island.classList.add('net-down');
      setTimeout(() => island.classList.remove('net-down'), 4600);
      showToast('net-off', n.link === 'none' ? (ar ? 'لا يوجد اتصال' : 'No connection') : (ar ? 'انقطع الإنترنت' : 'Internet lost'), '', 0, 4500);
      note('📡', ar ? 'انقطع الإنترنت' : 'Internet lost');
    } else if (p.internet === false && n.internet) {
      const gone = downAt ? Date.now() - downAt : 0;
      showToast('net-on', ar ? 'عادت الشبكة للعمل' : 'Back online', gone ? ago(gone) : label(n), 0, 3500);
      note('📶', `${ar ? 'عادت الشبكة' : 'Back online'} ${gone ? ago(gone) : ''}`.trim());
      downAt = 0;
    } else if (n.link === 'wifi' && n.ssid && p.ssid && n.ssid !== p.ssid) {
      showToast('net-on', ar ? `متصل بـ ${n.ssid}` : `Connected to ${n.ssid}`, n.signal ? `${n.signal}%` : '', 0, 3000);
    } else if (n.link === 'wifi' && p.link !== 'wifi' && n.internet) {
      showToast('net-on', n.ssid ? (ar ? `متصل بـ ${n.ssid}` : `Connected to ${n.ssid}`) : (ar ? 'تم الاتصال بالواي فاي' : 'Connected to Wi-Fi'), '', 0, 3000);
    }
  }

  bridge.onNetwork(update);
  bridge.network().then((n) => {
    if (n) {
      lastNet = n;
      row(n);
    }
  });

  window.addEventListener('island:features', (e) => {
    if (e.detail?.appLang && lastNet) row(lastNet);
  });
})();
