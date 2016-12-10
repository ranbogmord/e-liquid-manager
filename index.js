process.chdir(__dirname);
require('dotenv').config();

// Load dependencies
const express = require('express.io');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to mongo
mongoose.connect(process.env.MONGODB_URL);

// Setup app
const app = express();
app.http().io();
app.use(express.static(path.join(__dirname, 'public/assets')));

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
