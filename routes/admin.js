const authorization = require('../lib/authorization');

module.exports = app => {
  app.use('/admin', authorization.isAdmin, require('./admin/index.js'));
};
