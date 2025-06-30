import CONFIG from "../config.js";
import logo from "../../public/images/logo.png";

const NotificationHelper = {
	async requestPermission() {
		if (!("Notification" in window)) {
			console.error("Browser tidak mendukung notifikasi");
			return false;
		}

		if (!("serviceWorker" in navigator)) {
			console.error("Browser tidak mendukung service worker");
			return false;
		}

		const permission = await Notification.requestPermission();
		if (permission !== "granted") {
			console.warn("Izin notifikasi tidak diberikan");
			return false;
		}

		return true;
	},

	async subscribeToPushNotification(registration) {
		try {
			const existingSubscription =
				await registration.pushManager.getSubscription();
			if (existingSubscription) {
				console.log("User sudah berlangganan push notification");
				return existingSubscription;
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(
					CONFIG.VAPID_PUBLIC_KEY
				),
			});

			console.log("Push subscription berhasil:", subscription);

			await this.sendSubscriptionToServer(subscription);

			return subscription;
		} catch (error) {
			console.error("Gagal subscribe push notification:", error);
			return null;
		}
	},

	async sendSubscriptionToServer(subscription) {
		try {
			const token = localStorage.getItem("token");
			if (!token) return;

			const response = await fetch(
				`${CONFIG.BASE_URL}/notifications/subscribe`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(subscription),
				}
			);

			if (!response.ok) {
				console.warn("Server tidak mendukung subscription endpoint");
			}
		} catch (error) {
			console.warn("Tidak bisa mengirim subscription ke server:", error);
		}
	},

	urlBase64ToUint8Array(base64String) {
		const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, "+")
			.replace(/_/g, "/");

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	},

	showNotification(title, options = {}) {
		if (Notification.permission === "granted") {
			navigator.serviceWorker.ready.then((registration) => {
				registration.showNotification(title, {
					icon: logo,
					badge: logo,
					tag: "story-app-notification",
					renotify: true,
					...options,
				});
			});
		}
	},

	async unsubscribeUser() {
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				await subscription.unsubscribe();
				console.log("Successfully unsubscribed from push notifications");
			}
		} catch (error) {
			console.error("Error unsubscribing from push notifications:", error);
		}
	},
};

export default NotificationHelper;
