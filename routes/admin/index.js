const router = module.exports = require('express').Router();
const models = require('../../models');

router.use('/users', require('./users'));
router.use('/flavours', require('./flavours'));
router.use('/flavourvendors', require('./flavourvendors'));
router.use('/statistics', require('./statistics'));

router.get('/', (req, res) => {
  models.User.find({}).count().exec((err, userCount) => {
    models.Flavour.find({}).count().exec((err, flavourCount) => {
      return res.render('admin/index', {
        userCount,
        flavourCount
      });
    });
  });
});

