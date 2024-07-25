const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { db } = require('./data');
const passwordUtils = require('../lib/passwordUtils');

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return done(null, false);
      }
      const user = result.rows[0];
      const isValid = passwordUtils.validPassword(password, user.hash, user.salt);
      if (isValid) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});
