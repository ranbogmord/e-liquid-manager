const path = require('path');
const passport = require('passport');
const authorization = require('../lib/authorization');
const models = require('../models');

module.exports = app => {
  app.param('uid', (req, res, next, id) => {
    models.User.findById(id, (err, user) => {
      if (err) return res.status(500).send('Internal server error');
      if (!user) return res.status(404).send('User not found');

      req.requestedUser = user;
      next();
    });
  });

  app.param('fid', (req, res, next, id) => {
    models.Flavour.findById(id, (err, flavour) => {
      if (err) return res.status(500).send('Internal server error');
      if (!flavour) return res.status(404).send('Flavour not found');
    });
  });

  app.get('/admin', (req, res) => {
    return res.render('admin/index');
  });

  app.get('/admin/users', (req, res) => {
    return res.render('admin/user-list');
  });

  app.post('/admin/users', (req, res) => {

  });

  app.get('/admin/users/:uid', (req, res) => {

  });

  app.post('/admin/users/:uid', (req, res) => {

  });

  app.post('/admin/users/:uid/delete', (req, res) => {

  });

  app.get('/admin/flavours', (req, res) => {

  });

  app.get('/admin/flavours/:fid', (req, res) => {

  });

  app.post('/admin/flavours/:fid', (req, res) => {

  });

  app.post('/admin/flavours/:fid/delete', (req, res) => {

  });
};
