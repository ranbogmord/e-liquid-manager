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
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  next_version: { type: Schema.Types.ObjectId, ref: 'Liquid' }
});

liquidSchema.statics.findPopulatedByAuthor = function (author, ignoreVersions = false) {
  if (author._id) {
    author = author._id;
  }

  let finders = {
    author: author,
    deletedAt: null
  };

  if (!ignoreVersions) {
    finders.next_version = null;
  }

  return this.find(finders, null, {
    sort: 'name'
  })
  .populate('author')
  // .populate('flavours.flavour')
  .populate({
    path: 'flavours.flavour',
    populate: {
      path: 'vendor'
    }
  })
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
  .populate({
    path: 'flavours.flavour',
    populate: {
      path: 'vendor'
    }
  })
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
