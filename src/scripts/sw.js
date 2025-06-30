import CacheHelper from "./utils/cache-helper.js";
import StoryDatabase from "./data/database.js";
import { sendStory } from "./data/api.js";

const CACHE_NAME = 'story-app-v1';

// PERBAIKAN: Sesuaikan path dengan struktur direktori yang sebenarnya
// Gunakan path absolut dari root atau path relatif yang tepat
const ASSETS_TO_CACHE = [
	// Main files
	'/',
	'/index.html',
	'src/index.html', // Sesuaikan dengan letak file HTML
	
	// Static assets - PERBAIKAN: Path yang benar berdasarkan struktur
	'src/styles/styles.css',
	'src/scripts/index.js',
	'src/scripts/config.js',
	
	// Web manifest dan favicon
	'src/public/app.webmanifest',
	'src/public/favicon.ico',
	'src/public/favicon.png',
	
	// External resources yang pasti ada
	'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
	'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
	
	// Images dengan path yang benar
	'src/public/images/logo.png',
	'src/public/images/cinema.png',
	'src/public/images/HeartRate.png',
	'src/public/images/popcorn.png',
	
	// Icons dengan path yang benar
	'src/public/icon/icons/icon-72x72.png',
	'src/public/icon/icons/icon-96x96.png',
	'src/public/icon/icons/icon-128x128.png',
	'src/public/icon/icons/icon-144x144.png',
	'src/public/icon/icons/icon-152x152.png',
	'src/public/icon/icons/icon-192x192.png',
	'src/public/icon/icons/icon-384x384.png',
	'src/public/icon/icons/icon-512x512.png',
	
	// Other icons
	'src/public/icon/map.svg',
	'src/public/icon/star.svg',
	'src/public/icon/icons/arrow.svg',
];

// Install event dengan error handling yang lebih baik
self.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(async (cache) => {
				console.log('[Service Worker] Caching app shell');
				
				// Cache files satu per satu dengan better error handling
				const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
					try {
						if (url.startsWith('http')) {
							// External resources
							const response = await fetch(url);
							if (response.ok) {
								await cache.put(url, response);
								console.log(`[SW] Successfully cached external: ${url}`);
							} else {
								console.warn(`[SW] External resource failed (${response.status}): ${url}`);
							}
						} else {
							// Local files - test if they exist first
							const response = await fetch(url);
							if (response.ok) {
								await cache.put(url, response);
								console.log(`[SW] Successfully cached: ${url}`);
							} else {
								console.warn(`[SW] File not found (${response.status}): ${url}`);
								// Don't fail the entire process for missing files
							}
						}
					} catch (error) {
						console.warn(`[SW] Failed to cache: ${url}`, error.message);
						// Continue with other files even if one fails
					}
				});
				
				// Wait for all cache attempts but don't fail if some files are missing
				await Promise.allSettled(cachePromises);
				console.log('[SW] Installation completed');
			})
			.catch((error) => {
				console.error('[Service Worker] Cache setup failed:', error);
			})
	);
	self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activated');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('[Service Worker] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

// Fetch event dengan improved offline strategy
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}
	
	// Skip non-http requests (chrome-extension, etc.)
	if (!event.request.url.startsWith('http')) {
		return;
	}
	
	// Handle different types of requests
	if (event.request.url.includes('/api/')) {
		// API requests - network first, cache fallback
		event.respondWith(handleApiRequest(event.request));
	} else {
		// Static assets - cache first, network fallback
		event.respondWith(handleStaticRequest(event.request));
	}
});

// Handle API requests (network first)
async function handleApiRequest(request) {
	try {
		console.log('[SW] API Request - trying network first');
		const networkResponse = await fetch(request);
		
		if (networkResponse.ok) {
			// Cache successful API responses
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		
		return networkResponse;
	} catch (error) {
		console.log('[SW] Network failed, trying cache for API');
		const cachedResponse = await caches.match(request);
		
		if (cachedResponse) {
			return cachedResponse;
		}
		
		// Return offline fallback untuk API
		return new Response(
			JSON.stringify({ 
				error: 'Offline', 
				message: 'API tidak tersedia saat offline' 
			}), 
			{
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

// Handle static requests (cache first)
async function handleStaticRequest(request) {
	try {
		console.log('[SW] Static Request - trying cache first');
		const cachedResponse = await caches.match(request);
		
		if (cachedResponse) {
			console.log('[SW] Found in cache:', request.url);
			return cachedResponse;
		}
		
		console.log('[SW] Not in cache, trying network');
		const networkResponse = await fetch(request);
		
		if (networkResponse.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		
		return networkResponse;
	} catch (error) {
		console.error('[SW] Both cache and network failed for:', request.url);
		
		// Fallback untuk HTML requests
		if (request.headers.get('accept')?.includes('text/html')) {
			// Try different variations of index.html
			const indexVariations = ['/', '/index.html', 'src/index.html'];
			for (const variation of indexVariations) {
				const cachedIndex = await caches.match(variation);
				if (cachedIndex) {
					return cachedIndex;
				}
			}
		}
		
		// Return generic offline response
		return new Response(
			'Offline - Resource tidak tersedia', 
			{
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'text/plain' }
			}
		);
	}
}

// Push notification handler
self.addEventListener('push', function (event) {
	console.log('[Service Worker] Push received:', event);
	
	let notificationData = {
		title: 'Story App',
		body: 'Ada update baru!',
		icon: 'src/public/icon/icons/icon-96x96.png',
		badge: 'src/public/icon/icons/icon-96x96.png',
		tag: 'story-app-notification',
		data: { url: '/' },
	};
	
	if (event.data) {
		try {
			const pushData = event.data.json();
			notificationData = { ...notificationData, ...pushData };
		} catch (e) {
			notificationData.body = event.data.text();
		}
	}
	
	const promiseChain = self.registration.showNotification(
		notificationData.title,
		{
			body: notificationData.body,
			icon: notificationData.icon,
			badge: notificationData.badge,
			tag: notificationData.tag,
			data: notificationData.data,
			actions: [
				{ action: 'open', title: 'Buka App' },
				{ action: 'close', title: 'Tutup' },
			],
		}
	);
	
	event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener('notificationclick', function (event) {
	console.log('[Service Worker] Notification clicked:', event);
	event.notification.close();
	
	if (event.action === 'close') {
		return;
	}
	
	const urlToOpen = event.notification.data?.url || '/';
	
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				for (const client of clientList) {
					if (client.url.includes(self.location.origin) && 'focus' in client) {
						return client.focus().then(() => client.navigate(urlToOpen));
					}
				}
				if (clients.openWindow) {
					return clients.openWindow(urlToOpen);
				}
			})
	);
});

// Background Sync
self.addEventListener('sync', function (event) {
	console.log('[Service Worker] Background sync:', event.tag);
	if (event.tag === 'sync-stories') {
		event.waitUntil(syncOfflineStories());
	}
});

// Sync offline stories
async function syncOfflineStories() {
	try {
		const queuedStories = await StoryDatabase.getQueuedStories();
		
		for (const story of queuedStories) {
			try {
				await sendStory(story);
				console.log('[SW] Story synced:', story.description);
				await StoryDatabase.clearQueuedStories();
				
				self.registration.showNotification('Story Berhasil Disinkronkan', {
					body: `Story "${story.description}" telah dikirim ke server`,
					icon: 'src/public/icon/icons/icon-96x96.png',
					tag: 'sync-success',
				});
			} catch (error) {
				console.error('[SW] Failed to sync story:', error);
			}
		}
	} catch (error) {
		console.error('[SW] Sync error:', error);
	}
}

// Message handler
self.addEventListener('message', function (event) {
	console.log('[Service Worker] Message received:', event.data);
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});