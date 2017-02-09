const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Promise = require('promise');

const liquidSchema = new Schema({
  name: { type: String, required: true },
  base: {
    nicStrength: { type: Number, required: true }
  },
  target: {
    pgPercent: { type: Number, required: true },
    vgPercent: { type: Number, required: true },
    nicStrength: { type: Number, required: true }
  },
  flavours: [
    new Schema({
      flavour: { type: Schema.Types.ObjectId, ref: 'Flavour', required: true },
      perc: { type: Number, required: true }
    })
  ],
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

liquidSchema.statics.findPopulatedByAuthor = function (author) {
  if (author._id) {
    author = author._id;
  }

  return this.find({
    author: author
  }, null, {
    sort: 'name'
  })
  .populate('author')
  .populate('flavours.flavour')
  .populate({
    path: 'comments',
    populate: {
      path: 'author'
    },
    options: {
      sort: {
        createdAt: 'desc'
      }
    }
  });
};

liquidSchema.statics.findPopulatedById = function (liquid) {
  if (liquid._id) liquid = liquid._id;

  return this.findById(liquid)
  .populate('author')
  .populate('flavours.flavour')
  .populate({
    path: 'comments',
    populate: {
      path: 'author'
    },
    options: {
      sort: {
        createdAt: 'desc'
      }
    }
  });
};

module.exports = mongoose.model('Liquid', liquidSchema);
