import CacheHelper from "./utils/cache-helper.js";
import StoryDatabase from "./data/database.js";
import { sendStory } from "./data/api.js";

const CACHE_NAME = 'story-app-v1';

// CACHE HANYA FILE YANG PASTI ADA - Untuk menghindari 404
const ASSETS_TO_CACHE = [
	// Main files - pastikan path ini benar
	'/',
	'./index.html',
	
	// External resources yang pasti ada
	'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
	'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
	
	// Tambahkan file lain secara bertahap setelah memastikan ada
];

// STRATEGY: Cache what exists, ignore what doesn't
self.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(async (cache) => {
				console.log('[Service Worker] Caching app shell');
				
				// Cache external resources first (pasti ada)
				const externalResources = ASSETS_TO_CACHE.filter(url => url.startsWith('http'));
				for (const url of externalResources) {
					try {
						const response = await fetch(url);
						if (response.ok) {
							await cache.put(url, response);
							console.log(`[SW] Cached external: ${url}`);
						}
					} catch (error) {
						console.warn(`[SW] Failed external: ${url}`);
					}
				}
				
				// Cache local files dengan checking
				const localFiles = ASSETS_TO_CACHE.filter(url => !url.startsWith('http'));
				for (const url of localFiles) {
					try {
						const response = await fetch(url);
						if (response.ok) {
							await cache.put(url, response);
							console.log(`[SW] Cached local: ${url}`);
						} else {
							console.warn(`[SW] Local file not found: ${url}`);
						}
					} catch (error) {
						console.warn(`[SW] Failed to cache: ${url}`);
					}
				}
				
				// DYNAMIC CACHING: Automatically cache files as they're requested
				console.log('[SW] Basic cache setup completed - will cache dynamically');
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

// IMPROVED FETCH HANDLER - Cache everything that works
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}
	
	// Skip non-http requests
	if (!event.request.url.startsWith('http')) {
		return;
	}
	
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	try {
		// 1. Check cache first
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			console.log('[SW] Served from cache:', request.url);
			return cachedResponse;
		}
		
		// 2. Try network
		console.log('[SW] Fetching from network:', request.url);
		const networkResponse = await fetch(request);
		
		if (networkResponse.ok) {
			// 3. Cache successful responses dynamically
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
			console.log('[SW] Dynamically cached:', request.url);
		}
		
		return networkResponse;
		
	} catch (error) {
		console.log('[SW] Network failed for:', request.url);
		
		// 4. Provide fallbacks for offline
		if (request.headers.get('accept')?.includes('text/html')) {
			// HTML fallback
			const fallbackHTML = await caches.match('/') || await caches.match('./index.html');
			if (fallbackHTML) {
				return fallbackHTML;
			}
		}
		
		// Generic offline response
		return new Response(
			'Aplikasi sedang offline. Silakan coba lagi nanti.', 
			{
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'text/plain; charset=utf-8' }
			}
		);
	}
}

// Push notification handler (KRITERIA WAJIB 2)
self.addEventListener('push', function (event) {
	console.log('[Service Worker] Push received:', event);
	
	let notificationData = {
		title: 'Story App',
		body: 'Ada update baru!',
		icon: '/icon-96x96.png', // fallback icon
		badge: '/icon-96x96.png',
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

// Background Sync (KRITERIA WAJIB 4 - IndexedDB integration)
self.addEventListener('sync', function (event) {
	console.log('[Service Worker] Background sync:', event.tag);
	if (event.tag === 'sync-stories') {
		event.waitUntil(syncOfflineStories());
	}
});

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
					icon: '/icon-96x96.png',
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