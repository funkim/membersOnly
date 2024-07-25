const express = require('express');
const router = express.Router();
const passport = require('passport');
const passwordUtils = require('../lib/passwordUtils');
const { db, messages } = require('../db/data');
const middleware = require('./middleware');

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
    await db.query('INSERT INTO users (username, membership, hash, salt) VALUES ($1, $2, $3, $4)', [username, membership, hash, salt]);
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

router.get('/login-success', (req, res) => {
  res.send('<p>You successfully logged in. --> <a href="/dashboard">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res) => {
  res.send('You entered the wrong password.');
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
    const creator = req.user.username;
    const timestamp = Math.floor(Date.now() / 1000);
    await db.query('INSERT INTO messages (title, message, timestamp, creator) VALUES ($1, $2, $3, $4)', [title, message, timestamp, creator]);
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
