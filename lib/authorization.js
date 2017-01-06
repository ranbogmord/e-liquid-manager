module.exports = {
  isAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    next();
  },
  isAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/');
    }

    next();
  }
};
