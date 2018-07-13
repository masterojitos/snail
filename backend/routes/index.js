'use strict';

var express = require('express'),
  router = express.Router(),
  Utils = require('../controllers/utils'),
  Users = require('../controllers/users'),
  Snails = require('../controllers/snails');

router.post('/auth/signin', Users.signin);
router.post('/auth/signup', Users.signup);
router.post('/auth/facebook', Users.facebook);
router.get('/api/user', Utils.ensureAuthenticated, Users.me);
router.put('/api/user', Utils.ensureAuthenticated, Users.update);
router.post('/api/snail', Utils.ensureAuthenticated, Snails.create);
router.get('/api/snail', Utils.ensureAuthenticated, Snails.report);

module.exports = router;
