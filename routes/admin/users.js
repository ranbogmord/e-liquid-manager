const router = module.exports = require('express').Router();
const authorization = require('../../lib/authorization');
const models = require('../../models');

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

router.param('uid', (req, res, next, id) => {
  models.User.findById(id, (err, user) => {
    if (err) return res.status(500).send('Internal server error');
    if (!user) return res.status(404).send('User not found');

    req.requestedUser = user;
    next();
  });
});

router.get('/', (req, res) => {
  models.User.find({}, null, {sort: 'username'}, (err, users) => {
    if (err) return res.status(500).send('Internal server error');

    return res.render('admin/user/list', {
      users: users
    });
  });
});

router.get('/new', (req, res) => {
  return res.render('admin/user/new', {
    form: {
      action: req.originalUrl,
      submitValue: 'Create'
    },
    user: {
      role: 'user'
    }
  });
});

router.post('/new', validateUserBody({
  template: 'admin/user/new',
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

router.get('/:uid', (req, res) => {
  return res.render('admin/user/edit', {
    form: {
      action: req.originalUrl,
      submitValue: 'Save'
    },
    user: req.requestedUser
  })
});

router.post('/:uid', validateUserBody({
  template: 'admin/user/edit',
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

router.post('/:uid/delete', (req, res) => {
  req.requestedUser.remove((err) => {
    if (err) return res.status(500).send('Internal server error');

    return res.redirect('/admin/users');
  });
});
