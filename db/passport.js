const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const prisma = require('../prisma');
const passwordUtils = require('../lib/passwordUtils');

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return done(null, false);
      }
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
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
