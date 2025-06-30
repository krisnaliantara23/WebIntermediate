import HomePage from '../pages/home/home-page';
import AddPage from '../pages/add/add-page';
import AboutPage from '../pages/about/about-page';
import SavedPage from '../pages/saved/saved-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import NotFoundPage from '../pages/not-found/not-found-page';
import { isUserLoggedIn } from '../utils/auth-helper';

const routes = {
  '/': async () => {
    if (!isUserLoggedIn()) {
      window.location.hash = '/login';
      return {
        render: async () => `<p class="text-center">Redirecting to login...</p>`,
        afterRender: async () => {},
      };
    }
    return HomePage;
  },
  '/about': AboutPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/saved': async () => {
    if (!isUserLoggedIn()) {
      window.location.hash = '/login';
      return {
        render: async () => `<p class="text-center">Redirecting to login...</p>`,
        afterRender: async () => {},
      };
    }
    return SavedPage;
  },
  '/add': async () => {
    if (!isUserLoggedIn()) {
      window.location.hash = '/login';
      return {
        render: async () => `<p class="text-center">Redirecting to login...</p>`,
        afterRender: async () => {},
      };
    }
    return AddPage;
  },
  '*': NotFoundPage,
};

export default routes;
