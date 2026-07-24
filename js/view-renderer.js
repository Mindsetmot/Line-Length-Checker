javascript:(function(){
  "use strict";

  if (window.aniMinimapInterval) clearInterval(window.aniMinimapInterval);
  const existing = document.getElementById('ani-minimap-ui');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'ani-minimap-ui';
  container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:1000000; background:rgba(15,23,42,0.9); border:2px solid #38bdf8; border-radius:10px; padding:10px; box-shadow:0 8px 30px rgba(0,0,0,0.6); font-family:sans-serif; color:white; width:220px; min-height: 250px; box-sizing:border-box; display:flex; flex-direction:column; resize:both; overflow:auto;';

  const header = document.createElement('div');
  header.textContent = 'Minimap (Geser & Tarik)';
  header.style.cssText = 'text-align:center; font-weight:bold; font-size:12px; margin-bottom:8px; cursor:move; padding:6px; background:rgba(56,189,248,0.2); border-radius:5px; user-select:none; touch-action:none; border: 1px dashed #38bdf8; flex-shrink:0;';
  container.appendChild(header);

  const gridDiv = document.createElement('div');
  gridDiv.style.cssText = 'display:grid; flex-grow:1; gap:4px;';
  container.appendChild(gridDiv);
  
  document.body.appendChild(container);

  let isDragging = false, startX, startY, startLeft, startTop;
  
  header.addEventListener('mousedown', startDrag);
  header.addEventListener('touchstart', startDrag, {passive: false});

  function startDrag(e) {
    isDragging = true;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    startX = clientX; 
    startY = clientY;
    startLeft = container.offsetLeft; 
    startTop = container.offsetTop;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive: false});
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }

  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault(); 
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    container.style.left = (startLeft + clientX - startX) + 'px';
    container.style.top = (startTop + clientY - startY) + 'px';
    container.style.right = 'auto'; 
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  }

  let currentN = 0;
  let gridCells = [];

  function updateMinimap() {
    const tiles = document.querySelectorAll('.anipuzzle-tile');
    if (tiles.length === 0) return;

    const N = Math.round(Math.sqrt(tiles.length));
    const step = N > 1 ? 100 / (N - 1) : 100;

    if (N !== currentN) {
      currentN = N;
      gridDiv.innerHTML = '';
      gridDiv.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
      gridCells = [];
      
      for (let i = 0; i < N * N; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,255,255,0.15); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size: clamp(12px, 4vw, 24px); font-weight:bold; color:#fff; transition: background 0.2s; min-height: 25px;';
        gridDiv.appendChild(cell);
        gridCells.push(cell);
      }
    }

    tiles.forEach(el => {
      const slot = parseInt(el.getAttribute("data-index"), 10);
      if (isNaN(slot) || slot < 0 || slot >= N * N) return;

      if (el.classList.contains('empty')) {
        gridCells[slot].textContent = '';
        gridCells[slot].style.background = 'rgba(0,0,0,0.5)';
        gridCells[slot].style.border = '1px dashed #555';
        return;
      }

      const posStr = el.style.backgroundPosition;
      if (!posStr) return;

      const parts = posStr.split(" ").map(s => parseFloat(s));
      const col = Math.round(parts[0] / step);
      const row = Math.round(parts[1] / step);
      
      // Diubah kembali ke urutan horizontal (row * N + col + 1)
      const id = (row * N) + col + 1; 

      gridCells[slot].textContent = id;
      gridCells[slot].style.background = 'rgba(255,255,255,0.15)';
      gridCells[slot].style.border = 'none';
      
      const slotRow = Math.floor(slot / N);
      const slotCol = slot % N;
      const targetIdForThisSlot = (slotRow * N) + slotCol + 1;
      
      if (id === targetIdForThisSlot) {
          gridCells[slot].style.color = '#38bdf8';
          gridCells[slot].style.textShadow = '0 0 5px rgba(56,189,248,0.5)';
          gridCells[slot].style.background = 'rgba(56,189,248,0.15)';
      } else {
          gridCells[slot].style.color = '#ffffff';
          gridCells[slot].style.textShadow = 'none';
      }
    });
  }

  window.aniMinimapInterval = setInterval(updateMinimap, 150);
  updateMinimap();

})();