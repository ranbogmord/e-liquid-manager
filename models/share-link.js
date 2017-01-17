const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shareLinkSchema = new Schema({
  liquid: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Liquid'
  },
  expires: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
