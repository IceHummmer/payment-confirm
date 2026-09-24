const CACHE='payment-confirm-v10';
const ASSETS=['./','./index.html','./member.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
 self.skipWaiting();
});

self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
 self.clients.claim();
});

self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(res=>{
   const copy=res.clone();
   caches.open(CACHE).then(c=>c.put(e.request,copy));
   return res;
  }).catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html'))));
  return;
 }
 e.respondWith(fetch(e.request).then(res=>{
  const copy=res.clone();
  caches.open(CACHE).then(c=>c.put(e.request,copy));
  return res;
 }).catch(()=>caches.match(e.request)));
});

self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():'Нове нагадування'}}
 const title=data.title||'Контроль оплат';
 const options={
   body:data.body||'Перевірте поточну оплату.',
   icon:'./icon.svg',
   badge:'./icon.svg',
   tag:data.tag||'payment-confirm',
   data:{url:data.url||'./member.html'}
 };
 event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=event.notification.data&&event.notification.data.url?event.notification.data.url:'./member.html';
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
   for(const client of list){
     if('focus'in client&&client.url.includes('/member.html')){
       client.navigate(target);
       return client.focus();
     }
   }
   return clients.openWindow?clients.openWindow(target):undefined;
 }));
});
