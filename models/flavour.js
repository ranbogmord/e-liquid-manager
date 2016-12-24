const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flavourSchema = new Schema({
  name: { type: String, required: true },
  basePercent: { type: String, required: true },
  isVg: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Flavour', flavourSchema);
