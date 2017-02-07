const router = module.exports = require('express').Router();
const models = require('../../models');

router.param('fvid', (req, res, next, id) => {
  models.FlavourVendor.findOne({
    _id: id
  })
  .then((vendor) => {
    if (!vendor) return res.status(404).send("Vendor not found");
    req.requestedVendor = vendor;
    next();
  })
  .catch((err) => {
    return res.status(500).send("Internal server error");
  });
});

router.get('/', (req, res) => {
  models.FlavourVendor.find({})
  .then((vendors) => {
    return res.render('admin/vendor/list', {
      vendors: vendors
    });
  })
  .catch((err) => {
    return res.status(500).send('Internal server error');
  });
});

router.get('/new', (req, res) => {
  return res.render('admin/vendor/new', {
    form: {
      action: req.originalUrl,
      users: null,
      submitValue: "Create"
    },
    vendor: new models.FlavourVendor()
  });
});

router.post('/new', (req, res) => {
  const body = req.body;
  const user = req.user;

  body.addedBy = user._id;
  body.enabled = !!body.enabled;

  const vendor = new models.FlavourVendor(body);

  const valid = vendor.isValid();
  if (valid === true) {
    vendor.save((err) => {
      if (err) return res.status(500).send("Internal server error");

      return res.redirect("/admin/flavourvendors");
    });
  } else {
    return res.render('admin/vendor/new', {
      vendor: vendor,
      form: {
        action: req.originalUrl,
        users: null,
        error: valid,
        submitValue: "Create"
      }
    });
  }
});

router.get('/:fvid', (req, res) => {
  models.User.find({}, (err, users) => {
    if (err) users = [];

    users = users.map((user) => {
      user = user.toJSON();
      user.selected = user._id.toString() == req.requestedVendor.addedBy;
      return user;
    });

    return res.render('admin/vendor/edit', {
      form: {
        action: req.originalUrl,
        users: users,
        submitValue: 'Save'
      },
      vendor: req.requestedVendor
    });
  });
});

router.post('/:fvid', (req, res) => {
  const body = req.body;

  req.requestedVendor.name = body.name;
  req.requestedVendor.abbr = body.abbr;
  req.requestedVendor.enabled = !!body.enabled;

  if (body.addedBy) {
    req.requestedVendor.addedBy = body.addedBy;
  }

  const valid = req.requestedVendor.isValid();
  if (valid === true) {
    req.requestedVendor.save(err => {
      if (err) return res.status(500).send("Internal server error");

      return res.redirect('/admin/flavourvendors');
    });
  } else {
    models.User.find({}, (err, users) => {
      if (err) users = [];

      users = users.map((user) => {
        user = user.toJSON();
        user.selected = user._id.toString() == req.requestedVendor.addedBy;
        return user;
      });

      return res.render('admin/vendor/edit', {
        form: {
          action: req.originalUrl,
          users: users,
          submitValue: 'Save',
          error: valid
        },
        vendor: req.requestedVendor
      });
    });
  }
});

router.post('/:fvid/delete', (req, res) => {
  req.requestedVendor.remove((err) => {
    if (err) return res.status(500).send('Internal server error');

    return res.redirect('/admin/flavourvendors');
  });
});
