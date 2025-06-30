import StoryDatabase from '../../data/database';

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
      const savedStories = await StoryDatabase.getAllStories();

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
            <button class="btn-delete-story" aria-label="Hapus story">🗑 Hapus</button>
          </div>
        `;

        // Tombol hapus
        const deleteBtn = card.querySelector('.btn-delete-story');
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmDelete = confirm(`Yakin ingin hapus story dari ${story.name}?`);
          if (!confirmDelete) return;

          await StoryDatabase.deleteStory(story.id);
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
