import { register } from '../../data/api.js';

const RegisterPresenter = {
  async handleRegister({ name, email, password }) {
    try {
      const response = await register({ name, email, password });

      if (response && response.message === 'User created') {
        alert('Pendaftaran berhasil! Silakan login.');
        return true;
      } else {
        alert(response.message || 'Gagal mendaftar.');
        return false;
      }
    } catch (error) {
      console.error('Register Error:', error);
      alert(error.message || 'Terjadi kesalahan saat mendaftar.');
      return false;
    }
  },
};

export default RegisterPresenter;
