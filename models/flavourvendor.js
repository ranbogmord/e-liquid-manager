const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const s = new Schema({
  name: { type: String, required: true },
  abbr: { type: String, required: true },
  enabled: {type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

s.methods.isValid = function () {
  if (!this.name) {
    return "Name is required";
  } else if (!this.abbr) {
    return "Abbreviation is required";
  }

  return true;
};

module.exports = mongoose.model('FlavourVendor', s);
