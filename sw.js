// 業務秘書 離線快取：程式本體先用快取開啟，背景再更新，下次開啟就是新版
const CACHE='ss-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // Google API 等一律直接連線
  if(e.request.cache==='no-store'||u.pathname.endsWith('.md'))return; // 今日話題等每天會變的檔案不走快取
  e.respondWith(caches.match(e.request).then(cached=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>cached);
    return cached||net;
  }));
});
