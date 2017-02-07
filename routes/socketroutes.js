const models = require('../models');
const statistics = require('../lib/statistics');
const async = require('async');

module.exports = (io, socket) => {
  socket.on('liquid:list', (respond) => {
    models.Liquid.find({
      author: socket.request.user._id
    }).populate('flavours.flavour').populate('comments').exec((err, liquids) => {
      if (err) {
        return respond({
          error: 'Failed to fetch liquids'
        });
      }

      return respond(liquids);
    });
  });

  socket.on('liquid:create', (data, respond) => {
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
      author: socket.request.user._id
    });

    liquid.save(err => {
      if (err) {
        return respond({
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

              io.emit('flavour:updated', flavour);
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
        socket.emit('liquid:created', liquid);
        respond(liquid);
      });
    });
  });

  socket.on('liquid:update', (data, respond) => {
    if (!data._id) {
      return respond({
        error: "Missing _id"
      });
    }

    models.Liquid.findOne({
      _id: data._id
    }, (err, liquid) => {
      if (err) return respond({error: err});
      if (!liquid) return respond({error: 'Invalid liquid'});

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
          return respond({
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

                io.emit('flavour:updated', flavour);
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
          socket.emit('liquid:updated', liquid);
          respond(liquid);
        });
      });
    });
  });

  socket.on('flavour:list', (respond) => {
    models.Flavour.find({}).populate('vendor').exec((err, flavours) => {
      if (err) {
        return respond({
          error: 'Failed to fetch flavours'
        });
      }

      flavours = flavours.map((flav) => {
        if (flav.vendor) {
          flav.name = flav.name + " " + flav.vendor.abbr;
        }

        return flav;
      });

      return respond(flavours);
    });
  });

  socket.on('flavour:create', (data, respond) => {
    const flavour = new models.Flavour({
      name: data.name,
      basePercent: 0,
      vendor: data.vendor || null,
      isVg: data.isVg || false,
      addedBy: socket.request.user._id
    });

    flavour.save(err => {
      if (err) {
        return respond({
          error: err
        });
      }

      io.emit('flavour:created', flavour);
      return respond(flavour);
    });
  });

  socket.on('vendors:list', (respond) => {
    models.FlavourVendor.find({
      enabled: true
    })
    .then((vendors) => {
      return respond(vendors);
    })
    .catch((err) => {
      return respond([]);
    })
  })
};
