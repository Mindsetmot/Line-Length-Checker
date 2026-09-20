javascript:(function() {
    const canvas = document.getElementById('anipeek-poster');
    if (!canvas) return alert('Buka minigame AniPeek dulu ya!');

    let container = document.getElementById('ani-peek-xray-container');
    if (container) container.remove(); 

    let isXrayOn = false;

    function applyXray() {
        let oldStyle = document.getElementById('anipeek-xray-style');
        if (oldStyle) oldStyle.remove();

        if (isXrayOn) {
            let style = document.createElement('style');
            style.id = 'anipeek-xray-style';
            style.innerHTML = `
                #anipeek-poster {
                    transform: scale(1) !important;
                    filter: none !important;
                    object-position: center !important;
                    transition: none !important;
                }
                .anipeek-poster-wrap:after { display: none !important; }
            `;
            document.head.appendChild(style);
        }
    }

    container = document.createElement('div');
    container.id = 'ani-peek-xray-container';
    container.style.cssText = 'position:fixed; top:80px; right:20px; z-index:999999; font-family:sans-serif; user-select:none;';

    let btn = document.createElement('button');
    btn.style.cssText = 'background:#ef4444; color:white; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer; border:2px solid #fff; box-shadow:0 4px 6px rgba(0,0,0,0.3); transition: background 0.2s;';
    
    function toggleBtn() {
        isXrayOn = !isXrayOn;
        applyXray();
        if (isXrayOn) {
            btn.innerHTML = '👁️ X-Ray: ON';
            btn.style.background = '#22c55e';
        } else {
            btn.innerHTML = '👁️ X-Ray: OFF';
            btn.style.background = '#ef4444';
        }
    }

    btn.onclick = toggleBtn;
    container.appendChild(btn);
    document.body.appendChild(container);

    toggleBtn();
})();
