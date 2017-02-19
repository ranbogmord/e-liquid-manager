const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, default: null, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tagSchema.methods.isValid = function () {
  if (!this.name) {
    return "Name is required";
  }

  return true;
};

module.exports = mongoose.model('Tag', tagSchema);
