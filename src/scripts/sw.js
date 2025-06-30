import CacheHelper from "./utils/cache-helper.js";
import StoryDatabase from "./data/database.js";
import { sendStory } from "./data/api.js";

const ASSETS_TO_CACHE = [
	"/",
	"./index.html",
	"./sw.bundle.js",
	"./app.webmanifest",
	"./app.bundle.js",
	"./favicon.ico",
	"./app.css",
	"/images/logo.png",
	"./icon/icons/icon-72x72.png",
	"./icon/icons/icon-96x96.png",
	"./icon/icons/icon-128x128.png",
	"./icon/icons/icon-144x144.png",
	"./icon/icons/icon-152x152.png",
	"./icon/icons/icon-192x192.png",
	"./icon/icons/icon-384x384.png",
	"./icon/icons/icon-512x512.png",
	"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
];

// "/images/logo.png",
// 	"/images/maskable_icon_x192.png",
// 	"/images/maskable_icon_x512.png",
// 	"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",

self.addEventListener("install", (event) => {
	console.log("[Service Worker] Installing...");
	event.waitUntil(CacheHelper.cachingAppShell([...ASSETS_TO_CACHE]));
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activated");
	event.waitUntil(CacheHelper.deleteOldCache());
});

self.addEventListener("fetch", (event) => {
	console.log("[Service Worker] Fetching...");
	event.respondWith(CacheHelper.revalidateCache(event.request));
});

self.addEventListener("push", function (event) {
	console.log("[Service Worker] Push received:", event);

	let notificationData = {
		title: "Story App",
		body: "Ada update baru!",
		icon: "./icon/icons/icon-96x96.png",
		badge: "./icon/icons/icon-96x96.png",
		tag: "story-app-notification",
		data: {
			url: "/",
		},
	};

	if (event.data) {
		try {
			const pushData = event.data.json();
			console.log("[Service Worker] Push data:", pushData);
			notificationData = {
				...notificationData,
				...pushData,
			};
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
				{
					action: "open",
					title: "Buka App",
				},
				{
					action: "close",
					title: "Tutup",
				},
			],
		}
	);

	event.waitUntil(promiseChain);
});

self.addEventListener("notificationclick", function (event) {
	console.log("[Service Worker] Notification clicked:", event);

	event.notification.close();

	if (event.action === "close") {
		return;
	}

	const urlToOpen = event.notification.data?.url || "/";

	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				// Cek apakah ada window yang sudah terbuka
				for (const client of clientList) {
					if (
						client.url.includes(self.location.origin) &&
						"focus" in client
					) {
						return client.focus().then(() => {
							// Navigate ke URL yang diinginkan
							return client.navigate(urlToOpen);
						});
					}
				}

				// Buka window baru jika tidak ada yang terbuka
				if (clients.openWindow) {
					return clients.openWindow(urlToOpen);
				}
			})
	);
});

// Background Sync untuk offline stories
self.addEventListener("sync", function (event) {
	console.log("[Service Worker] Background sync:", event.tag);

	if (event.tag === "sync-stories") {
		event.waitUntil(syncOfflineStories());
	}
});

// Function untuk sync offline stories
async function syncOfflineStories() {
	try {
		const queuedStories = await StoryDatabase.getQueuedStories();

		for (const story of queuedStories) {
			try {
				await sendStory(story);
				console.log("[SW] Story synced:", story.description);

				// Hapus dari queue setelah berhasil
				await StoryDatabase.clearQueuedStories();

				// Show notification
				self.registration.showNotification("Story Berhasil Disinkronkan", {
					body: `Story "${story.description}" telah dikirim ke server`,
					icon: "./icon/icons/icon-96x96.png",
					tag: "sync-success",
				});
			} catch (error) {
				console.error("[SW] Failed to sync story:", error);
			}
		}
	} catch (error) {
		console.error("[SW] Sync error:", error);
	}
}

self.addEventListener("message", function (event) {
	console.log(event);
	console.log("[Service Worker] Message received:", event.data);

	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
