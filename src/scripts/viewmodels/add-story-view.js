// add-story-view.js
import StoryDatabase from '../data/database.js';
import { sendStory } from '../data/api.js';
import NotificationHelper from '../utils/notification-helper.js';

const AddStoryView = {
  // Store stream reference at class level to prevent conflicts
  stream: null,
  photoFile: null,

  async init() {
    const form = document.querySelector('#story-form');
    const nameInput = document.querySelector('#name');
    const descInput = document.querySelector('#description');
    const fileInput = document.querySelector('#image');
    const video = document.querySelector('#camera-preview');
    const toggleOnBtn = document.querySelector('#toggle-camera-on');
    const toggleOffBtn = document.querySelector('#toggle-camera-off');
    const captureBtn = document.querySelector('#capture-photo');
    const detectLocationBtn = document.querySelector('#detect-location');
    const latitudeInput = document.querySelector('#latitude');
    const longitudeInput = document.querySelector('#longitude');

    // Check if all elements exist
    if (!form || !toggleOnBtn || !toggleOffBtn || !captureBtn || !video) {
      console.error('Required DOM elements not found');
      return;
    }

    // Reset state
    this.stream = null;
    this.photoFile = null;

    // Camera toggle on
    toggleOnBtn.addEventListener('click', async () => {
      try {
        if (!this.stream) {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = this.stream;
          video.style.display = 'block';
          toggleOnBtn.style.display = 'none';
          toggleOffBtn.style.display = 'inline-block';
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Gagal mengakses kamera: ' + error.message);
      }
    });

    // Camera toggle off
    toggleOffBtn.addEventListener('click', () => {
      if (this.stream) {
        // Stop all tracks
        this.stream.getTracks().forEach(track => {
          track.stop();
        });
        
        // Reset stream reference
        this.stream = null;
        
        // Reset video element
        video.srcObject = null;
        video.style.display = 'none';
        
        // Toggle buttons
        toggleOnBtn.style.display = 'inline-block';
        toggleOffBtn.style.display = 'none';
      }
    });

    // Capture photo
    captureBtn.addEventListener('click', () => {
      if (this.stream && video.style.display === 'block') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          this.photoFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          alert('📸 Foto berhasil diambil');
        }, 'image/jpeg');
      } else {
        alert('Kamera tidak aktif. Hidupkan kamera terlebih dahulu.');
      }
    });

    // Location detection
    if (detectLocationBtn) {
      detectLocationBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
            if (latitudeInput && longitudeInput) {
              latitudeInput.value = position.coords.latitude;
              longitudeInput.value = position.coords.longitude;
            }
          }, (error) => {
            alert('Gagal mengambil lokasi: ' + error.message);
          });
        } else {
          alert('Geolocation tidak didukung browser ini.');
        }
      });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const description = descInput.value.trim();
      const lat = parseFloat(latitudeInput?.value) || null;
      const lon = parseFloat(longitudeInput?.value) || null;
      const photo = fileInput.files[0] || this.photoFile;

      if (!description || !photo || !name) {
        alert('Nama, deskripsi, dan foto wajib diisi.');
        return;
      }

      const story = { name, description, photo, lat, lon };

      try {
        if (navigator.onLine) {
          await sendStory(story);
          NotificationHelper.showNotification('Story berhasil dikirim!', {
            body: 'Story baru sudah dikirim ke server.',
            icon: '/icons/icons/star.svg',
          });
        } else {
          await StoryDatabase.queueStory(story);
          alert('📴 Offline: story disimpan & akan dikirim saat online');
        }
        
        // Clean up camera stream before navigating away
        this.cleanup();
        window.location.hash = '#/';
      } catch (err) {
        console.error(err);
        alert('Gagal mengirim story.');
      }
    });

    // Clean up when page is about to be unloaded
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  },

  // Cleanup method to properly stop camera stream
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    this.photoFile = null;
  }
};

export default AddStoryView;