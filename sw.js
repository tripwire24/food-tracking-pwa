const CACHE_NAME = 'food-tracker-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './src/css/main.css',
    './src/css/components.css',
    './src/css/responsive.css',
    './src/js/app.js',
    './src/js/utils.js',
    './src/js/storage.js',
    './src/js/camera.js',
    './src/js/ai-vision.js',
    './src/js/nutrition.js',
    './src/js/dashboard.js',
    './src/components/camera-modal.js',
    './src/components/food-entry.js',
    './src/components/chart-widgets.js',
    './offline.html'
];

// API endpoints to cache dynamically
const API_ENDPOINTS = [
    '/api/nutrition/',
    '/api/ai-vision/',
    '/api/food-data/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all clients
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    } else if (request.method === 'POST') {
        event.respondWith(handlePostRequest(request));
    }
});

// Handle GET requests with cache-first strategy
async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    // For static files, serve from cache first
    if (STATIC_FILES.includes(url.pathname)) {
        return cacheFirst(request);
    }
    
    // For API requests, use network first with cache fallback
    if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        return networkFirst(request);
    }
    
    // For images and other assets, use cache first
    if (request.destination === 'image') {
        return cacheFirst(request);
    }
    
    // Default: network first
    return networkFirst(request);
}

// Handle POST requests (for background sync)
async function handlePostRequest(request) {
    try {
        // Try to send the request
        const response = await fetch(request);
        return response;
    } catch (error) {
        // If offline, store the request for background sync
        if (!navigator.onLine) {
            await storeForBackgroundSync(request);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: 'Request queued for when online',
                    queued: true 
                }),
                {
                    status: 202,
                    statusText: 'Accepted',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        throw error;
    }
}

// Cache first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first failed:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('./offline.html');
        }
        
        throw error;
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network request failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('./offline.html');
        }
        
        throw error;
    }
}

// Store POST requests for background sync
async function storeForBackgroundSync(request) {
    try {
        const requestBody = await request.clone().text();
        const syncData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: requestBody,
            timestamp: Date.now()
        };
        
        // Store in IndexedDB for background sync
        const db = await openDatabase();
        const transaction = db.transaction(['sync-queue'], 'readwrite');
        const store = transaction.objectStore('sync-queue');
        await store.add(syncData);
        
        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            await self.registration.sync.register('food-data-sync');
        }
    } catch (error) {
        console.error('Error storing for background sync:', error);
    }
}

// Background sync event
self.addEventListener('sync', (event) => {
    if (event.tag === 'food-data-sync') {
        event.waitUntil(processBackgroundSync());
    }
});

// Process queued requests during background sync
async function processBackgroundSync() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['sync-queue'], 'readwrite');
        const store = transaction.objectStore('sync-queue');
        const requests = await store.getAll();
        
        for (const requestData of requests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                if (response.ok) {
                    // Remove from queue on success
                    await store.delete(requestData.id);
                    
                    // Notify the app about successful sync
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'SYNC_SUCCESS',
                                data: requestData
                            });
                        });
                    });
                }
            } catch (syncError) {
                console.error('Background sync failed for request:', syncError);
            }
        }
    } catch (error) {
        console.error('Error processing background sync:', error);
    }
}

// Helper function to open IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('food-tracker-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create sync queue store
            if (!db.objectStoreNames.contains('sync-queue')) {
                const store = db.createObjectStore('sync-queue', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/public/icons/icon-192x192.png',
        badge: '/public/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data,
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: '/public/icons/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/public/icons/action-dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Message handling from the app
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_FOOD_DATA':
            cacheFoodData(payload);
            break;
        case 'GET_CACHED_DATA':
            getCachedData(payload).then(data => {
                event.ports[0].postMessage(data);
            });
            break;
    }
});

// Cache food data for offline use
async function cacheFoodData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/api/food-data/cached', response);
    } catch (error) {
        console.error('Error caching food data:', error);
    }
}

// Get cached data
async function getCachedData(key) {
    try {
        const cachedResponse = await caches.match(`/api/food-data/${key}`);
        if (cachedResponse) {
            return await cachedResponse.json();
        }
        return null;
    } catch (error) {
        console.error('Error getting cached data:', error);
        return null;
    }
}

console.log('Service Worker: Script loaded');