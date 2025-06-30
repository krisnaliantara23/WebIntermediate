// PERBAIKAN: Tambahkan .js extension
import StoryDatabase from '../../data/database.js';

const SavedPage = {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Saved Stories</h1>
        <div id="savedList" class="stories-grid"></div>
      </section>
    `;
  },

  async afterRender() {
    const container = document.querySelector('#savedList');
    container.innerHTML = '';

    try {
      // PERBAIKAN: Gunakan getAllBookmarks() bukan getAllStories()
      const savedStories = await StoryDatabase.getAllBookmarks();

      if (savedStories.length === 0) {
        container.innerHTML = '<p class="no-stories">No saved stories found.</p>';
        return;
      }

      savedStories.forEach((story) => {
        const card = document.createElement('article');
        card.className = 'story-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');

        card.innerHTML = `
          <div class="story-image-container">
            <img src="${story.photoUrl}" alt="Story by ${story.name}" class="story-image" loading="lazy" />
            <div class="story-overlay">
              <span class="story-date">${new Date(story.createdAt).toLocaleDateString("id-ID", {
                year: "numeric", month: "short", day: "numeric"
              })}</span>
              ${story.bookmarkedAt ? `<span class="saved-date">Saved: ${new Date(story.bookmarkedAt).toLocaleDateString("id-ID")}</span>` : ''}
            </div>
          </div>
          <div class="story-content">
            <h3 class="story-author">👤 ${story.name}</h3>
            <p class="story-description">${story.description}</p>
            ${
              story.lat && story.lon
                ? `<p class="story-location">📍 Lat: ${story.lat}, Lon: ${story.lon}</p>`
                : ""
            }
            <button class="btn-delete-story" aria-label="Hapus story">🗑 Hapus dari Saved</button>
          </div>
        `;

        // Tombol hapus - hapus dari bookmarks bukan dari stories
        const deleteBtn = card.querySelector('.btn-delete-story');
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmDelete = confirm(`Yakin ingin hapus story dari ${story.name} dari saved stories?`);
          if (!confirmDelete) return;

          // PERBAIKAN: Hapus dari bookmark store, bukan story store
          await StoryDatabase.deleteBookmark(story.id);
          card.remove();

          if (!container.querySelector('.story-card')) {
            container.innerHTML = '<p class="no-stories">No saved stories left.</p>';
          }
        });

        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = `<p class="no-stories">Failed to load saved stories: ${error.message}</p>`;
    }
  },
};

export default SavedPage;