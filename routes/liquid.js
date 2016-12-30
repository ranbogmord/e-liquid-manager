const models = require('../models');
const statistics = require('../lib/statistics');
const async = require('async');

module.exports = app => {
  app.io.route('liquid', {
    list(req) {
      models.Liquid.find({
        author: req.handshake.user._id
      }).populate('flavours.flavour').populate('comments').exec((err, liquids) => {
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
        }),
        author: req.handshake.user._id
      });

      liquid.save(err => {
        if (err) {
          return req.io.respond({
            error: err
          });
        }

        statistics.calculateFlavourAverage((err, results) => {
          if (err) return false;

          async.each(results, (item, callback) => {
            models.Flavour.findOne({
              _id: item._id
            }, (err, flavour) => {
              if (err) return callback(err);
              if (!flavour) return;

              flavour.basePercent = Math.round(item.value.avg * 100) / 100 || 0;

              flavour.save(err => {
                if (err) return callback(err);

                req.io.emit('flavour:updated', flavour);
                return callback(null);
              });
            });
          }, err => {
            if (err) {
              console.error(new Error(err));
            }
          });
        });

        models.Liquid.populate(liquid, {
          path: 'flavours.flavour'
        }, (err, liquid) => {
          if (err) return;
          req.io.emit('liquid:created', liquid);
          req.io.respond(liquid);
        });
      });
    },
    update(req) {
      const data = req.data;

      if (!data._id) {
        return req.io.respond({
          error: "Missing _id"
        });
      }

      models.Liquid.findOne({
        _id: data._id
      }, (err, liquid) => {
        if (err) return req.io.respond({error: err});
        if (!liquid) return req.io.respond({error: 'Invalid liquid'});

        liquid = Object.assign(liquid, {
          name: data.name,
          base: {
            nicStrength: (data.base || {}).nicStrength
          },
          target: {
            pgPercent: (data.target || {}).pgPercent,
            vgPercent: (data.target || {}).vgPercent,
            nicStrength: (data.target || {}).nicStrength
          },
          flavours: (data.flavours || []).filter(f => { return !!f && f.perc > 0; }).map(f => {
            if (typeof f.flavour == 'object') {
              f.flavour = f.flavour._id
            }

            return f;
          }),
        });

        liquid.save(err => {
          if (err) {
            return req.io.respond({
              error: err
            });
          }

          statistics.calculateFlavourAverage((err, results) => {
            if (err) return false;

            async.each(results, (item, callback) => {
              models.Flavour.findOne({
                _id: item._id
              }, (err, flavour) => {
                if (err) return callback(err);
                if (!flavour) return;

                flavour.basePercent = (Math.round(item.value.avg * 100) / 100) || 0;

                flavour.save(err => {
                  if (err) return callback(err);

                  req.io.emit('flavour:updated', flavour);
                  return callback(null);
                });
              });
            }, err => {
              if (err) console.error(new Error(err));
            });
          });

          models.Liquid.populate(liquid, {
            path: 'flavours.flavour'
          }, (err, liquid) => {
            if (err) return;
            req.io.emit('liquid:updated', liquid);
            req.io.respond(liquid);
          });
        });
      })
    }
  });
};
