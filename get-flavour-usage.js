require('dotenv').config();
const statistics = require('./lib/statistics');
const mongoose = require('mongoose');
const models = require('./models');
const async = require('async');

mongoose.connect(process.env.MONGODB_URL);


statistics.getMostPopularFlavours((err, result) => {
  console.log(result);
  process.exit();
});
