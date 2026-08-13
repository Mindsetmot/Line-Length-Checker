(function(){
if(window.__mtActive){alert('Mode Translate udah aktif, Maou-sama! ESC dulu buat keluar.');return;}
window.__mtActive=true;
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
Promise.all([
loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js')
]).then(init).catch(function(e){alert('Gagal manggil kekuatan kegelapan (library gagal load): '+e);window.__mtActive=false;});
function init(){
document.body.style.cursor='crosshair';
var prevTouchAction=document.body.style.touchAction;
document.body.style.touchAction='none';
var banner=document.createElement('div');
banner.textContent='📖 Mode Translate Aktif — drag/seret jari di atas teks manga (tap banner ini buat keluar)';
banner.style.cssText='position:fixed;top:0;left:0;right:0;background:#1a0b2e;color:#fff;padding:10px;text-align:center;z-index:999999;font-family:sans-serif;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.5)';
document.body.appendChild(banner);
banner.addEventListener('click',cleanup);
var box,startX,startY;
function onDown(e){
if(e.target===banner)return;
startX=e.clientX;startY=e.clientY;
box=document.createElement('div');
box.style.cssText='position:fixed;border:2px dashed #a855f7;background:rgba(168,85,247,.15);z-index:999998;pointer-events:none';
document.body.appendChild(box);
document.addEventListener('pointermove',onMove);
document.addEventListener('pointerup',onUp);
}
function onMove(e){
if(!box)return;
var x=Math.min(e.clientX,startX),y=Math.min(e.clientY,startY);
var w=Math.abs(e.clientX-startX),h=Math.abs(e.clientY-startY);
box.style.left=x+'px';box.style.top=y+'px';box.style.width=w+'px';box.style.height=h+'px';
}
function onUp(e){
document.removeEventListener('pointermove',onMove);
document.removeEventListener('pointerup',onUp);
if(!box)return;
var rect=box.getBoundingClientRect();
box.remove();
box=null;
if(rect.width<10||rect.height<10)return;
processRegion(rect);
}
document.addEventListener('pointerdown',onDown);
function escHandler(e){
if(e.key==='Escape')cleanup();
}
function cleanup(){
document.removeEventListener('pointerdown',onDown);
document.removeEventListener('pointermove',onMove);
document.removeEventListener('pointerup',onUp);
document.removeEventListener('keydown',escHandler);
document.body.style.cursor='';
document.body.style.touchAction=prevTouchAction;
banner.remove();
window.__mtActive=false;
}
document.addEventListener('keydown',escHandler);
function processRegion(rect){
var loading=document.createElement('div');
loading.textContent='⏳ Membaca teks (sabar, jurus baca butuh mana)...';
loading.style.cssText='position:fixed;left:'+rect.left+'px;top:'+Math.max(0,rect.top-30)+'px;background:#000;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;z-index:999999;font-family:sans-serif';
document.body.appendChild(loading);
html2canvas(document.body,{x:rect.left+window.scrollX,y:rect.top+window.scrollY,width:rect.width,height:rect.height,useCORS:true,backgroundColor:null}).then(function(canvas){
return Tesseract.recognize(canvas,'eng+jpn',{logger:function(){}});
}).then(function(result){
var text=result.data.text.trim();
if(!text){
loading.textContent='❌ Ga ada teks kebaca, coba kotak lain';
setTimeout(function(){loading.remove();},2000);
return;
}
return fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair=auto|id').then(function(r){return r.json();}).then(function(data){
loading.remove();
var translated=data.responseData&&data.responseData.translatedText?data.responseData.translatedText:'(gagal translate)';
showPopup(rect,translated);
});
}).catch(function(e){
loading.textContent='❌ Error: '+e.message;
setTimeout(function(){loading.remove();},3000);
});
}
function showPopup(rect,translated){
var pop=document.createElement('div');
pop.style.cssText='position:fixed;left:'+rect.left+'px;top:'+rect.top+'px;width:'+Math.max(rect.width,180)+'px;background:#fff;color:#111;border:2px solid #a855f7;border-radius:8px;padding:8px 10px;font-size:13px;font-family:sans-serif;z-index:999999;box-shadow:0 4px 16px rgba(0,0,0,.4)';
var safe=String(translated).replace(/</g,'&lt;');
pop.innerHTML='<div style="font-weight:bold;color:#7c3aed;margin-bottom:4px">🌐 Terjemahan:</div><div>'+safe+'</div><div style="margin-top:6px;font-size:10px;color:#888;cursor:pointer">✕ Tutup</div>';
pop.querySelector('div:last-child').addEventListener('click',function(){pop.remove();});
document.body.appendChild(pop);
}
}
})();
