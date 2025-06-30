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

		if (!("serviceWorker" in navigator)) {
			console.log("Service Worker not supported in the browser");
			return;
		}

		try {
			await navigator.serviceWorker.register("./sw.bundle.js");
			console.log("Service worker registered");
		} catch (error) {
			console.log("Failed to register service worker", error);
		}
	});
};

initApp();
