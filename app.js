const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const router = require('./routes/router');
const passport = require('passport');
const db = require('./db/data');
require('./db/passport');

const app = express();

app.use(
  session({
    store: new pgSession({
      pool: db,
      tableName: 'session',
    }),
    secret: 'lol', // Use an environment variable for the secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);

const PORT = 3000;
app.listen(PORT, () => console.log(`Express listening on port ${PORT}`));
