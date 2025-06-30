import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';
const QUEUE_STORE = 'queued-stories';
const BOOKMARK_STORE = 'bookmarks';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Stories store
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const storyStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      storyStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
    
    // Queued stories store
    if (!db.objectStoreNames.contains(QUEUE_STORE)) {
      db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    }
    
    // Bookmarks store
    if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
      db.createObjectStore(BOOKMARK_STORE, { keyPath: 'id' });
    }
  },
});

const StoryDatabase = {
  // === STORIES CRUD ===
  async putStory(story) {
    const db = await dbPromise;
    return await db.put(STORE_NAME, story);
  },

  async getAllStories() {
    const db = await dbPromise;
    return await db.getAll(STORE_NAME);
  },

  async getStory(id) {
    const db = await dbPromise;
    return await db.get(STORE_NAME, id);
  },
//delete function
  async deleteStory(id) {
    const db = await dbPromise;
    return await db.delete(STORE_NAME, id);
  },

  async clearStories() {
    const db = await dbPromise;
    return await db.clear(STORE_NAME);
  },

  // === QUEUED STORIES (untuk offline) ===
  async queueStory(story) {
    const db = await dbPromise;
    const storyWithTimestamp = {
      ...story,
      queuedAt: new Date().toISOString()
    };
    return await db.add(QUEUE_STORE, storyWithTimestamp);
  },

  async getQueuedStories() {
    const db = await dbPromise;
    return await db.getAll(QUEUE_STORE);
  },

  async deleteQueuedStory(id) {
    const db = await dbPromise;
    return await db.delete(QUEUE_STORE, id);
  },

  async clearQueuedStories() {
    const db = await dbPromise;
    return await db.clear(QUEUE_STORE);
  },

  // === BOOKMARKS ===
  async addBookmark(story) {
    const db = await dbPromise;
    const bookmark = {
      ...story,
      bookmarkedAt: new Date().toISOString()
    };
    return await db.put(BOOKMARK_STORE, bookmark);
  },

  async getAllBookmarks() {
    const db = await dbPromise;
    return await db.getAll(BOOKMARK_STORE);
  },

  async deleteBookmark(id) {
    const db = await dbPromise;
    return await db.delete(BOOKMARK_STORE, id);
  },

  async isBookmarked(id) {
    const db = await dbPromise;
    const bookmark = await db.get(BOOKMARK_STORE, id);
    return !!bookmark;
  },

  async clearBookmarks() {
    const db = await dbPromise;
    return await db.clear(BOOKMARK_STORE);
  },

  // === UTILITY FUNCTIONS ===
  async getStorageInfo() {
    const db = await dbPromise;
    const stories = await db.getAll(STORE_NAME);
    const queued = await db.getAll(QUEUE_STORE);
    const bookmarks = await db.getAll(BOOKMARK_STORE);
    
    return {
      stories: stories.length,
      queuedStories: queued.length,
      bookmarks: bookmarks.length,
      totalItems: stories.length + queued.length + bookmarks.length
    };
  },

  async clearAllData() {
    const db = await dbPromise;
    await Promise.all([
      db.clear(STORE_NAME),
      db.clear(QUEUE_STORE),
      db.clear(BOOKMARK_STORE)
    ]);
    console.log('All database data cleared');
  }
};

export default StoryDatabase;