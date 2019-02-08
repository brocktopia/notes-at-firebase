const version = 'v1.3.4';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(version).then(function(cache) {
      //console.log(`Register version [${version}] of the app`);
      return cache.addAll([
        './',
        './index.html',
        // These use query params which means they'd get cached twice
        //'./dist/build.js',
        //'./dist/logo.png',
        './dist/notes-at-icon-192.png',
        './dist/notes-at-icon-512.png',
        './dist/symbols.svg',
        './favicon.ico',
        '/notes-at.webmanifest'
      ])
        .then(() => {
          self.skipWaiting();
        });
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    // caches.match() always resolves
    // but in case of success response will have value
    //console.log(`ServiceWorker.fetch() intercepted fetch for [${event.request.method}:${event.request.url}]`);
    if (response !== undefined) {
      // return cached response
      return response;
    } else {
      // fetch response from internet
      // Attempt at creating a cors request caused service calls to fail
      //const corsRequest = new Request(event.request.url, {mode: 'cors'});
      //return fetch(corsRequest).then(function (response) {
      return fetch(event.request).then(function (response) {
        // Check for bad responses
        if(!response || response.status !== 200 || response.type !== 'basic') {
          // x-domain content
          return response; // response stream consumed
        }
        //console.log(`ServiceWorker.fetch() do we cache [${response.url}]`);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve returned response

        // any request to /dist/ directory should be cached
        const inDist = /\/dist\//.test(response.url);
        if (inDist) {
          let responseClone = response.clone();
          caches.open(version).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        } else {
          //console.log(`ServiceWorker.fetch() Ignore response item [${response.url}]`);
        }
        return response;
      }).catch(function(err) {
        console.warn(`ServiceWorker.fetch() Error`);
        console.dir(err);
        return err;
      });
    }
  }));
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [version];
  //console.log(`ServiceWorker.activate() delete file caches older than [${version}]...`);
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});
