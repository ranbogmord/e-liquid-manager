const models = require('../models');
const statistics = require('../lib/statistics');
const async = require('async');
const _ = require('lodash');

module.exports = (io, socket) => {
  async function updatePreviousLiquid(oldId, newId) {
    let liq = await models.Liquid.findOne({
      _id: oldId
    });

    if (!liq) {
      return new Error('Old liquid not found');
    }

    liq.next_version = newId;

    let err = await liq.save();
    if (err) {
      return err;
    }

    return liq;
  }

  async function calculateFlavourStatistics() {
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

    return true;
  }


  socket.on('liquid:list', (data, respond) => {
    models.Liquid.findPopulatedByAuthor(socket.request.user._id, data.ignoreVersions)
    .then(liquids => {
      return respond(liquids);
    })
    .catch(err => {
      return respond({
        error: 'Failed to fetch liquids'
      });
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
      flavours: (data.flavours || []).filter(f => { return !!f && f.perc > 0; }).map(f => {
        if (typeof f.flavour == 'object') {
          f.flavour = f.flavour._id
        }

        return f;
      }),
      author: socket.request.user._id,
      next_version: data.next_version || null
    });

    liquid.save(err => {
      if (err) {
        return respond({
          error: err
        });
      }

      let tasks = [calculateFlavourStatistics()];
      if (data.prev_version) {
        tasks.push(updatePreviousLiquid(data.prev_version, liquid._id));
      }

      Promise.all(tasks)
      .then(function (results) {
        if (results[1]) {
          socket.emit('liquid:archived', results[1]);
        }

        models.Liquid.findPopulatedById(liquid._id)
        .then(liquid => {
          if (!liquid) {
            return respond({
              error: 'Failed to create liquid'
            });
          }

          socket.emit('liquid:created', liquid);
          respond(liquid);
        })
        .catch(err => {
          return respond({
            error: "Failed to create liquid"
          });
        });
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
        next_version: data.next_version
      });

      liquid.save(err => {
        if (err) {
          return respond({
            error: err
          });
        }

        calculateFlavourStatistics();

        models.Liquid.findPopulatedById(liquid._id)
        .then(liquid => {
          if (!liquid) {
            return respond({
              error: 'Failed to update liquid'
            });
          }

          socket.emit('liquid:updated', liquid);
          respond(liquid);
        })
        .catch(err => {
          return respond({
            error: "Failed to update liquid"
          });
        });
      });
    });
  });

  socket.on('liquid:archive', (data, respond) => {
    if (!data._id) {
      return respond();
    }

    models.Liquid.findById(data._id)
    .then((liq) => {
      liq.deletedAt = Date.now();

      liq.save(err => {
        if (err) return respond({error: err});

        socket.emit('liquid:archived', liq);
        return respond(liq);
      });
    });
  });

  socket.on('flavour:list', (respond) => {
    models.Flavour.find({})
    .populate('vendor')
    .exec((err, flavours) => {
      if (err) {
        return respond({
          error: 'Failed to fetch flavours'
        });
      }

      flavours = flavours.map(f => {
        if (!f.vendor) {
          f.vendor = {};
        }

        return f;
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

      if (flavour.vendor) {
        return flavour.populate('vendor', function () {
          io.emit('flavour:created', flavour);
          return respond(flavour);
        });
      } else {
        io.emit('flavour:created', flavour);
        return respond(flavour);
      }
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
  });

  socket.on('comment:create', (data, respond) => {
    if (!data.liquid) {
      return respond({
        error: "Missing liquid"
      });
    }

    models.Liquid.findById(data.liquid).then(liquid => {
      if (!liquid) {
        return respond({
          error: "Invalid liquid"
        });
      }

      let comment = new models.Comment(data);
      comment.author = socket.request.user._id;

      const isValid = comment.isValid();
      if (isValid === true) {
        comment.save(err => {
          if (err) {
            return respond({
              error: err.message
            });
          }

          if (!_.isArray(liquid.comments)) {
            liquid.comments = [];
          }

          comment.liquid = liquid;
          comment.author = socket.request.user;

          liquid.comments.push(comment._id);
          liquid.save(err => {
            if (err) {
              return respond({
                error: err.message
              });
            }

            return respond(comment);
          });
        });
      } else {
        return respond({
          error: isValid
        })
      }
    })
    .catch(err => {
      return respond(err.message);
    });
  });

  socket.on('comment:delete', (data, respond) => {
    if (!data.comment) {
      return respond({
        error: "Missing comment"
      });
    }

    if (data.comment._id) {
      data.comment = data.comment._id;
    }

    models.Comment.findById(data.comment)
    .then(comment => {
      if (!comment) {
        return respond({
          error: "Invalid comment"
        });
      }

      if (comment.author.toString() !== socket.request.user._id.toString()) {
        return respond({
          error: "You're not allowed to remove this comment"
        });
      }

      comment.remove(err => {
        if (err) {
          return respond({
            error: err.message
          });
        }

        return respond({
          success: true
        });
      });
    })
    .catch(err => {
      return respond({
        error: err.message
      });
    });
  });
};
