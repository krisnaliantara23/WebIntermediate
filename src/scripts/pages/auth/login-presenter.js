import { login } from '../../data/api.js';
import NotificationHelper from '../../utils/notification-helper.js';

const LoginPresenter = {
  async handleLogin({ email, password }) {
    if (!email || !password) {
      alert('Email dan password wajib diisi.');
      return false;
    }

    try {
      const response = await login({ email, password });
      const { token } = response;

      if (token) {
        localStorage.setItem('token', token);
        NotificationHelper.showNotification('👋 Selamat datang kembali!', {
          body: 'Login berhasil. Silakan mulai berbagi story.',
          icon: '/images/HeartRate.png',
        });
        return true;
      } else {
        alert('Login gagal. Token tidak tersedia.');
        return false;
      }
    } catch (error) {
      console.error('Login Error:', error);
      alert(error.message || 'Terjadi kesalahan saat login.');
      return false;
    }
  },
};

export default LoginPresenter;
