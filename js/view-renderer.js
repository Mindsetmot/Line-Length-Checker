javascript:(function(){
  "use strict";

  // --- Bersihin sisa run sebelumnya biar ga numpuk pas di-run ulang ---
  if (window.__aniSolveGuide && window.__aniSolveGuide.destroy) {
    window.__aniSolveGuide.destroy();
  }

  const board = document.getElementById('anipuzzle-board') || document.querySelector('.anipuzzle-board');
  if (!board) {
    alert('Papan AniPuzzle belum ketemu. Klik "Mulai Main" dulu baru jalankan script ini.');
    return;
  }

  // --- Style + animasi, cuma di-inject sekali walau script dijalanin berkali-kali ---
  const STYLE_ID = 'ani-solve-guide-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes ani-target-pulse {
        0%, 100% { box-shadow: inset 0 0 0 3px rgba(245,158,11,.95), 0 0 14px rgba(245,158,11,.55); }
        50%      { box-shadow: inset 0 0 0 3px rgba(245,158,11,.45), 0 0 4px rgba(245,158,11,.25); }
      }
      .ani-solve-cell { position:relative; box-sizing:border-box; border-radius:5px; pointer-events:none; }
      .ani-solve-badge {
        position:absolute; top:3px; left:3px; min-width:18px; padding:1px 5px;
        background:rgba(15,23,42,.8); color:#f6f7fb;
        font:700 clamp(11px,2.8vw,16px)/1.35 ui-monospace,monospace;
        border-radius:5px; text-align:center; border:1px solid rgba(255,255,255,.25);
        transition:background-color .15s ease, color .15s ease;
      }
      .ani-solve-cell.is-source { box-shadow: inset 0 0 0 3px #22c55e, 0 0 10px rgba(34,197,94,.5); }
      .ani-solve-cell.is-source .ani-solve-badge { background:#16a34a; border-color:#bbf7d0; }
      .ani-solve-cell.is-target { animation: ani-target-pulse 1.1s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }

  // --- Lapisan overlay terpisah, nempel presisi DI ATAS papan asli ---
  // (dibikin terpisah dari tile asli supaya nggak ikut kehapus tiap kali
  //  papan re-render habis geser tile -> ini biang kerok kedip-kedip lama)
  const overlay = document.createElement('div');
  overlay.id = 'ani-solve-overlay';
  overlay.style.cssText = 'position:fixed; z-index:1000000; display:grid; gap:3px; pointer-events:none;';
  document.body.appendChild(overlay);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Matiin Guide';
  closeBtn.style.cssText = 'position:fixed; z-index:1000001; top:14px; right:14px; background:#1e293b; color:#f6f7fb; border:1px solid #f59e0b; border-radius:8px; padding:6px 10px; font:700 12px sans-serif; cursor:pointer;';
  document.body.appendChild(closeBtn);

  let cells = [];
  let currentN = 0;
  let cachedOrder = [];
  let raf = null;

  // Urutan penyelesaian: kupas baris-atas + kolom-kiri lapis demi lapis,
  // begitu sisa submatrix tinggal 2x2, isi 3 sel sisanya (1 sel terakhir
  // otomatis jadi slot kosong).
  function buildSolveOrder(n) {
    const order = [];
    let r0 = 0, c0 = 0;
    const pos = (r, c) => r * n + c;
    while ((n - r0) > 1 && (n - c0) > 1) {
      if ((n - r0) === 2 && (n - c0) === 2) {
        order.push(pos(r0, c0), pos(r0, c0 + 1), pos(r0 + 1, c0));
        break;
      }
      for (let c = c0; c < n; c++) order.push(pos(r0, c));
      for (let r = r0 + 1; r < n; r++) order.push(pos(r, c0));
      r0++; c0++;
    }
    return order;
  }

  function syncPosition() {
    const rect = board.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = rect.width ? 'grid' : 'none';
    closeBtn.style.display = rect.width ? 'block' : 'none';
  }

  function rebuildCells(n) {
    overlay.innerHTML = '';
    overlay.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    overlay.style.gridTemplateRows = `repeat(${n}, 1fr)`;
    cells = [];
    for (let i = 0; i < n * n; i++) {
      const cell = document.createElement('div');
      cell.className = 'ani-solve-cell';
      const badge = document.createElement('span');
      badge.className = 'ani-solve-badge';
      cell.appendChild(badge);
      overlay.appendChild(cell);
      cells.push({ cell, badge });
    }
    currentN = n;
    cachedOrder = buildSolveOrder(n);
  }

  function render() {
    raf = null;
    const tiles = Array.from(board.querySelectorAll('.anipuzzle-tile'))
      .sort((a, b) => (+a.getAttribute('data-index')) - (+b.getAttribute('data-index')));

    if (!tiles.length) { overlay.style.display = 'none'; return; }

    const n = Math.round(Math.sqrt(tiles.length));
    if (n !== currentN) rebuildCells(n);
    syncPosition();

    const step = n > 1 ? 100 / (n - 1) : 100;
    const values = new Array(n * n).fill(null);

    tiles.forEach(el => {
      const slot = parseInt(el.getAttribute('data-index'), 10);
      if (isNaN(slot) || slot < 0 || slot >= n * n) return;
      if (el.classList.contains('empty')) { values[slot] = null; return; }
      const posStr = el.style.backgroundPosition;
      if (!posStr) return;
      const parts = posStr.split(' ').map(s => parseFloat(s));
      const col = Math.round(parts[0] / step);
      const row = Math.round(parts[1] / step);
      values[slot] = (row * n) + col + 1;
    });

    // Slot pertama di urutan solve yang isinya belum bener -> ini yang harus dikerjain
    let targetSlot = -1;
    for (const p of cachedOrder) {
      if (values[p] !== (p + 1)) { targetSlot = p; break; }
    }
    // Cari tile yang punya nomor yang dibutuhin slot itu -> ini yang harus digeser
    let sourceSlot = -1;
    if (targetSlot !== -1) {
      const wantedId = targetSlot + 1;
      sourceSlot = values.findIndex(v => v === wantedId);
    }

    cells.forEach(({ cell, badge }, p) => {
      const v = values[p];
      badge.textContent = v ? v : '';
      badge.style.visibility = v ? 'visible' : 'hidden';
      cell.classList.toggle('is-target', p === targetSlot);
      cell.classList.toggle('is-source', p === sourceSlot);
    });
  }

  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(render);
  }

  // Event-driven, bukan polling -> nggak ada jeda yang bikin kedip
  const observer = new MutationObserver(scheduleRender);
  observer.observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  window.addEventListener('scroll', syncPosition, true);
  window.addEventListener('resize', syncPosition);
  const posInterval = setInterval(syncPosition, 500); // cuma buat jaga-jaga posisi geser, ringan banget

  function destroy() {
    observer.disconnect();
    clearInterval(posInterval);
    window.removeEventListener('scroll', syncPosition, true);
    window.removeEventListener('resize', syncPosition);
    overlay.remove();
    closeBtn.remove();
    window.__aniSolveGuide = null;
  }
  closeBtn.addEventListener('click', destroy);
  window.__aniSolveGuide = { destroy };

  render();
})();
