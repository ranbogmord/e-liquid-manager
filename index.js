process.chdir(__dirname);
require('dotenv').config();

// Load dependencies
const express = require('express');
const Server = require('http').Server;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('./models');
const passport = require('passport');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passportUtils = require('./lib/passport-utils');
const _ = require('lodash');

mongoose.Promise = require('promise');
// Connect to mongo
mongoose.connect(process.env.MONGODB_URL);

// Setup session store
const sessionStore = session({
  secret: process.env.SESSION_SECRET || "Veronica!",
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    client: redis.createClient()
  })
});

// Setup app
const app = express();
const server = Server(app);
const io = require('socket.io')(server);

// Configure app
app.use(express.static(path.join(__dirname, 'public/assets')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Session setup
io.use((socket, next) => {
  sessionStore(socket.request, socket.request.res, next);
});
io.use((socket, next) => {
  let uid = _.get(socket, 'request.session.passport.user');
  if (uid) {
    passportUtils.deserializeUser(uid, (err, user) => {
      if (err) return next(err);
      if (!user) return next(new Error('Invalid user'));

      socket.request.user = user;
      next();
    });
  } else {
    next();
  }
});
app.use(sessionStore);

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'public/views'));

// HTTP logging
if (process.env.HTTP_LOG_FILE) {
  try {
    const stats = fs.statSync(process.env.HTTP_LOG_FILE);
  } catch (ex) {
    fs.writeFileSync(process.env.HTTP_LOG_FILE, '');
  }

  const stream = fs.createWriteStream(process.env.HTTP_LOG_FILE);

  app.use(require('morgan')(process.env.HTTP_LOG_FORMAT || 'combined', {
    stream: stream
  }));
} else {
  app.use(require('morgan')('combined'));
}

// User authentication
passportUtils.setup(passport);
app.use(passport.initialize());
app.use(passport.session());

// Load routes
fs.readdirSync(path.join(__dirname, 'routes')).forEach(r => {
  // Only handle .js files
  if (r.substr(-3) !== '.js') {
    return;
  }

  if (r.indexOf('socketroutes') !== -1) {
    return;
  }

  // Load the route
  const route = require(path.join(__dirname, 'routes', r));
  if (typeof route !== 'function') { // Check if route exports a function
    return;
  }

  route(app); // Initialize route
});

// Setup websockets
io.on('connection', (socket) => {
  require('./routes/socketroutes')(io, socket);
});

// setTimeout(() => {
  // Start application
  server.listen(process.env.NODE_PORT, () => {
    console.log(`App running on port ${process.env.NODE_PORT}`);
  });
// }, 5000);
