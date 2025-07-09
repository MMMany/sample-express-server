const request = require('supertest');
const path = require('path');
const fs = require('fs-extra');
const { app } = require('../src/index');
const { connectDB, disconnectDB, getDb } = require('../src/db');

const TEST_UPLOAD_DIR = 'uploads_test';

// Set node environment to test
process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;

describe('Downloads API', () => {
  beforeAll(async () => {
    await connectDB();
    await fs.ensureDir(TEST_UPLOAD_DIR);
  });

  afterAll(async () => {
    await disconnectDB();
    await fs.remove(TEST_UPLOAD_DIR);
  });

  beforeEach(async () => {
    const db = getDb();
    await db.collection('downloads').deleteMany({});
    await db.collection('downloads-id-counters').deleteMany({});
    await fs.emptyDir(TEST_UPLOAD_DIR);
  });

  describe('POST /api/downloads', () => {
    it('should create a new post with files', async () => {
      const res = await request(app)
        .post('/api/downloads')
        .field('title', 'Test Post')
        .field('description', 'Test Description')
        .attach('files', Buffer.from('test file 1'), 'test1.txt')
        .attach('files', Buffer.from('test file 2'), 'test2.txt');

      expect(res.status).toBe(201);
      const post = res.body;
      expect(post).toHaveProperty('id', 1);
      expect(post).toHaveProperty('title', 'Test Post');
      expect(post.files).toHaveLength(2);
      expect(post.files[0].originalName).toBe('test1.txt');

      // Check if files were actually uploaded
      const uploadedFile = path.join(TEST_UPLOAD_DIR, post.files[0].fileName);
      expect(fs.existsSync(uploadedFile)).toBe(true);
    });
  });

  describe('GET /api/downloads', () => {
    it('should return all download posts', async () => {
      // Create a post first
      await request(app)
        .post('/api/downloads')
        .field('title', 'Test Post')
        .field('description', 'Test Description')
        .attach('files', Buffer.from('test file 1'), 'test1.txt');

      const res = await request(app).get('/api/downloads');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Test Post');
    });
  });

  describe('PUT /api/downloads/:id', () => {
    let initialPost;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/downloads')
        .field('title', 'Initial Title')
        .field('description', 'Initial Description')
        .attach('files', Buffer.from('file to keep'), 'keep.txt')
        .attach('files', Buffer.from('file to delete'), 'delete.txt');
      initialPost = res.body;
    });

    it('should update metadata, remove one file, and add a new one', async () => {
      const filesToKeep = JSON.stringify([initialPost.files[0]]); // keep.txt
      const newFilePath = path.join(__dirname, 'newfile.txt');
      await fs.writeFile(newFilePath, 'new file content');

      const res = await request(app)
        .put(`/api/downloads/${initialPost.id}`)
        .field('title', 'Updated Title')
        .field('description', 'Updated Description')
        .field('existingFiles', filesToKeep)
        .attach('files', newFilePath);

      expect(res.status).toBe(200);
      const updatedPost = res.body;

      // Check metadata
      expect(updatedPost.title).toBe('Updated Title');
      expect(updatedPost.files).toHaveLength(2);

      // Check files
      const filenames = updatedPost.files.map((f) => f.originalName);
      expect(filenames).toContain('keep.txt');
      expect(filenames).toContain('newfile.txt');
      expect(filenames).not.toContain('delete.txt');

      // Check filesystem
      const oldDeletedFilePath = path.join(TEST_UPLOAD_DIR, initialPost.files[1].fileName);
      expect(fs.existsSync(oldDeletedFilePath)).toBe(false); // delete.txt should be gone
      const keptFilePath = path.join(TEST_UPLOAD_DIR, initialPost.files[0].fileName);
      expect(fs.existsSync(keptFilePath)).toBe(true); // keep.txt should still be there
      const newUploadedFilePath = path.join(TEST_UPLOAD_DIR, updatedPost.files[1].fileName);
      expect(fs.existsSync(newUploadedFilePath)).toBe(true); // newfile.txt should exist

      await fs.remove(newFilePath); // clean up temp file
    });
  });

  describe('DELETE /api/downloads/:id', () => {
    it('should delete a post and its associated files', async () => {
      // 1. Create a post
      const createRes = await request(app)
        .post('/api/downloads')
        .field('title', 'To Be Deleted')
        .field('description', '...')
        .attach('files', Buffer.from('delete me'), 'deleteme.txt');
      const post = createRes.body;
      const fileToDeletePath = path.join(TEST_UPLOAD_DIR, post.files[0].fileName);
      expect(fs.existsSync(fileToDeletePath)).toBe(true);

      // 2. Delete the post
      const deleteRes = await request(app).delete(`/api/downloads/${post.id}`);
      expect(deleteRes.status).toBe(204);

      // 3. Verify deletion
      const getRes = await request(app).get(`/api/downloads/${post.id}`);
      expect(getRes.status).toBe(404);
      expect(fs.existsSync(fileToDeletePath)).toBe(false);
    });
  });
});
