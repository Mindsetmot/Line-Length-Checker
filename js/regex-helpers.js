(function () {
  "use strict";

  const CONFIG = {
    containerSelector: "#funlink-board",
    tileSelector: "button.funlink-tile",
    highlightColor: "#facc15",
    highlightWidth: 4,
  };

  let overlayRoot = null;
  let hintButton = null;

  function scanBoard() {
    const container = document.querySelector(CONFIG.containerSelector);
    if (!container) return null;

    const tiles = Array.from(container.querySelectorAll(CONFIG.tileSelector));
    
    let maxR = 0, maxC = 0;
    tiles.forEach(t => {
      maxR = Math.max(maxR, parseInt(t.dataset.row));
      maxC = Math.max(maxC, parseInt(t.dataset.col));
    });

    const rows = maxR + 3;
    const cols = maxC + 3;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

    tiles.forEach(btn => {
      if (btn.classList.contains("matched")) return;

      const r = parseInt(btn.dataset.row) + 1;
      const c = parseInt(btn.dataset.col) + 1;
      const img = btn.querySelector("img");
      const id = img ? img.src : null;

      if (id) {
        grid[r][c] = { el: btn, id, r, c, rect: btn.getBoundingClientRect() };
      }
    });

    return { grid, rows, cols };
  }

  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  function canConnect(grid, a, b) {
    const queue = [];
    for (let d = 0; d < 4; d++) queue.push({ r: a.r, c: a.c, dir: d, turns: 0 });
    const visited = new Map();
    let qi = 0;
    while (qi < queue.length) {
      const cur = queue[qi++];
      const [dr, dc] = DIRS[cur.dir];
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) continue;
      
      const cell = grid[nr][nc];
      if (cell !== null) {
        if (nr === b.r && nc === b.c) return true;
        continue;
      }

      for (let nd = 0; nd < 4; nd++) {
        const newTurns = cur.turns + (nd === cur.dir ? 0 : 1);
        if (newTurns > 2) continue;
        const key = `${nr},${nc},${nd}`;
        if (!visited.has(key) || visited.get(key) > newTurns) {
          visited.set(key, newTurns);
          queue.push({ r: nr, c: nc, dir: nd, turns: newTurns });
        }
      }
    }
    return false;
  }

  function findAllHints(grid) {
    const byId = new Map();
    grid.forEach(row => row.forEach(cell => {
      if (cell) {
        if (!byId.has(cell.id)) byId.set(cell.id, []);
        byId.get(cell.id).push(cell);
      }
    }));
    const hints = [];
    for (const cells of byId.values()) {
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (canConnect(grid, cells[i], cells[j])) hints.push({ a: cells[i], b: cells[j] });
        }
      }
    }
    return hints;
  }

  function ensureOverlay() {
    if (!overlayRoot) {
      overlayRoot = document.createElement("div");
      overlayRoot.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999;";
      document.body.appendChild(overlayRoot);
    }
    overlayRoot.innerHTML = "";
    return overlayRoot;
  }

  function drawBox(rect) {
    const box = document.createElement("div");
    box.style.cssText = `
      position:fixed; left:${rect.left - 2}px; top:${rect.top - 2}px;
      width:${rect.width + 4}px; height:${rect.height + 4}px;
      border:${CONFIG.highlightWidth}px solid ${CONFIG.highlightColor};
      border-radius:6px; box-shadow:0 0 12px ${CONFIG.highlightColor};
      pointer-events:none; transition: all 0.2s;
    `;
    overlayRoot.appendChild(box);
  }

  function showHint() {
    const board = scanBoard();
    if (!board) return;
    
    const hints = findAllHints(board.grid);
    if (hints.length > 0) {
      const hint = hints[0]; 
      ensureOverlay(); 
      drawBox(hint.a.rect);
      drawBox(hint.b.rect);

      if (hintButton) {
          hintButton.style.transform = "scale(0.9)";
          setTimeout(() => hintButton.style.transform = "scale(1)", 150);
      }
    } else {
      ensureOverlay(); 
      alert("Tidak ada pasangan yang bisa dihubungkan! Mungkin kamu perlu merombak (shuffle) papan.");
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest(CONFIG.containerSelector) && overlayRoot) {
        overlayRoot.innerHTML = "";
    }
  });

  if (!document.getElementById("ani-hint-btn")) {
    hintButton = document.createElement("button");
    hintButton.id = "ani-hint-btn";
    hintButton.innerHTML = "💡 Hint";
    hintButton.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #0f172a; color: #facc15; border: 2px solid #facc15;
      padding: 10px 18px; border-radius: 25px; font-weight: bold;
      font-size: 15px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      transition: transform 0.1s, background 0.2s; display: flex; align-items: center; gap: 6px; font-family: sans-serif;
    `;
    
    hintButton.onmouseover = () => hintButton.style.background = "rgba(250, 204, 21, 0.2)";
    hintButton.onmouseout = () => hintButton.style.background = "#0f172a";
    
    hintButton.onclick = showHint;
    document.body.appendChild(hintButton);
  }
})();
