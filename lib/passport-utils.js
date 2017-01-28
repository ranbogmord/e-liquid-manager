const models = require('../models');
const LocalStrategy = require('passport-local').Strategy;

const passportUtils = {
  serializeUser(user, done) {
    done(null, user._id);
  },
  deserializeUser(uid, done) {
    models.User.findOne({
      _id: uid
    }, (err, user) => {
      if (err) return done(err, false);
      if (!user) return done(null, false);

      return done(null, user);
    });
  }
};

passportUtils["setup"] = (pass) => {
  pass.use(new LocalStrategy((username, password, done) => {
    models.User.findOne({
      $or: [
        {username: username},
        {email: username}
      ]
    }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);

      user.verifyPassword(password, (err, res) => {
        if (err) return done(err);
        if (!res) return done(null, false);

        return done(null, user);
      });
    });
  }));

  pass.serializeUser(passportUtils.serializeUser);
  pass.deserializeUser(passportUtils.deserializeUser);
};

module.exports = passportUtils;
