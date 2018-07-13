'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  jwt = require('jwt-simple'),
  _ = require('lodash'),
  moment = require('moment'),
  request = require('request'),
  User = require('../models/user');

/**
 * Exports.
 */
var Users = {};
module.exports = Users;

/**
 * Generate JSON Web Token
 *
 * @property {Object} user - the user who is logging
 * @returns {String} token - will be used for client authentication
 */
function createJWT(user) {
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

/**
 * @typedef {Object} Token
 * @property {String} token - will be used for client authentication
 */

/**
 * Login with email and password
 *
 * @property {string} req.body.email - the user's email
 * @property {String} req.body.password - the user's password
 * @returns {Token}
 */
Users.signin = function (req, res) {
  User.findOne({ email: req.body.email.toLowerCase() }, 'password', function(err, user) {
    if (err || !user) {
      return res.status(401).send({ message: 'Invalid email and/or password' });
    }
    user.comparePassword(req.body.password, function(err, isMatch) {
      if (!isMatch) {
        return res.status(401).send({ message: 'Invalid email and/or password' });
      }
      res.send({ token: createJWT(user) });
    });
  });
};

/**
 * Create an account with email and password
 *
 * @property {string} req.body.name - the user's name
 * @property {string} req.body.email - the user's email
 * @property {String} req.body.password - the user's password
 * @returns {Token}
 */
Users.signup = function (req, res) {
  User.findOne({ email: req.body.email.toLowerCase() }, function(err, existingUser) {
    if (existingUser) {
      return res.status(409).send({ message: 'Email is already taken' });
    }
    var user = new User({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      password: req.body.password
    });
    user.save(function(err, result) {
      if (err) {
        res.status(500).send({ message: err.message });
      }
      res.send({ token: createJWT(result) });
    });
  });
};

/**
 * Login with Facebook
 *
 * @property {string} req.body.code - an encrypted string unique to each login request
 * @property {string} req.body.clientId - the ID of your fb app, found in your app's dashboard
 * @property {String} req.body.redirectUri - the URL that you want to redirect the person logging in back to
 * @returns {Token}
 */
Users.facebook = function (req, res) {
  var fields = ['id', 'name', 'email', 'location', 'first_name', 'last_name', 'link'];
  var accessTokenUrl = 'https://graph.facebook.com/v2.11/oauth/access_token';
  var graphApiUrl = 'https://graph.facebook.com/v2.11/me?fields=' + fields.join(',');
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.FACEBOOK_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
    if (response.statusCode !== 200) {
      return res.status(500).send({ message: accessToken.error.message });
    }

    // Retrieve profile information about the current user.
    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: profile.error.message });
      }
      profile.accessToken = accessToken.access_token;
      if (req.header('Authorization')) {
        User.findOne({ facebook: profile.id }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
          }
          var token = req.header('Authorization').split(' ')[1];
          var payload = jwt.decode(token, config.TOKEN_SECRET);
          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.name = user.name || profile.name || profile.displayName || '';
            user.photo = user.photo || 'https://graph.facebook.com/v2.11/' + profile.id + '/picture?type=large';
            user.facebook = profile.id;
            user.save(function() {
              var token = createJWT(user);
              res.send({ token: token });
            });
          });
        });
      } else {
        // Create a new user account or return an existing one.
        User.findOne({ 
          $or: [{
            facebook: profile.id
          }, {
            email: profile.email
          }]
        }, function(err, existingUser) {
          if (existingUser && existingUser.facebook) {
            var token = createJWT(existingUser);
            return res.send({ token: token });
          } else if (existingUser) {
            user = existingUser;
            user.name = user.name || profile.name || profile.displayName || '';
            user.photo = user.photo || 'https://graph.facebook.com/v2.11/' + profile.id + '/picture?type=large';
            user.facebook = profile.id;
            user.save(function() {
              var token = createJWT(user);
              return res.send({ token: token });
            });
          } else {
            var user = new User({
              name: profile.name || profile.displayName || '',
              email: profile.email,
              photo: 'https://graph.facebook.com/v2.11/' + profile.id + '/picture?type=large',
              provider: 'facebook',
              facebook: profile.id
            });
            var username = _.escape(user.email.substring(0, user.email.indexOf('@'))).toLowerCase();
            var verifyUsername = function (counter) {
              user.username = username + String(counter);
              if (counter === '') counter = 1;
              user.save(function(error) {
                if (error && counter < 10) {
                  counter++;
                  verifyUsername(counter);
                } else if (error) {
                  return res.status(400).json({
                    error: 'Facebook failed, please contact with hello@domain.com.'
                  });
                } else {
                  var token = createJWT(user);
                  res.send({ token: token });
                }
              });
            };
            verifyUsername('');
          }
        });
      }
    });
  });
};

/**
 * Get user data
 *
 * @returns {Object} user - the user who is logged
 */
Users.me = function (req, res) {
  User.findById(req.user, function(err, user) {
    res.send(user);
  });
};

/**
 * Update user data
 */
Users.update = function (req, res) {
  User.findById(req.user, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User not found.' });
    }
    user.name = req.body.name.toLowerCase() || user.name;
    user.email = req.body.email.toLowerCase() || user.email;
    if (req.body.password && req.body.password !== '' && req.body.newPassword && req.body.newPassword !== '') {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (!isMatch) {
          return res.status(401).send({ message: 'Sorry, your password is invalid.' });
        }
        user.password = req.body.newPassword;
      });
    }
    user.save(function(err) {
      res.status(200).end();
    });
  });
};
