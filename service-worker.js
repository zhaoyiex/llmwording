// 缓存名称
const CACHE_NAME = 'word-memory-app-v1';

// 需要缓存的资源
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json'
];

// 安装事件：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

//  fetch 事件：优先从缓存获取资源，否则网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有响应，则返回缓存的响应
        if (response) {
          return response;
        }
        
        // 否则，发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            
            // 将新的响应添加到缓存中
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-word-data') {
    event.waitUntil(syncWordData());
  }
});

// 同步单词数据的函数
async function syncWordData() {
  try {
    // 这里可以实现与服务器同步单词数据的逻辑
    console.log('单词数据同步完成');
  } catch (error) {
    console.error('单词数据同步失败:', error);
  }
}