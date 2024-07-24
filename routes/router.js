const express = require('express');
const router = express.Router();
const passport = require('passport');
const passwordUtils = require('../lib/passwordUtils');
const db = require('../db/data');

router.get('/', (req, res) => res.render('index'));

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login-failure',
    successRedirect: '/login-success',
  })
);

router.post('/register', async (req, res, next) => {
  const { username, password, membership } = req.body;
  const { salt, hash } = passwordUtils.genPassword(password);

  try {
    await db.query('INSERT INTO users (username, membership, hash, salt) VALUES ($1, $2, $3, $4)', [username, membership, hash, salt]);
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
  res.render('register');
});

module.exports = router;
