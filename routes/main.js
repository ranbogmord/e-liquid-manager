const path = require('path');

module.exports = app => {
  app.get('/', (req, res) => {
    return res.sendfile(path.join(__dirname, '../public/index.html'));
  });
};
