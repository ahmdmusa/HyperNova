// Shelf tab: files dropped on the island. Click opens, right-click reveals, drag out to use.
(() => {
  const view = $('#v-shelf');
  const itemsEl = $('#shelf-items');
  const count = $('#shelf-count');
  const badge = $('#shelf-badge');
  const clearBtn = $('#shelf-clear');
  const dropTitle = $('#shelf-drop-title');
  const dropSub = $('#shelf-drop-sub');

  const isAr = () => (window.state?.features?.appLang || 'ar') === 'ar';

  function updateShelfLang() {
    const ar = isAr();
    if (dropTitle) dropTitle.textContent = ar ? 'إفلات الملفات هنا' : 'Drop files here';
    if (dropSub) dropSub.textContent = ar
      ? 'اسحب الملفات إلى الجزيرة للاحتفاظ بها في متناول يدك، ثم اسحبها إلى أي مكان.'
      : 'Drag files onto the island to keep them handy, then drag them out anywhere.';
    if (clearBtn) clearBtn.textContent = ar ? 'مسح الكل' : 'Clear';
  }

  function renderItems(items) {
    items = Array.isArray(items) ? items : [];
    const ar = isAr();
    updateShelfLang();
    view.classList.toggle('empty-shelf', !items.length);
    badge.classList.toggle('on', items.length > 0);
    count.textContent = ar
      ? `${items.length} ${items.length === 1 ? 'ملف' : 'ملفات'}`
      : `${items.length} ${items.length === 1 ? 'file' : 'files'}`;
    itemsEl.innerHTML = '';
    for (const f of items) {
      const d = document.createElement('div');
      d.className = `file ${f.isImage ? 'is-img' : ''}`;
      d.draggable = true;
      d.title = ar
        ? `${f.path}\nانقر للفتح · انقر بالزر الأيمن لإظهار المجلد · اسحب للاستخدام`
        : `${f.path}\nClick to open · Right-click to show in folder · Drag to use`;
      d.innerHTML =
        `${f.icon ? `<img src="${f.icon}" alt="">` : ''}` +
        `<span class="fname" dir="auto">${esc(f.name)}</span>` +
        `<button class="x" aria-label="Remove ${esc(f.name)}">${ICON_X}</button>`;
      d.addEventListener('click', (e) => {
        if (e.target.closest('.x')) bridge.shelf.remove(f.path);
        else bridge.shelf.open(f.path);
      });
      d.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        bridge.shelf.reveal(f.path);
      });
      d.addEventListener('dragstart', (e) => {
        e.preventDefault();
        internalDrag = true;
        bridge.shelf.startDrag(f.path);
      });
      itemsEl.append(d);
    }
  }

  itemsEl.addEventListener('wheel', (e) => {
    // vertical wheel scrolls the row horizontally
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) itemsEl.scrollLeft += e.deltaY;
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => bridge.shelf.clear());
  }

  window.addEventListener('island:features', (e) => {
    if (e.detail?.appLang) {
      updateShelfLang();
      if (bridge.shelf?.list) bridge.shelf.list().then(renderItems);
    }
  });

  updateShelfLang();
  bridge.onShelf(renderItems);
  if (bridge.shelf?.list) bridge.shelf.list().then(renderItems);
})();
