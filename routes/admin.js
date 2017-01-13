const path = require('path');
const passport = require('passport');
const authorization = require('../lib/authorization');
const models = require('../models');
const statistics = require('../lib/statistics');

const validateUserBody = (params) => {
  return (req, res, next) => {
    const body = req.body;

    if (!params.validate || !params.validate(body)) {
      return res.render(params.template, {
        form: {
          action: req.originalUrl,
          submitValue: params.submitValue,
          error: params.error
        },
        user: {
          username: body.username,
          email: body.email,
          role: body.role || "user"
        }
      });
    }

    next();
  };
};

const validateFlavourBody = (params) => {
  return (req, res, next) => {
    const body = req.body;

    if (!params.validate || !params.validate(body)) {
      return res.render(params.template, {
        form: {
          action: req.originalUrl,
          submitValue: params.submitValue,
          error: params.error
        },
        flavour: {
          name: body.name
        }
      });
    }

    next();
  };
};

module.exports = app => {
  app.param('uid', (req, res, next, id) => {
    models.User.findById(id, (err, user) => {
      if (err) return res.status(500).send('Internal server error');
      if (!user) return res.status(404).send('User not found');

      req.requestedUser = user;
      next();
    });
  });

  app.param('fid', (req, res, next, id) => {
    models.Flavour.findById(id, (err, flavour) => {
      if (err) return res.status(500).send('Internal server error');
      if (!flavour) return res.status(404).send('Flavour not found');

      req.requestedFlavour = flavour;
      next();
    });
  });

  app.get('/admin', authorization.isAdmin, (req, res) => {
    models.User.find({}).count().exec((err, userCount) => {
      models.Flavour.find({}).count().exec((err, flavourCount) => {
        return res.render('admin/index', {
          userCount,
          flavourCount
        });
      });
    });
  });

  app.get('/admin/users', authorization.isAdmin, (req, res) => {
    models.User.find({}, null, {sort: 'username'}, (err, users) => {
      if (err) return res.status(500).send('Internal server error');

      return res.render('admin/user-list', {
        users: users
      });
    });
  });

  app.get('/admin/users/new', authorization.isAdmin, (req, res) => {
    return res.render('admin/new-user', {
      form: {
        action: '/admin/users/new',
        submitValue: 'Create'
      },
      user: {
        role: 'user'
      }
    });
  });

  app.post('/admin/users/new', authorization.isAdmin, validateUserBody({
    template: 'admin/new-user',
    submitValue: 'Create',
    error: 'All fields are required',
    validate(body) {
      return body.username && body.email && body.password && body.role;
    }
  }), (req, res) => {
    const body = req.body;

    const user = new models.User(body);

    user.save((err) => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect(`/admin/users/${user._id}`);
    });
  });

  app.get('/admin/users/:uid', authorization.isAdmin, (req, res) => {
    return res.render('admin/edit-user', {
      form: {
        action: '/admin/users/' + req.requestedUser._id,
        submitValue: 'Save'
      },
      user: req.requestedUser
    })
  });

  app.post('/admin/users/:uid', authorization.isAdmin, validateUserBody({
    template: 'admin/edit-user',
    submitValue: 'Save',
    error: 'Username, email and role are required',
    validate(body) {
      return body.username && body.email && body.role;
    }
  }), (req, res) => {
    const body = req.body;

    req.requestedUser = Object.assign(req.requestedUser, {
      username: body.username,
      email: body.email,
      role: body.role
    });

    if (body.password) {
      req.requestedUser.password = body.password;
    }

    req.requestedUser.save((err) => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect('/admin/users');
    })
  });

  app.post('/admin/users/:uid/delete', authorization.isAdmin, (req, res) => {
    req.requestedUser.remove((err) => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect('/admin/users');
    });
  });

  app.get('/admin/flavours', authorization.isAdmin, (req, res) => {
    models.Flavour.find({}, null, {sort: 'name'}, (err, flavours) => {
      if (err) return res.status(500).send('Internal server error');

      return res.render('admin/flavour-list', {
        flavours: flavours
      })
    })
  });

  app.get('/admin/flavours/:fid', authorization.isAdmin, (req, res) => {
    return res.render('admin/edit-flavour', {
      form: {
        action: req.originalUrl,
        submitValue: 'Save'
      },
      flavour: req.requestedFlavour
    });
  });

  app.post('/admin/flavours/:fid', authorization.isAdmin, validateFlavourBody({
    template: 'admin/edit-flavour',
    submitValue: 'Save',
    error: 'Name is required',
    validate(body) {
      return !!body.name;
    }
  }), (req, res) => {
    const body = req.body;

    req.requestedFlavour.name = body.name;

    req.requestedFlavour.save((err) => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect('/admin/flavours');
    });
  });

  app.post('/admin/flavours/:fid/delete', authorization.isAdmin, (req, res) => {
    req.requestedFlavour.remove((err) => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect('/admin/flavours');
    });
  });

  app.get('/admin/statistics/popular-flavours', authorization.isAdmin, (req, res) => {
    statistics.getMostPopularFlavours((err, result) => {
      if (err) return res.status(500).end();

      return res.json(result.slice(0, 9));
    })
  });
};
