const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() }
});

module.exports = mongoose.model('Liquid', liquidSchema);
