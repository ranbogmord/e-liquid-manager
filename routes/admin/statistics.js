const router = module.exports = require('express').Router();
const statistics = require('../../lib/statistics');

router.get('/popular-flavours', (req, res) => {
  statistics.getMostPopularFlavours((err, result) => {
    if (err) return res.status(500).end();

    return res.json(result.slice(0, 9));
  })
});
