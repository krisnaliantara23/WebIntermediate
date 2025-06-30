const Auth = {
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '#/login';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '#/login';
    }
  },
};

export default Auth;
