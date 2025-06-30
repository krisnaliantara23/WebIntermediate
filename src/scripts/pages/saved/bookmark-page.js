import StoryDatabase from '../../data/database.js';

const BookmarkPage = {
  async render() {
    return `
      <section class="main-content">
        <h1>Bookmark Stories</h1>
        <div id="bookmarkList" class="movie-list loading">
          <p>Loading bookmark stories...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const container = document.querySelector('#bookmarkList');
    container.innerHTML = '';

    try {
      const bookmarks = await StoryDatabase.getAllStories();

      if (!bookmarks.length) {
        container.innerHTML = '<p class="text-center">Belum ada story yang dibookmark.</p>';
        return;
      }

      bookmarks.forEach((story) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <img src="${story.photoUrl}" alt="${story.name}" class="movie-img" />
          <div class="movie-title">${story.name}</div>
          <div class="movie-location">${story.description}</div>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = `<p class="text-center">Gagal memuat bookmark: ${error.message}</p>`;
    }
  },
};

export default BookmarkPage;
