const models = require('../models');
const statistics = module.exports = {
  calculateFlavourAverage(callback) {

    const o = {};

    o.map = function () {
      for (var i = 0; i < this.flavours.length; i++) {
        emit(this.flavours[i].flavour, this.flavours[i].perc);
      }
    };

    o.reduce = function (k, vals) {
      return {
        count: vals && vals.length > 0 ? vals.length : 0,
        sum: vals && vals.length > 0 ? Array.sum(vals) : 0
      };
    };

    o.finalize = function (k, val) {
      if (val.sum) {
        val.avg = val.count > 0 ? val.sum / val.count : 0;
      } else {
        val = {
          k: k,
          count: 1,
          sum: val,
          avg: val
        };
      }

      return val;
    };

    models.Liquid.mapReduce(o, (err, result) => {
      callback(err, result);
    });
  },
  getMostPopularFlavours(callback) {
    const o = {};

    o.map = function () {
      emit(this.name, 1);
    };

    o.reduce = function (k, value) {
      return {
        name: k,
        count: Array.sum(value)
      }
    };

    models.Flavour.mapReduce(o, (err, result) => {
      callback(err, result);
    });
  }
};
