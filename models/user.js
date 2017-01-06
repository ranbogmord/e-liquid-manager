const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});

userSchema.methods.verifyPassword = function (pass, cb) {
  bcrypt.compare(pass, this.password, cb);
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) next();

  bcrypt.hash(this.password, null, null, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

module.exports = mongoose.model('User', userSchema);
