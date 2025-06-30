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
      // PERBAIKAN: Gunakan getAllBookmarks() bukan getAllStories()
      const bookmarks = await StoryDatabase.getAllBookmarks();

      if (!bookmarks.length) {
        container.innerHTML = '<p class="text-center">Belum ada story yang dibookmark.</p>';
        return;
      }

      bookmarks.forEach((story) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <img src="${story.photoUrl}" alt="${story.name}" class="movie-img" 
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyMCA4MEwxNjAgMTIwTDEyMCAxNjBaIiBmaWxsPSIjOUM5Q0EwIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg=='" />
          <div class="movie-title">${story.name}</div>
          <div class="movie-location">${story.description}</div>
          ${story.bookmarkedAt ? `<div class="bookmark-date">📖 Saved: ${new Date(story.bookmarkedAt).toLocaleDateString("id-ID")}</div>` : ''}
          <button class="btn-remove-bookmark" aria-label="Hapus bookmark">❌ Remove Bookmark</button>
        `;

        // Tombol hapus bookmark
        const removeBtn = card.querySelector('.btn-remove-bookmark');
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmRemove = confirm(`Yakin ingin hapus bookmark story dari ${story.name}?`);
          if (!confirmRemove) return;

          await StoryDatabase.deleteBookmark(story.id);
          card.remove();

          if (!container.querySelector('.movie-card')) {
            container.innerHTML = '<p class="text-center">Belum ada story yang dibookmark.</p>';
          }
        });

        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = `<p class="text-center">Gagal memuat bookmark: ${error.message}</p>`;
    }
  },
};

export default BookmarkPage;