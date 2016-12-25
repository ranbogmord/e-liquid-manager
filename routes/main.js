const path = require('path');
const passport = require('passport');

function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  next();
}

module.exports = app => {
  app.get('/', isAuthenticated, (req, res) => {
    return res.sendfile(path.join(__dirname, '../public/index.html'));
  });

  app.get('/login', (req, res) => {
    return res.render('login');
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
  }), (req, res) => {
    return res.redirect('/');
  });

  app.get('/logout', isAuthenticated, (req, res) => {
    req.logout();

    return res.redirect('/login');
  });

  app.get('/me', isAuthenticated, (req, res) => {
    const user = req.user;

    return res.render('me/me', {
      email: user.email
    });
  });

  app.post('/me', isAuthenticated, (req, res) => {
    const user = req.user;

    user.email = req.body.email;

    if (req.body.password && req.body.password != '') {
      user.password = req.body.password;
    }

    user.save(err => {
      if (err) return res.status(500).send('Failed to save user');

      return res.redirect('/me');
    });
  });
};
