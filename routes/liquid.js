const models = require('../models');

module.exports = app => {
  app.io.route('liquid', {
    list(req) {
      models.Liquid.find().populate('flavours.flavour').populate('comments').exec((err, liquids) => {
        if (err) {
          return req.io.respond({
            error: 'Failed to fetch liquids'
          });
        }

        return req.io.respond(liquids);
      });
    },
    create(req) {
      const data = req.data;

      const liquid = new models.Liquid({
        name: data.name,
        base: {
          nicStrength: (data.base || {}).nicStrength
        },
        target: {
          pgPercent: (data.target || {}).pgPercent,
          vgPercent: (data.target || {}).vgPercent,
          nicStrength: (data.target || {}).nicStrength
        },
        flavours: (data.flavours || []).filter(f => { return !!f }).map(f => {
          if (typeof f.flavour == 'object') {
            f.flavour = f.flavour._id
          }

          return f;
        })
      });

      liquid.save(err => {
        if (err) {
          return req.io.respond({
            error: err
          });
        }

        models.Liquid.populate(liquid, {
          path: 'flavours.flavour'
        }, (err, liquid) => {
          if (err) return;
          app.io.broadcast('liquid:created', liquid);
          req.io.respond(liquid);
        });
      });
    }
  });
};
