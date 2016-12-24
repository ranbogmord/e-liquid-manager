process.chdir(__dirname);
require('dotenv').config();

// Load dependencies
const express = require('express.io');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('./models');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passportIO = require('passport.socketio');

// Connect to mongo
mongoose.connect(process.env.MONGODB_URL);

// Setup session store
const sessionStore = new RedisStore({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  client: redis.createClient()
});

// Setup app
const app = express().http().io();
app.use(express.static(path.join(__dirname, 'public/assets')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "Veronica!",
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));

app.io.set('authorization', passportIO.authorize({
  cookieParser: cookieParser,
  key: 'connect.sid',
  secret: process.env.SESSION_SECRET || "Veronica!",
  store: sessionStore
}));

// User authentication
passport.use(new LocalStrategy((username, password, done) => {
  models.User.findOne({
    $or: [
      {username: username},
      {email: username}
    ]
  }, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false);

    user.verifyPassword(password, (err, res) => {
      if (err) return done(err);
      if (!res) return done(null, false);

      return done(null, user);
    });
  });
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((uid, done) => {
  models.User.findOne({
    _id: uid
  }, (err, user) => {
    if (err) return done(err, false);
    if (!user) return done(null, false);

    return done(null, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

// Load routes
fs.readdirSync(path.join(__dirname, 'routes')).forEach(r => {
  // Only handle .js files
  if (r.substr(-3) !== '.js') {
    return;
  }

  // Load the route
  const route = require(path.join(__dirname, 'routes', r));
  if (typeof route !== 'function') { // Check if route exports a function
    return;
  }

  route(app); // Initialize route
});

// Start application
app.listen(process.env.NODE_PORT, () => {
  console.log(`App running on port ${process.env.NODE_PORT}`);
});
