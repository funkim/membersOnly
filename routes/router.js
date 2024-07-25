const express = require('express');
const router = express.Router();
const passport = require('passport');
const passwordUtils = require('../lib/passwordUtils');
const db = require('../db/data');
const session = require('express-session');

router.get('/', (req, res) => res.render('index'));

router.get('/login', (req, res) => {
  res.render('login');
});
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login-failure',
    successRedirect: '/login-success',
    session: session,
  })
);

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  const { username, password, membership } = req.body;
  const { salt, hash } = passwordUtils.genPassword(password);

  try {
    await db.query('INSERT INTO users (username, membership, hash, salt) VALUES ($1, $2, $3, $4)', [username, membership, hash, salt]);
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

router.get('/login-success', (req, res, next) => {
  res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res, next) => {
  res.send('You entered the wrong password.');
});

module.exports = router;
