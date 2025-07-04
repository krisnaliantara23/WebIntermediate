import HomePresenter from './home-presenter';
import NotificationHelper from '../../utils/notification-helper.js';
import L from 'leaflet';

const HomePage = {
  async render() {
    return `
      <section class="main-content">
        <div class="container">
          <h1 class="page-title">📖 Explore Stories</h1>
          <button id="subscribe-btn" class="btn-primary" style="margin-top: 20px;">🔔 Subscribe Notifikasi</button>
          <p class="page-subtitle">Discover amazing stories from around the world</p>
          
          <div class="loading-indicator" id="loading-indicator">
            <div class="spinner"></div>
            <p>Loading stories...</p>
          </div>
          
          <!-- Map Section -->
          <div class="map-section" style="margin-bottom: 30px;">
            <h2 class="section-title">🗺️ Stories Map</h2>
            <div id="stories-map" style="height: 400px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></div>
          </div>
          
          <div class="stories-container" id="story-list" style="display: none;"></div>
          
          <div class="error-message" id="error-message" style="display: none;">
            <h3>🔌 You're offline</h3>
            <p>Showing saved stories from your device</p>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const container = document.querySelector('#story-list');
    const loadingIndicator = document.querySelector('#loading-indicator');
    const errorMessage = document.querySelector('#error-message');

    const mapContainer = document.getElementById('stories-map');
    if (mapContainer && mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
      mapContainer.innerHTML = '';
    }

    const presenter = new HomePresenter({
      view: container,
      loadingIndicator,
      errorMessage,
      mapContainer: mapContainer,
    });

    const subscribeBtn = document.querySelector('#subscribe-btn');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', async () => {
        const permissionGranted = await NotificationHelper.requestPermission();
        if (!permissionGranted) {
          alert("❌ Gagal mendapatkan izin notifikasi");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await NotificationHelper.subscribeToPushNotification(registration);

        if (subscription) {
          alert("✅ Berhasil berlangganan notifikasi!");
          subscribeBtn.textContent = "✅ Sudah Subscribe";
          subscribeBtn.disabled = true;

          // ✅ Langsung tampilkan notifikasi lokal
          NotificationHelper.showNotification("Berhasil Subscribe 🎉", {
            body: "Kamu akan menerima update dari aplikasi ini.",
          });
        } else {
          alert("❌ Gagal berlangganan notifikasi");
        }
      });
    }

    await presenter.loadStories();
  },
};

export default HomePage;
