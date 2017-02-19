const path = require('path');
const passport = require('passport');
const authorization = require('../lib/authorization');
const models = require('../models');

module.exports = app => {
  app.get('/', authorization.isAuthenticated, (req, res) => {
    return res.render('app/index');
  });

  app.get('/login', (req, res) => {
    return res.render('login');
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
  }), (req, res) => {
    return res.redirect('/');
  });

  app.get('/logout', authorization.isAuthenticated, (req, res) => {
    req.logout();

    return res.redirect('/login');
  });

  app.get('/me', authorization.isAuthenticated, (req, res) => {
    const user = req.user;

    return res.render('me/me', {
      email: user.email
    });
  });

  app.post('/me', authorization.isAuthenticated, (req, res) => {
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

  app.get('/tags/ajax', (req, res) => {
    models.Tag.find({
      name: new RegExp(req.query.q, "i")
    }).then(tags => {
      return res.json({
        items: tags.map((t) => {
          return {
            label: t.name,
            value: t._id
          };
        })
      });
    })
    .catch(err => {
      return res.json({
        items: []
      });
    });
  });
};
