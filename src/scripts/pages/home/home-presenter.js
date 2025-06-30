// PERBAIKAN: Tambahkan .js extension dan perbaiki import path
import StoryDatabase from "../../data/database.js";
import { getAllStories } from "../../data/api.js";
import NotificationHelper from "../../utils/notification-helper.js";

// PERBAIKAN: Import logo dengan cara yang benar untuk bundler
// import logo dari path relatif sesuai struktur direktori
// atau gunakan URL string jika menggunakan bundler
const logo = "./images/logo.png";

// PERBAIKAN: Import Leaflet dengan cara yang benar
// Pastikan Leaflet sudah di-load via CDN atau bundle
// import L from 'leaflet'; // Jika menggunakan bundler
// atau gunakan global L jika via CDN

class HomePresenter {
  constructor({ view, loadingIndicator, errorMessage, mapContainer }) {
    this._view = view;
    this._loadingIndicator = loadingIndicator;
    this._errorMessage = errorMessage;
    this._mapContainer = mapContainer;
    this._map = null;
    this._markers = [];
  }

  async loadStories() {
    this._showLoading(true);
    try {
      const response = await getAllStories();
      const stories = response.listStory || [];
      if (!stories.length) throw new Error("No stories from API");
      
      await Promise.all(stories.map((story) => StoryDatabase.putStory(story)));
      this._showLoading(false);
      this._displayStories(stories, false);
      
      // Initialize map after a short delay to ensure DOM is properly rendered
      setTimeout(() => {
        this._initializeMap(stories);
      }, 100);
      
      NotificationHelper.showNotification("New Stories Available!", {
        body: `${stories.length} stories are ready to explore`,
        icon: logo,
      });
    } catch (err) {
      console.error("[HomePresenter] Error fetching stories:", err);
      const offlineStories = await StoryDatabase.getAllStories();
      this._showLoading(false);
      
      if (offlineStories.length > 0) {
        this._displayStories(offlineStories, true);
        
        // Initialize map after a short delay
        setTimeout(() => {
          this._initializeMap(offlineStories);
        }, 100);
      } else {
        this._showError(
          "No stories available. Please check your connection and try again."
        );
      }
    }
  }

  _initializeMap(stories) {
    if (!this._mapContainer) {
      console.error('Map container not found');
      return;
    }

    // PERBAIKAN: Cek apakah Leaflet tersedia
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      this._mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; border-radius: 10px; border: 2px dashed #dee2e6;">
          <div style="text-align: center; color: #6c757d;">
            <h3>🗺️ Map Library Error</h3>
            <p>Leaflet library is not loaded. Please check your scripts.</p>
          </div>
        </div>
      `;
      return;
    }

    try {
      // Clean up existing map if it exists
      if (this._map) {
        this._map.remove();
        this._map = null;
      }

      // Clear the container
      this._mapContainer.innerHTML = '';
      
      // Force container dimensions
      this._mapContainer.style.height = '400px';
      this._mapContainer.style.width = '100%';
      this._mapContainer.style.position = 'relative';
      this._mapContainer.style.zIndex = '2';

      // Initialize the map with proper options
      this._map = L.map(this._mapContainer, {
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        preferCanvas: false
      }).setView([-6.2, 106.816], 5); // Indonesia center
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
      }).addTo(this._map);

      // Clear existing markers
      this._markers.forEach(marker => {
        if (this._map && marker) {
          this._map.removeLayer(marker);
        }
      });
      this._markers = [];

      // Filter stories that have location data
      const storiesWithLocation = stories.filter(story => 
        story.lat && story.lon && 
        !isNaN(parseFloat(story.lat)) && 
        !isNaN(parseFloat(story.lon))
      );
      
      if (storiesWithLocation.length === 0) {
        // Show message if no stories have location
        const noLocationPopup = L.popup()
          .setLatLng([-6.2, 106.816])
          .setContent('<div style="text-align: center; padding: 10px;"><strong>📍 No Location Data</strong><br>Stories don\'t have location information</div>')
          .openOn(this._map);
        return;
      }

      // Create custom icon for story markers
      const storyIcon = L.divIcon({
        className: 'story-marker',
        html: '<div class="marker-inner">📖</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      // Add markers for each story with location
      storiesWithLocation.forEach((story, index) => {
        const lat = parseFloat(story.lat);
        const lon = parseFloat(story.lon);
        
        if (isNaN(lat) || isNaN(lon)) return;
        
        try {
          const marker = L.marker([lat, lon], { icon: storyIcon }).addTo(this._map);
          
          // Create popup content
          const popupContent = `
            <div class="story-popup">
              <img src="${story.photoUrl}" alt="${story.name}" class="popup-image" 
                   onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA0MEMxNjMuNDIgNDAgNjYuNTggNDAgNzUgNDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iMzUiIHI9IjUiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'" />
              <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">${story.name}</h4>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${story.description}</p>
              <button class="popup-detail-btn" data-story-id="${story.id}">View Details</button>
            </div>
          `;
          
          marker.bindPopup(popupContent, {
            maxWidth: 200,
            closeButton: true,
            autoClose: false
          });
          
          this._markers.push(marker);
          
          // Store story data in marker for later use
          marker.storyData = story;
        } catch (markerError) {
          console.error('Error creating marker:', markerError);
        }
      });

      // Fit map to show all markers
      if (this._markers.length > 0) {
        try {
          const group = new L.featureGroup(this._markers);
          this._map.fitBounds(group.getBounds().pad(0.1));
        } catch (boundsError) {
          console.error('Error fitting bounds:', boundsError);
        }
      }

      // Store stories data globally for popup access
      window.currentStories = stories;
      
      // Add event listener for popup buttons
      this._map.on('popupopen', (e) => {
        const popup = e.popup;
        const button = popup.getElement().querySelector('.popup-detail-btn');
        if (button) {
          button.addEventListener('click', (event) => {
            const storyId = event.target.getAttribute('data-story-id');
            const story = window.currentStories.find(s => s.id === storyId);
            if (story) {
              this._showStoryDetails(story);
            }
          });
        }
      });

      // Force map to invalidate size after container is properly sized
      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
        }
      }, 200);

      console.log('Map initialized successfully with', this._markers.length, 'markers');
      
    } catch (error) {
      console.error('Error initializing map:', error);
      
      // Show error message in map container
      if (this._mapContainer) {
        this._mapContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; border-radius: 10px; border: 2px dashed #dee2e6;">
            <div style="text-align: center; color: #6c757d;">
              <h3>🗺️ Map Error</h3>
              <p>Unable to load the map. Please refresh the page.</p>
            </div>
          </div>
        `;
      }
    }
  }

  _showLoading(show) {
    if (this._loadingIndicator) {
      this._loadingIndicator.style.display = show ? "block" : "none";
    }
    if (this._view) {
      this._view.style.display = show ? "none" : "block";
    }
  }

  _showError(message) {
    if (this._errorMessage) {
      this._errorMessage.textContent = message;
      this._errorMessage.style.display = "block";
    }
  }

  _displayStories(stories, isOffline = false) {
    this._view.innerHTML = "";
    
    if (isOffline && this._errorMessage) {
      this._errorMessage.style.display = "block";
    }

    if (!stories.length) {
      this._view.innerHTML = `<p class="text-center">No stories available.</p>`;
      return;
    }

    const container = document.createElement("div");
    container.className = "movie-list";
    
    stories.forEach((story) => {
      const card = document.createElement("div");
      card.className = "movie-card";
      card.innerHTML = `
        <img src="${story.photoUrl}" alt="${story.name}" class="movie-img" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyMCA4MEwxNjAgMTIwTDEyMCAxNjBaIiBmaWxsPSIjOUM5Q0EwIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg=='" />
        <div class="movie-title">${story.name}</div>
        <div class="movie-location">${this._truncateText(story.description, 100)}</div>
        ${story.lat && story.lon ? `<div class="story-coordinates">📍 ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}</div>` : ''}
        <button class="btn-primary mt-4 btn-save" aria-label="Simpan story">Simpan</button>
      `;

      const saveButton = card.querySelector(".btn-save");
      
      // PERBAIKAN: Event listener untuk save button
      saveButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          // Cek apakah sudah di-bookmark
          const isAlreadyBookmarked = await StoryDatabase.isBookmarked(story.id);
          
          if (isAlreadyBookmarked) {
            // Jika sudah di-bookmark, hapus dari bookmark
            await StoryDatabase.deleteBookmark(story.id);
            saveButton.textContent = "Simpan";
            saveButton.classList.remove("saved");
            alert("✅ Story dihapus dari saved!");
          } else {
            // Jika belum di-bookmark, tambahkan ke bookmark
            await StoryDatabase.addBookmark(story);
            saveButton.textContent = "Tersimpan";
            saveButton.classList.add("saved");
            alert("✅ Story berhasil disimpan!");
          }
        } catch (error) {
          alert("❌ Gagal menyimpan story!");
          console.error(error);
        }
      });

      // Cek status bookmark dan update tampilan button
      StoryDatabase.isBookmarked(story.id).then(isBookmarked => {
        if (isBookmarked) {
          saveButton.textContent = "Tersimpan";
          saveButton.classList.add("saved");
        }
      });

      card.addEventListener("click", () => this._showStoryDetails(story));
      container.appendChild(card);
    });

    this._view.appendChild(container);
  }

  _formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  _truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }

  _showStoryDetails(story) {
    // PERBAIKAN: Lengkapi method _showStoryDetails
    const modal = document.createElement('div');
    modal.className = 'story-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>${story.name}</h2>
            <button class="modal-close" onclick="this.closest('.story-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <img src="${story.photoUrl}" alt="${story.name}" class="modal-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE4MCA4MEwyNDAgMTUwTDE4MCAyMjBaIiBmaWxsPSIjOUM5Q0EwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg=='" />
            <div class="story-info">
              <p class="story-description">${story.description}</p>
              <div class="story-meta">
                <p><strong>Created:</strong> ${this._formatDate(story.createdAt)}</p>
                ${story.lat && story.lon ? `<p><strong>Location:</strong> ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}</p>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal styles if not already present
    if (!document.querySelector('#story-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'story-modal-styles';
      styles.textContent = `
        .story-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 10px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
          margin: 0;
          color: #333;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover {
          color: #333;
        }
        .modal-body {
          padding: 20px;
        }
        .modal-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 5px;
          margin-bottom: 15px;
        }
        .story-description {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 20px;
        }
        .story-meta {
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .story-meta p {
          margin: 5px 0;
          color: #666;
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
  }
}

export default HomePresenter;