require('dotenv').config();
const statistics = require('./lib/statistics');
const mongoose = require('mongoose');
const models = require('./models');
const async = require('async');

mongoose.connect(process.env.MONGODB_URL);

console.log("Generating averages");
statistics.calculateFlavourAverage((err, results) => {
  if (err) throw err;
  if (!results) throw new Error("Failed to calculate averages");

  async.each(results, (item, callback) => {
    models.Flavour.findOne({
      _id: item._id
    }, function (err, flavour) {
      if (err) return callback(err);
      if (!flavour) return;

      if (item.value.avg) {
        flavour.basePercent = Math.round(item.value.avg * 100) / 100;
      } else {
        flavour.basePercent = 0;
      }


      flavour.save(err => {
        if (err) return callback(err);

        console.log(flavour.name, flavour.basePercent);
        callback(null);
      });
    });
  }, err => {
    if (err) throw err;
    console.log("done");
    process.exit();
  });
});
