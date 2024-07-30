const express = require('express');
const router = express.Router();
const passport = require('passport');
const passwordUtils = require('../lib/passwordUtils');
const { messages } = require('../db/data');
const middleware = require('./middleware');
const prisma = require('../prisma');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get('/', async (req, res) => {
  try {
    const messagesList = await messages();
    res.render('index', { messages: messagesList });
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login-failure',
    successRedirect: '/login-success',
  })
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.log('Error : Failed to destroy the session during logout.', err);
      }
      req.user = null;
      res.redirect('/');
    });
  });
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, membership } = req.body;
    const { salt, hash } = passwordUtils.genPassword(password);
    await prisma.user.create({
      data: { username, membership: !!membership, hash, salt },
    });
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

router.get('/login-success', (req, res) => {
  res.render('login-success');
});

router.get('/login-failure', (req, res) => {
  res.render('login-failure');
});

router.get('/dashboard', middleware.isAuthenticated, async (req, res, next) => {
  try {
    const messagesList = await messages();
    res.render('dashboard', { messages: messagesList });
  } catch (err) {
    next(err);
  }
});

router.get('/post', middleware.isAuthenticated, (req, res) => {
  res.render('createPost');
});

router.post('/post', async (req, res, next) => {
  try {
    const { title, message } = req.body;
    const creatorId = req.user.id;

    await prisma.message.create({
      data: {
        title,
        message,
        creator: {
          connect: { id: creatorId },
        },
      },
    });
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

router.get('/folders', middleware.isAuthenticated, async (req, res) => {
  const folders = await prisma.folder.findMany({ where: { userId: req.user.id } });
  res.render('folders', { folders });
});

router.post('/folders', middleware.isAuthenticated, async (req, res) => {
  const { name } = req.body;
  await prisma.folder.create({ data: { name, userId: req.user.id } });
  res.redirect('/folders');
});

router.get('/folders/:id', middleware.isAuthenticated, async (req, res) => {
  const folder = await prisma.folder.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { files: true },
  });
  res.render('folder', { folder });
});

router.get('/upload', middleware.isAuthenticated, async (req, res) => {
  const folders = await prisma.folder.findMany({ where: { userId: req.user.id } });
  res.render('upload', { folders });
});

router.post('/upload', middleware.isAuthenticated, upload.single('file'), async (req, res) => {
  const { filename, size } = req.file;
  const { folderId } = req.body;

  await prisma.file.create({
    data: {
      name: filename,
      url: `/uploads/${filename}`,
      size,
      folderId: parseInt(folderId),
    },
  });

  res.redirect(`/folders/${folderId}`);
});

router.get('/files/:id', middleware.isAuthenticated, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('file', { file });
});

router.get('/files/:id/download', middleware.isAuthenticated, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
  res.download(`uploads/${file.name}`);
});

router.post('/folders/:id/share', middleware.isAuthenticated, async (req, res) => {
  const { duration } = req.body;
  const folderId = parseInt(req.params.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

  const sharedFolder = await prisma.sharedFolder.create({
    data: { folderId, expiresAt },
  });

  res.json({ shareUrl: `${req.protocol}://${req.get('host')}/share/${sharedFolder.id}` });
});

router.get('/share/:id', async (req, res) => {
  const sharedFolder = await prisma.sharedFolder.findUnique({
    where: { id: req.params.id },
    include: { folder: { include: { files: true } } },
  });

  if (!sharedFolder || sharedFolder.expiresAt < new Date()) {
    return res.status(404).send('Shared folder not found or expired');
  }

  res.render('sharedFolder', { folder: sharedFolder.folder });
});

router.post('/upload', middleware.isAuthenticated, upload.single('file'), async (req, res) => {
  const { filename, path, size } = req.file;
  const { folderId } = req.body;

  try {
    const result = await cloudinary.uploader.upload(path);

    await prisma.file.create({
      data: {
        name: filename,
        url: result.secure_url,
        size,
        folderId: parseInt(folderId),
      },
    });

    res.redirect(`/folders/${folderId}`);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Upload failed');
  }
});

module.exports = router;
