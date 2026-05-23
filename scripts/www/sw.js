/* ═══════════════════════════════════════════
   江城APP v3 — Service Worker
   本地缓存：头像 · 照片 · 语音 · 页面资源
   ═══════════════════════════════════════════ */
var CACHE = 'jc_v4'; // bump version to invalidate old cache

/* 安装：预缓存头像（逐条缓存，单条失败不影响整体） */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // 逐个缓存，失败不阻断整体流程
      var avatarList = [
        '/avatars/yuyan.png','/avatars/zhirou.png','/avatars/xiaobei.png',
        '/avatars/qingyi.png','/avatars/wanqing.png','/avatars/kexin.png',
        '/avatars/rentong.png','/avatars/baobao.jpg',
      ];
      return Promise.allSettled(avatarList.map(function(url){
        return fetch(url).then(function(r){
          if(r.ok) return c.put(url, r);
        }).catch(function(){ /* ignore single failure */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});

/* 抓取策略 */
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  var p = u.pathname;

  // 缓存三类资源：头像 / 照片 / 语音
  if(p.startsWith('/avatars/') || p.startsWith('/photos/') || p.startsWith('/voice/')){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        if(cached) return cached;
        return fetch(e.request).then(function(res){
          if(res && res.ok){
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // 其他请求：网络优先，离线兜底
  e.respondWith(
    fetch(e.request).catch(function(){ return caches.match(e.request); })
  );
});
