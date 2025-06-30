
const AboutPage = {
  async render() {
    return `
      <section class="main-content">
        <div class="container">
          <h1>Tentang Aplikasi</h1>
          
          <div class="about-content">
            <h2>Story App PWA</h2>
            <p>
              Aplikasi ini adalah Progressive Web App untuk berbagi cerita dan pengalaman. 
              Dibuat dengan teknologi modern untuk memberikan pengalaman terbaik bagi pengguna.
            </p>
            
            <h3>Fitur Utama:</h3>
            <ul>
              <li> <strong>Progressive Web App</strong> - Dapat diinstall di perangkat</li>
              <li> <strong>Offline Support</strong> - Tetap bisa digunakan tanpa internet</li>
              <li> <strong>Push Notifications</strong> - Dapatkan notifikasi terbaru</li>
              <li> <strong>Camera Integration</strong> - Ambil foto langsung dari kamera</li>
              <li> <strong>Local Storage</strong> - Data tersimpan lokal dengan IndexedDB</li>
              <li> <strong>Auto Sync</strong> - Sinkronisasi otomatis saat online</li>
            </ul>
            
            <h3>Teknologi yang Digunakan:</h3>
            <ul>
              <li>Vanilla JavaScript ES6+</li>
              <li>Service Worker API</li>
              <li>IndexedDB dengan IDB library</li>
              <li>Push Notification API</li>
              <li>Camera API</li>
              <li>Webpack untuk bundling</li>
            </ul>
            
            <div class="app-info">
              <h3>Informasi Aplikasi</h3>
              <p><strong>Versi:</strong> 1.0.0</p>
              <p><strong>Dibuat untuk:</strong> Dicoding Submission</p>
              <p><strong>Status PWA:</strong> <span id="pwa-status">Checking...</span></p>
              <p><strong>Service Worker:</strong> <span id="sw-status">Checking...</span></p>
              <p><strong>Push Support:</strong> <span id="push-status">Checking...</span></p>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {

    this._checkPWAStatus();
    this._checkServiceWorkerStatus();
    this._checkPushSupport();
  },

  _checkPWAStatus() {
    const statusEl = document.querySelector('#pwa-status');
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      statusEl.textContent = ' Berjalan sebagai PWA';
      statusEl.style.color = 'green';
    } else {
      statusEl.textContent = ' Berjalan di browser';
      statusEl.style.color = 'orange';
    }
  },

  _checkServiceWorkerStatus() {
    const statusEl = document.querySelector('#sw-status');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        statusEl.textContent = ' Service Worker aktif';
        statusEl.style.color = 'green';
      }).catch(() => {
        statusEl.textContent = ' Service Worker error';
        statusEl.style.color = 'red';
      });
    } else {
      statusEl.textContent = ' Tidak didukung';
      statusEl.style.color = 'red';
    }
  },

  _checkPushSupport() {
    const statusEl = document.querySelector('#push-status');
    
    if ('PushManager' in window) {
      statusEl.textContent = ' Push notification didukung';
      statusEl.style.color = 'green';
    } else {
      statusEl.textContent = ' Push notification tidak didukung';
      statusEl.style.color = 'red';
    }
  }
};

export default AboutPage;