'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  jwt = require('jwt-simple'),
  moment = require('moment');

/**
 * Exports.
 */
var Utils = {};
module.exports = Utils;

/**
 * Login Required Middleware
 */
Utils.ensureAuthenticated = function (req, res, next) {
  if (!req.header('Authorization')) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header.' });
  }
  var token = req.header('Authorization').split(' ')[1];

  var payload = null;
  try {
    payload = jwt.decode(token, config.TOKEN_SECRET);
  }
  catch (err) {
    return res.status(401).send({ message: err.message });
  }

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.sub;
  next();
};
