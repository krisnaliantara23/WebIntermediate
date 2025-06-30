import "../styles/styles.css";
import App from "./pages/app.js";
import NotificationHelper from "./utils/notification-helper.js";
import StoryDatabase from "./data/database.js";
import { sendStory } from "./data/api.js";

async function syncQueuedStories() {
	const queued = await StoryDatabase.getQueuedStories();
	if (!queued.length) return;

	for (const story of queued) {
		try {
			await sendStory(story);
			await StoryDatabase.removeQueuedStory(story.id);
			console.log(" Story tersinkronisasi:", story.description);
		} catch (err) {
			console.warn(" Gagal sinkronisasi story offline:", err);
		}
	}
}

window.addEventListener("online", syncQueuedStories);

const initApp = async () => {
	const app = new App({
		navigationDrawer: document.querySelector("#navigation-drawer"),
		drawerButton: document.querySelector("#drawer-button"),
		content: document.querySelector("#main-content"),
	});

	window.addEventListener("hashchange", () => {
		app.renderPage();
	});

	window.addEventListener("DOMContentLoaded", async () => {
		await app.renderPage();

		await NotificationHelper.requestPermission();

		if ("serviceWorker" in navigator) {
		try {
			console.log('[App] Registering service worker...');
			
			const registration = await navigator.serviceWorker.register("./sw.bundle.js", {
				scope: '/' // Pastikan scope benar
			});
			
			console.log('[App] Service worker registered successfully:', registration.scope);
			
			// Handle service worker updates
			registration.addEventListener('updatefound', () => {
				console.log('[App] Service worker update found');
				const newWorker = registration.installing;
				
				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						console.log('[App] New service worker installed, reloading...');
						// Optionally auto-reload or show update notification
						// window.location.reload();
					}
				});
			});
			
			// Listen for messages from SW
			navigator.serviceWorker.addEventListener('message', (event) => {
				console.log('[App] Message from SW:', event.data);
			});
			
		} catch (error) {
			console.error('[App] Service worker registration failed:', error);
		}
	} else {
		console.warn('[App] Service Worker not supported in this browser');
	}
});

// Tambahan: Debug helper untuk testing
if (process.env.NODE_ENV === 'development') {
	window.debugCache = async () => {
		const { CacheHelper } = await import('./utils/cache-helper.js');
		return await CacheHelper.getCacheInfo();
	};
	
	window.clearCache = async () => {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map(name => caches.delete(name)));
		console.log('All caches cleared');
	};
}
}

initApp();
