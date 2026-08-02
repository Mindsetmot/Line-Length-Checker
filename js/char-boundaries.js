(function () {
  "use strict";

  const CONFIG = {
    containerSelector: "#animemory-board, .animemory-board",
    cardSelector: ".animemory-card",
    indexAttr: "data-index",
    highlightColor: "#facc15",
    highlightWidth: 4
  };

  let overlayRoot = null, observer = null, targetContainer = null, hintBtn = null;
  const memory = new Map(); 
  const matchedIdx = new Set(); 
  let backSrc = null; 
  let hintActive = false;

  function detectBackSrc(cards) {
    const counts = new Map();
    cards.forEach((el) => {
      const img = el.querySelector("img");
      if (!img) return;
      const src = img.getAttribute("src");
      counts.set(src, (counts.get(src) || 0) + 1);
    });
    let best = null, max = 0;
    for (const [src, c] of counts) {
      if (c > max) { max = c; best = src; }
    }
    return best;
  }

  function scan() {
    const container = document.querySelector(CONFIG.containerSelector);
    if (!container) return null;
    const cards = Array.from(container.querySelectorAll(CONFIG.cardSelector));
    if (cards.length === 0) return null;

    if (!backSrc) backSrc = detectBackSrc(cards);

    const openNow = []; 

    cards.forEach((el) => {
      const idx = parseInt(el.getAttribute(CONFIG.indexAttr), 10);
      if (Number.isNaN(idx)) return;

      const img = el.querySelector("img");
      const src = img ? img.getAttribute("src") : null;
      const alt = img ? img.getAttribute("alt") : null;

      const isDisabledLike =
        el.disabled ||
        el.getAttribute("aria-disabled") === "true" ||
        /matched|solved|done|found/i.test(el.className);
      
      if (isDisabledLike) matchedIdx.add(idx);

      const isShowingFront = src && src !== backSrc;
      if (isShowingFront) {
        if (!memory.has(idx)) {
          memory.set(idx, alt || src);
        }
        if (!isDisabledLike) openNow.push(idx);
      }
    });

    return { cards, openNow, container };
  }

  function findKnownPairs() {
    const byId = new Map();
    for (const [idx, id] of memory) {
      if (matchedIdx.has(idx)) continue;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(idx);
    }
    const pairs = [];
    for (const [id, idxs] of byId) {
      if (idxs.length >= 2) pairs.push({ id, indices: idxs });
    }
    return pairs;
  }

  function ensureOverlay() {
    if (overlayRoot && document.body.contains(overlayRoot)) return overlayRoot;
    const root = document.createElement("div");
    root.style.cssText = "position:fixed; top:0; left:0; width:0; height:0; z-index:999999; pointer-events:none;";
    document.body.appendChild(root);
    overlayRoot = root;
    return root;
  }
  
  function clearOverlay() { if (overlayRoot) overlayRoot.innerHTML = ""; }

  function boxFor(rect) {
    const pad = 4;
    const box = document.createElement("div");
    box.style.cssText = `
      position:fixed; left:${rect.left - pad}px; top:${rect.top - pad}px;
      width:${rect.width + pad * 2}px; height:${rect.height + pad * 2}px;
      border:${CONFIG.highlightWidth}px solid ${CONFIG.highlightColor};
      border-radius:10px; box-shadow:0 0 12px ${CONFIG.highlightColor};
      pointer-events:none; transition: all 0.2s;
    `;
    return box;
  }

  function drawHighlight(cards, indices) {
    const root = ensureOverlay();
    clearOverlay();
    if (!indices || indices.length === 0) return;
    indices.forEach((idx) => {
      const el = cards.find((c) => parseInt(c.getAttribute(CONFIG.indexAttr), 10) === idx);
      if (el) root.appendChild(boxFor(el.getBoundingClientRect()));
    });
  }

  function updateHintBtn() {
    if (!hintBtn) return;
    if (hintActive) {
        hintBtn.style.background = "rgba(250, 204, 21, 0.2)";
        hintBtn.style.boxShadow = "0 0 10px #facc15";
        hintBtn.innerText = "💡 Hint (Aktif)";
    } else {
        hintBtn.style.background = "#0f172a";
        hintBtn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
        hintBtn.innerText = "💡 Hint";
    }
  }

  function toggleHint() {
    const meta = scan();
    if (!meta) return;

    if (hintActive) {
        hintActive = false;
        clearOverlay();
        updateHintBtn();
        return;
    }

    hintActive = true;
    updateHintBtn();

    if (meta.openNow.length === 1) {
        const openIdx = meta.openNow[0];
        const id = memory.get(openIdx);
        const twin = [...memory.entries()].find(([idx, val]) => idx !== openIdx && val === id && !matchedIdx.has(idx));

        if (twin) {
            drawHighlight(meta.cards, [twin[0]]);
            hintActive = false;
            updateHintBtn();
        }
    } else if (meta.openNow.length === 0) {
        const pairs = findKnownPairs();

        if (pairs.length > 0) {
            drawHighlight(meta.cards, pairs[0].indices);
            hintActive = false;
            updateHintBtn();
        }
    }
  }

  function start() {
    targetContainer = document.querySelector(CONFIG.containerSelector) || document.body;
    
    observer = new MutationObserver(() => {
        const meta = scan();
        if (!meta) return;
        
        if (meta.openNow.length !== 1 && !hintActive) {
            clearOverlay();
        }

        if (hintActive && meta.openNow.length === 1) {
            const openIdx = meta.openNow[0];
            const id = memory.get(openIdx);

            const twin = [...memory.entries()].find(([idx, val]) => idx !== openIdx && val === id && !matchedIdx.has(idx));
            
            if (twin) {
                drawHighlight(meta.cards, [twin[0]]);
                hintActive = false;
                updateHintBtn();
            }
        }
    });
    
    observer.observe(targetContainer, { attributes: true, childList: true, subtree: true, attributeFilter: ["src", "class", "disabled", "aria-disabled"] });

    const toast = document.getElementById("animemory-toast");
    if (toast) {
      const toastObserver = new MutationObserver(() => {
        if (toast.classList.contains("show")) {
          setTimeout(reset, 900); 
        }
      });
      toastObserver.observe(toast, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function reset() {
    memory.clear();
    matchedIdx.clear();
    backSrc = null;
    hintActive = false;
    clearOverlay();
    updateHintBtn();
  }

  if (!document.getElementById("ani-hint-btn-memory")) {
    hintBtn = document.createElement("button");
    hintBtn.id = "ani-hint-btn-memory";
    hintBtn.innerHTML = "💡 Hint";
    hintBtn.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 100000;
      background: #0f172a; color: #facc15; border: 2px solid #facc15;
      padding: 10px 18px; border-radius: 25px; font-weight: bold;
      font-size: 15px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      transition: all 0.2s; display: flex; align-items: center; gap: 6px; font-family: sans-serif;
    `;
    hintBtn.onclick = toggleHint;
    document.body.appendChild(hintBtn);
  }

  start();
})();
