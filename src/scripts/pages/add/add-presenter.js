import StoryDatabase from '../../data/database.js';
import { sendStory } from '../../data/api.js';
import NotificationHelper from '../../utils/notification-helper.js';

const AddPresenter = {
  async handleSubmitStory({ description, photo, lat = null, lon = null }) {
    if (!description || !photo) {
      throw new Error('Deskripsi dan foto wajib diisi.');
    }

    const story = { description, photo, lat, lon };

    try {
      if (navigator.onLine) {
        // Online: kirim langsung ke server
        const response = await sendStory(story);
        
        await NotificationHelper.showNotification('✅ Story berhasil dikirim!', {
          body: 'Story baru sudah dikirim ke server.',
          icon: '/images/icons/arrow.svg',
          tag: 'story-success'
        });
        
        return { success: true, message: 'Story berhasil dikirim!' };
      } else {
        // Offline: simpan ke queue
        await StoryDatabase.queueStory(story);
        
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-stories');
        }
        
        return { 
          success: true, 
          message: '📴 Offline: Story disimpan dan akan dikirim saat online' 
        };
      }
    } catch (error) {
      console.error('Error submit story:', error);
      
      if (navigator.onLine) {
        try {
          await StoryDatabase.queueStory(story);
          return { 
            success: true, 
            message: 'Gagal kirim ke server, disimpan offline' 
          };
        } catch (offlineError) {
          throw new Error('Gagal menyimpan story');
        }
      }
      
      throw error;
    }
  },

  async handleCameraCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  },

  capturePhotoFromVideo(video, canvas) {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        resolve(file);
      }, 'image/jpeg', 0.8);
    });
  },

  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; 
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
    }
    
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
    }
    
    return true;
  }
};

export default AddPresenter;