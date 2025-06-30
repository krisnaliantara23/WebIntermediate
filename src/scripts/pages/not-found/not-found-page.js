const NotFoundPage = {
  async render() {
    return `
      <section class="main-content text-center">
        <h1>404</h1>
        <p>Halaman yang kamu cari tidak ditemukan.</p>
        <a href="#/" class="btn-primary mt-4">Kembali ke Beranda</a>
      </section>
    `;
  },

  async afterRender() {
    
  },
};

export default NotFoundPage;
