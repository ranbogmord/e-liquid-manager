const authorization = require('../lib/authorization');
const models = require('../models');
const moment = require('moment');

module.exports = app => {
  app.param('lid', (req, res, next, id) => {
    models.Liquid.findById(id, (err, liquid) => {
      if (err) return res.status(500).send('Internal Server Error');
      if (!liquid) return res.status(404).send('Liquid not found');

      if (liquid.author.toString() != req.user._id.toString()) {
        return res.status(404).send('Liquid not found');
      }

      req.liquid = liquid;
      next();
    })
  });

  app.param('slid', (req, res, next, id) => {
    models.ShareLink.findById(id).populate({
      path: 'liquid'
    }).exec((err, shareLink) => {
      if (err) return res.status(500).send('Internal Server Error');
      if (!shareLink) return res.status(404).send('Link not found');

      if (shareLink.expiry) {
        let exp = moment(shareLink.expiry);

        if (!exp.isValid() || exp.isBefore(moment())) {
          return res.status(404).send('Link not found');
        }
      }

      req.shareLink = shareLink;
      next();
    });
  });

  app.get('/share/create/:lid', authorization.isAuthenticated, (req, res) => {
    const shareLink = new models.ShareLink({
      liquid: req.liquid
    });

    if (req.query.expiry) {
      let exp = moment(req.query.expiry);

      if (!exp.isValid()) {
        return res.status(400).json({
          error: 'Invalid date'
        });
      }

      shareLink.expiry = exp.toDate();
    }

    shareLink.save(err => {
      if (err) return res.status(500).send("Internal Server Error");

      return res.json(shareLink);
    });
  });

  app.get('/share/:slid', (req, res) => {
    const params = {
      liquid: req.shareLink.liquid.toJSON()
    };

    if (req.isAuthenticated()) {
      params.user = req.user;
    }

    return res.render('share/index', params);
  });
};
