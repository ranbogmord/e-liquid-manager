const path = require('path');
const passport = require('passport');

module.exports = app => {
  app.get('/', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    next();
  }, (req, res) => {
    return res.sendfile(path.join(__dirname, '../public/index.html'));
  });

  app.get('/login', (req, res) => {
    return res.sendfile(path.join(__dirname, '../public/login.html'));
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
  }), (req, res) => {
    console.log(req.session);
    return res.redirect('/');
  });
};
