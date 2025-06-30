const LoginPage = {
  async render() {
    return `
      <section class="main-content">
        <h1>Masuk</h1>
        <form id="loginForm" class="form-group">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit" class="btn-primary">Masuk</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const form = document.querySelector('#loginForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = form.email.value;
      const password = form.password.value;

      const success = await import('./login-presenter.js').then(({ default: presenter }) => {
        return presenter.handleLogin({ email, password });
      });

      if (success) {
        window.location.hash = '#/';
      }
    });
  },
};

export default LoginPage;
