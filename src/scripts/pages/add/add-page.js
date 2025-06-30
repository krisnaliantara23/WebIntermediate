import AddStoryView from '../../viewmodels/add-story-view';
import L from 'leaflet';  // Import Leaflet

const AddPage = {
  async render() {
    return `
      <section class="container">
        <h2>Tambah Cerita Baru</h2>
        <form id="story-form">
          <label for="name">Nama:</label>
          <input type="text" id="name" name="name" required />
          <label for="description">Deskripsi:</label>
          <textarea id="description" name="description" required></textarea>
          <!-- Camera Section -->
          <div class="camera-section">
            <label>Kamera:</label><br>
            <video id="camera-preview" autoplay muted playsinline width="320" height="240" style="display: none;"></video><br>
            <!-- Toggle buttons for camera -->
            <button type="button" id="toggle-camera-on">Hidupkan Kamera</button>
            <button type="button" id="toggle-camera-off" style="display: none;">Matikan Kamera</button>
            <button type="button" id="capture-photo">Ambil Foto</button> <!-- Always visible -->
          </div>
          <p>Atau pilih gambar dari file:</p>
          <input type="file" id="image" accept="image/*" />
          <!-- Map Section -->
          <div class="map-section" style="position: relative; width: 100%; height: 300px;">
            <label>Pin Lokasi:</label><br>
            <div id="map" style="height: 100%; width: 100%;"></div> <!-- Map container -->
          </div>
          <!-- Location Section -->
          <div class="location-section">
            <label>Deteksi Lokasi:</label>
            <button type="button" id="detect-location">Deteksi Lokasi Saya</button><br>
            <input type="text" id="latitude" placeholder="Latitude" readonly />
            <input type="text" id="longitude" placeholder="Longitude" readonly />
          </div>
          <button type="submit">Kirim</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    // Initialize the map first
    this._initializeMap();
    
    // Initialize AddStoryView (this will handle all form events including camera)
    AddStoryView.init();
  },

  _initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Ensure the map container has a fixed height
    mapContainer.style.height = '300px';  // Set a fixed height for the map
    
    // Initialize Leaflet map
    const map = L.map(mapContainer).setView([51.505, -0.09], 13); // Default position
    
    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Add click event to set location
    map.on('click', function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      
      // Clear existing markers
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      
      // Set marker on the clicked position
      L.marker([lat, lon]).addTo(map)
        .bindPopup(`Latitude: ${lat}<br>Longitude: ${lon}`)
        .openPopup();
      
      // Update the latitude and longitude input fields
      const latInput = document.getElementById('latitude');
      const lonInput = document.getElementById('longitude');
      if (latInput && lonInput) {
        latInput.value = lat;
        lonInput.value = lon;
      }
    });
  }
};

export default AddPage;