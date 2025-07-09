/**
 * This file is a conceptual refactoring for use with a Relational Database (RDB).
 * It simulates two separate tables: 'posts' and 'files', linked by a foreign key.
 * This router is not connected to the main application.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

// --- In-memory data stores simulating RDB tables ---
// Simulates the 'Posts' table
let posts = [];
// Simulates the 'Files' table
let files = [];

let nextPostId = 1;
let nextFileId = 1;
// ----------------------------------------------------

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.ensureDirSync(uploadDir);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const newFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage });

/**
 * [C] Create a new post and associate multiple files with it.
 * This simulates creating a row in 'Posts' and multiple rows in 'Files'.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.post('/', upload.array('files', 10), (req, res) => {
  const { title, description } = req.body;
  const uploadedFiles = req.files;

  if (!title || !description || !uploadedFiles || uploadedFiles.length === 0) {
    return res
      .status(400)
      .json({ error: 'Title, description, and at least one file are required.' });
  }

  // 1. Create the main post entry (INSERT INTO Posts ...)
  const newPost = {
    id: nextPostId++,
    title,
    description,
    downloads: 0,
  };
  posts.push(newPost);

  // 2. Create file metadata entries linked to the post (INSERT INTO Files ...)
  const createdFileMetadata = uploadedFiles.map((file) => {
    const newFile = {
      id: nextFileId++,
      postId: newPost.id, // Foreign Key
      fileName: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
    files.push(newFile);
    return newFile;
  });

  // Respond with the created post, including its associated files
  res.status(201).json({ ...newPost, files: createdFileMetadata });
});

/**
 * [R] Get all posts, joining them with their respective files.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.get('/', (req, res) => {
  // Simulate a JOIN operation
  const postsWithFiles = posts.map((post) => {
    const associatedFiles = files.filter((file) => file.postId === post.id);
    return { ...post, files: associatedFiles };
  });
  res.json(postsWithFiles);
});

/**
 * [R] Get a single post by ID, joining it with its files.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.get('/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Download post not found.' });
  }

  // Find associated files
  const associatedFiles = files.filter((file) => file.postId === postId);
  res.json({ ...post, files: associatedFiles });
});

/**
 * [U] Update a post's metadata by ID. (File manipulation would be a separate endpoint)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.put('/:id', (req, res) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Download post not found.' });
  }

  const { title, description } = req.body;
  post.title = title || post.title;
  post.description = description || post.description;

  res.json(post);
});

/**
 * [D] Delete a post by ID and all its associated files.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.delete('/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Download post not found.' });
  }

  // 1. Find all files to be deleted from the filesystem
  const filesToDelete = files.filter((file) => file.postId === postId);

  // 2. Delete the actual files from disk
  filesToDelete.forEach((file) => {
    fs.remove(file.path, (err) => {
      if (err) console.error(`Failed to delete file: ${file.path}`, err);
    });
  });

  // 3. Delete the records from the "tables"
  posts.splice(postIndex, 1); // DELETE FROM Posts WHERE id = ...
  files = files.filter((file) => file.postId !== postId); // DELETE FROM Files WHERE post_id = ...

  res.status(204).send();
});

module.exports = router;
