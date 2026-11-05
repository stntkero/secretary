// 業務秘書 離線快取
// 程式本體（開啟網頁）：有網路就先拿網站上的最新版（最多等 5 秒），拿不到才用快取，所以更新後第一次開啟就是新版，離線也能開。
// 其他檔案（圖示、manifest）：先用快取，背景更新。
const CACHE='ss-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isPage=u=>u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // Google API 等一律直接連線
  if(e.request.cache==='no-store'||u.pathname.endsWith('.md'))return; // 今日話題等每天會變的檔案不走快取
  if(e.request.mode==='navigate'||isPage(u)){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      try{
        const r=await Promise.race([fetch(e.request),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),5000))]);
        if(r&&r.ok){c.put(e.request,r.clone());c.put('./index.html',r.clone())}
        return r;
      }catch(err){
        return (await c.match(e.request))||(await c.match('./index.html'))||(await c.match('./'))||Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>cached);
    return cached||net;
  }));
});
