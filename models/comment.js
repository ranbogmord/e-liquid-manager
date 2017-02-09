const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  author: {type: Schema.Types.ObjectId, ref: "User", required: true},
  liquid: { type: Schema.Types.ObjectId, ref: "Liquid", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

commentSchema.methods.isValid = function () {
  return !!this.author && !!this.liquid && !!this.comment;
};

module.exports = mongoose.model('Comment', commentSchema);
