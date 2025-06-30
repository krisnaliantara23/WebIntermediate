
import { login } from '../data/api.js'; 
import NotificationHelper from './notification-helper.js'; 

export const getToken = () => localStorage.getItem('token');

export const isUserLoggedIn = () => !!getToken();

export const logoutUser = () => {
  localStorage.removeItem('token');
};

export const handleLogin = async ({ email, password }) => {
  try {
    const response = await login({ email, password });
    const { token, message } = response;

    if (token) {
      localStorage.setItem('token', token);
      NotificationHelper.showNotification('👋 Selamat datang kembali!', {
        body: 'Login berhasil. Silakan mulai berbagi story.',
        icon: '/images/logo.png',
      });
      return true;
    } else {
      alert(message || 'Login gagal. Coba lagi.');
      return false;
    }
  } catch (error) {
    console.error('Login Error:', error);
    alert('Terjadi kesalahan saat login.');
    return false;
  }
};
