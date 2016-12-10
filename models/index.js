const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const models = {};
const files = fs.readdirSync(__dirname);

files.forEach(f => {
  if (path.basename(__filename) == f) {
    return;
  }

  const m = require(`./${f}`);

  if (!_.get(m, 'base.Mongoose', false)) {
    return;
  }

  models[_.get(m, 'modelName', '')] = m;
});

module.exports = models;
