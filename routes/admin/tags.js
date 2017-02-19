const router = module.exports = require('express').Router();
const models = require('../../models');

router.param('tid', (req, res, next, tid) => {
  models.Tag.findById(tid).then(tag => {
    if (!tag) {
      return res.status(404).send('Tag not found');
    }

    req.requestedTag = tag;
    next();
  })
  .catch(err => {
    return res.status(500).send('Internal server error');
  })
});


router.get('/', (req, res) => {
  models.Tag.find({
    author: null
  })
  .then((tags) => {
    return res.render('admin/tags/index', {
      tags: tags
    });
  })
  .catch(err => {

  });
});

router.get('/new', (req, res) => {
  return res.render('admin/tags/new', {
    tag: new models.Tag(),
    form: {
      action: req.originalUrl,
      submitValue: "Create"
    }
  });
});

router.post('/new', (req, res) => {
  const tag = new models.Tag({
    name: req.body.name
  });

  const valid = tag.isValid();
  if (valid === true) {
    tag.save(err => {
      return res.redirect('/admin/tags');
    });
  } else {
    return res.render('admin/tags/new', {
      tag: tag,
      form: {
        error: valid,
        submitValue: 'Create',
        action: req.originalUrl
      }
    });
  }
});

router.get('/:tid', (req, res) => {
  return res.render('admin/tags/edit', {
    tag: req.requestedTag,
    form: {
      submitValue: "Save",
      action: req.originalUrl
    }
  })
});

router.post('/:tid', (req, res) => {
  req.requestedTag.name = req.body.name;

  const valid = req.requestedTag.isValid();
  if (valid === true) {
    req.requestedTag.save(err => {
      if (err) return res.status(500).send('Internal server error');

      return res.redirect('/admin/tags');
    });
  } else {
    return res.render('admin/tags/edit', {
      tag: req.requestedTag,
      form: {
        submitValue: 'Save',
        action: req.originalUrl,
        error: valid
      }
    });
  }
});

router.post('/:tid/delete', (req, res) => {
  req.requestedTag.remove(err => {
    if (err) return res.status(500).send('Internal server error');

    return res.redirect('/admin/tags');
  });
});
