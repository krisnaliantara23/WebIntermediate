import CONFIG from "../config";

const CacheHelper = {
	async cachingAppShell(requests) {
		try {
			const cache = await this._openCache();
			await cache.addAll(requests);
			console.log('[Cache Helper] App shell cached successfully');
		} catch (error) {
			console.error('[Cache Helper] Failed to cache app shell:', error);
		}
	},

	async deleteOldCache() {
		try {
			const cacheNames = await caches.keys();
			const deletePromises = cacheNames
				.filter((name) => name !== CONFIG.CACHE_NAME)
				.map((filteredName) => caches.delete(filteredName));
			
			await Promise.all(deletePromises);
			console.log('[Cache Helper] Old caches deleted');
		} catch (error) {
			console.error('[Cache Helper] Failed to delete old cache:', error);
		}
	},

	async revalidateCache(request) {
		try {
			console.log('[Cache Helper] Checking cache for:', request.url);
			
			// 1. Cek cache terlebih dahulu
			const cachedResponse = await caches.match(request);
			
			if (cachedResponse) {
				console.log('[Cache Helper] Found in cache:', request.url);
				
				// Background update - jangan await, biar tidak blocking
				this._fetchRequest(request).catch(error => {
					console.log('[Cache Helper] Background update failed (normal saat offline):', error.message);
				});
				
				return cachedResponse;
			}
			
			// 2. Jika tidak ada di cache, coba network
			console.log('[Cache Helper] Not in cache, trying network:', request.url);
			return await this._fetchRequest(request);
			
		} catch (error) {
			console.error('[Cache Helper] Revalidate cache failed:', error);
			
			// 3. Fallback strategy
			return await this._handleFallback(request);
		}
	},

	async _handleFallback(request) {
		console.log('[Cache Helper] Applying fallback strategy for:', request.url);
		
		try {
			// Untuk HTML requests, fallback ke index.html
			if (request.mode === 'navigate' || 
				request.destination === 'document' ||
				request.headers.get('accept')?.includes('text/html')) {
				
				console.log('[Cache Helper] Trying index.html fallback');
				
				const indexFallback = await caches.match('/index.html') || 
									 await caches.match('./index.html') ||
									 await caches.match('index.html');
				
				if (indexFallback) {
					console.log('[Cache Helper] Using index.html fallback');
					return indexFallback;
				}
			}
			
			// Untuk asset lain, coba cari di cache dengan berbagai path
			const url = new URL(request.url);
			const pathname = url.pathname;
			
			const possiblePaths = [
				pathname,
				`.${pathname}`,
				pathname.startsWith('/') ? pathname.slice(1) : `/${pathname}`
			];
			
			for (const path of possiblePaths) {
				const fallbackResponse = await caches.match(path);
				if (fallbackResponse) {
					console.log(`[Cache Helper] Found fallback with path: ${path}`);
					return fallbackResponse;
				}
			}
			
			// Jika masih tidak ada, return offline response
			return this._createOfflineResponse(request);
			
		} catch (error) {
			console.error('[Cache Helper] Fallback failed:', error);
			return this._createOfflineResponse(request);
		}
	},

	_createOfflineResponse(request) {
		console.log('[Cache Helper] Creating offline response for:', request.url);
		
		// Untuk HTML requests
		if (request.mode === 'navigate' || 
			request.headers.get('accept')?.includes('text/html')) {
			
			return new Response(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Offline - Story App</title>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						body { 
							font-family: Arial, sans-serif; 
							text-align: center; 
							padding: 50px; 
							background: #f5f5f5; 
						}
						.offline-message { 
							background: white; 
							padding: 30px; 
							border-radius: 10px; 
							box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
						}
						.retry-btn {
							background: #2196f3;
							color: white;
							border: none;
							padding: 10px 20px;
							border-radius: 5px;
							cursor: pointer;
							margin-top: 20px;
						}
					</style>
				</head>
				<body>
					<div class="offline-message">
						<h1>📱 Story App</h1>
						<h2>🔌 Anda sedang offline</h2>
						<p>Periksa koneksi internet Anda dan coba lagi.</p>
						<button class="retry-btn" onclick="window.location.reload()">
							🔄 Coba Lagi
						</button>
					</div>
				</body>
				</html>
			`, {
				status: 503,
				statusText: 'Service Unavailable',
				headers: {
					'Content-Type': 'text/html; charset=utf-8',
					'Cache-Control': 'no-cache'
				}
			});
		}
		
		// Untuk API requests
		if (request.url.includes('/api/') || 
			request.headers.get('accept')?.includes('application/json')) {
			
			return new Response(JSON.stringify({
				error: 'offline',
				message: 'API tidak tersedia saat offline. Data akan disinkronkan saat online.',
				timestamp: new Date().toISOString()
			}), {
				status: 503,
				statusText: 'Service Unavailable',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache'
				}
			});
		}
		
		// Untuk resource lain
		return new Response('Resource tidak tersedia offline', {
			status: 503,
			statusText: 'Service Unavailable',
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'no-cache'
			}
		});
	},

	async _openCache() {
		return await caches.open(CONFIG.CACHE_NAME);
	},

	async _fetchRequest(request) {
		try {
			console.log('[Cache Helper] Fetching from network:', request.url);
			const response = await fetch(request);

			// Hanya cache response yang sukses
			if (response && response.status === 200) {
				await this._addCache(request, response.clone());
				console.log('[Cache Helper] Response cached:', request.url);
			} else {
				console.warn('[Cache Helper] Response not cached (status !== 200):', response?.status);
			}

			return response;
		} catch (error) {
			console.error('[Cache Helper] Network fetch failed:', error.message);
			throw error; // Re-throw untuk di-handle di level atas
		}
	},

	async _addCache(request, response) {
		try {
			const cache = await this._openCache();
			await cache.put(request, response);
		} catch (error) {
			console.error('[Cache Helper] Failed to add to cache:', error);
		}
	},

	// Helper method untuk debugging
	async getCacheInfo() {
		try {
			const cache = await this._openCache();
			const keys = await cache.keys();
			const urls = keys.map(request => request.url);
			
			console.log('[Cache Helper] Cached URLs:', urls);
			return {
				cacheName: CONFIG.CACHE_NAME,
				cachedUrls: urls,
				count: urls.length
			};
		} catch (error) {
			console.error('[Cache Helper] Failed to get cache info:', error);
			return null;
		}
	}
};

export default CacheHelper;