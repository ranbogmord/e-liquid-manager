const models = require('../models');

module.exports = app => {
  app.io.route('flavour', {
    list(req) {
      models.Flavour.find({}).exec((err, flavours) => {
        if (err) {
          return req.io.respond({
            error: 'Failed to fetch flavours'
          });
        }

        return req.io.respond(flavours);
      });
    },
    create(req) {
      const flavour = new models.Flavour({
        name: req.data.name,
        basePercent: req.data.basePercent,
        isVg: req.data.isVg || false,
        addedBy: req.handshake.user._id
      });

      flavour.save(err => {
        if (err) {
          return req.io.respond({
            error: err
          });
        }

        app.io.broadcast('flavour:created', flavour);
        return req.io.respond(flavour);
      });
    }
  })
};
