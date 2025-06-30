const RegisterPage = {
  async render() {
    return `
      <section class="main-content">
        <h1>Daftar</h1>
        <form id="registerForm" class="form-group">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit" class="btn-primary">Daftar</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const form = document.querySelector('#registerForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = form.name.value;
      const email = form.email.value;
      const password = form.password.value;

      const success = await import('./register-presenter.js').then(({ default: presenter }) => {
        return presenter.handleRegister({ name, email, password });
      });

      if (success) {
        window.location.hash = '#/login';
      }
    });
  },
};

export default RegisterPage;
