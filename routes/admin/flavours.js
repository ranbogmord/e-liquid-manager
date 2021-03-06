const router = module.exports = require('express').Router();
const authorization = require('../../lib/authorization');
const models = require('../../models');
const async = require('async');
const Promise = require('promise');

const getFormData = (req) => {
  return new Promise((resolve, reject) => {
    Promise.all([
      models.User.find({}, null, {sort: "username"}),
      models.FlavourVendor.find({}, null, {sort: 'name'})])
    .then(values =>  {
      let users = values[0].map(user => {
        user = user.toJSON();
        user.selected = user._id.toString() == req.requestedFlavour.addedBy;
        return user;
      });

      let vendors = values[1].map(vendor => {
        vendor = vendor.toJSON();
        vendor.selected = vendor._id.toString() == (req.requestedFlavour.vendor || {})._id;
        return vendor;
      });

      return resolve(users, vendors);
    })
    .catch(err => {
      return resolve([], []);
    });
  });
};

const validateFlavourBody = (params) => {
  return (req, res, next) => {
    const body = req.body;

    if (!params.validate || !params.validate(body)) {
      getFormData(req)
      .then((users, vendors) => {
        return res.render(params.template, {
          form: {
            action: req.originalUrl,
            submitValue: params.submitValue,
            error: params.error,
            users: users,
            vendors: vendors,
          },
          flavour: {
            name: body.name
          }
        });
      });
    } else {
      next();
    }
  };
};

router.param('fid', (req, res, next, id) => {
  models.Flavour.findById(id).populate('vendor').then((flavour) => {
    if (!flavour) return res.status(404).send('Flavour not found');

    req.requestedFlavour = flavour;
    next();
  })
  .catch(err => {
    return res.status(500).send('Internal server error');
  });
});

router.get('/', (req, res) => {
  models.Flavour.find({}, null, {sort: 'name'}).populate('addedBy').populate('vendor').exec((err, flavours) => {
    if (err) return res.status(500).send('Internal server error');

    return res.render('admin/flavour/list', {
      flavours: flavours
    })
  });
});

router.get('/:fid', (req, res) => {
  async.parallel({
    users: (callback) => {
      models.User.find({}, null, {sort: 'username'}).exec((err, users) => {
        if (err) users = [];

        users = users.map((user) => {
          user = user.toJSON();
          user.selected = user._id.toString() == req.requestedFlavour.addedBy;
          return user;
        });

        callback(null, users);
      });
    },
    vendors: (callback) => {
      models.FlavourVendor.find({}, null, {sort: 'name'})
      .then((vendors) => {
        vendors = vendors.map((vendor) => {
          vendor = vendor.toJSON();
          vendor.selected = vendor._id.toString() == (req.requestedFlavour.vendor || {})._id;
          return vendor;
        });

        callback(null, vendors);
      })
      .catch((err) => {
        callback(null, []);
      });
    }
  }, (err, results) => {
    return res.render('admin/flavour/edit', {
      form: {
        action: req.originalUrl,
        submitValue: 'Save',
        users: results.users,
        vendors: results.vendors
      },
      flavour: req.requestedFlavour
    });
  });
});

router.post('/:fid', validateFlavourBody({
  template: 'admin/flavour/edit',
  submitValue: 'Save',
  error: 'Name is required',
  validate(body) {
    return !!body.name;
  }
}), (req, res) => {
  const body = req.body;

  req.requestedFlavour.name = body.name;
  req.requestedFlavour.addedBy = body.addedBy || null;
  req.requestedFlavour.vendor = body.vendor || null;

  req.requestedFlavour.save((err) => {
    if (err) return res.status(500).send('Internal server error');

    return res.redirect('/admin/flavours');
  });
});

router.post('/:fid/delete', (req, res) => {
  req.requestedFlavour.remove((err) => {
    if (err) return res.status(500).send('Internal server error');

    return res.redirect('/admin/flavours');
  });
});
