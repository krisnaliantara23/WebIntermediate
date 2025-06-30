import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { isUserLoggedIn, logoutUser } from '../utils/auth-helper';

class App {
  constructor({ navigationDrawer, drawerButton, content }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupLogoutHandler();
  }

  _setupDrawer() {
    this._drawerButton.addEventListener('click', () => {
      this._navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this._navigationDrawer.contains(event.target) &&
        !this._drawerButton.contains(event.target)
      ) {
        this._navigationDrawer.classList.remove('open');
      }
    });
  }

  _setupLogoutHandler() {
    const logoutBtn = document.querySelector('#logout-btn');
    const loginLink = document.querySelector('a[href="#/login"]');
    const registerLink = document.querySelector('a[href="#/register"]');

    if (logoutBtn) {
      if (isUserLoggedIn()) {
        logoutBtn.style.display = 'block';
        loginLink?.style.setProperty('display', 'none');
        registerLink?.style.setProperty('display', 'none');

        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
          window.location.hash = '/login';
        });
      } else {
        logoutBtn.style.display = 'none';
        loginLink?.style.setProperty('display', 'inline-block');
        registerLink?.style.setProperty('display', 'inline-block');
      }
    }
  }

  async renderPage() {
    try {
      this._content.classList.add('fade-out');
      await new Promise((r) => setTimeout(r, 300));

      const url = getActiveRoute();
      const pageLoader = routes[url];
      const page = typeof pageLoader === 'function' ? await pageLoader() : pageLoader;

      this._content.innerHTML = await page.render();
      await page.afterRender();

      this._setupLogoutHandler();
      this._content.classList.remove('fade-out');
      this._content.classList.add('fade-in');
    } catch (error) {
      console.error('Error saat render halaman:', error);
      this._content.innerHTML = `
        <section class="container">
          <h2>Terjadi Kesalahan</h2>
          <p>${error.message}</p>
        </section>`;
    }
  }
}

export default App;
