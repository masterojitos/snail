'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
  Schema = mongoose.Schema,
  bcrypt = require('bcryptjs'),
  _ = require('lodash');

/**
 * Validations
 */

// If you are authenticating by any of the oauth strategies, don't validate.
var validatePresenceOf = function(value) {
  return (this.provider && this.provider !== 'local') || (value && value.length);
};

var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User');
  User.find({ email: value, _id: { $ne: this._id } }, function(err, user) {
    callback(err || user.length === 0);
  });
};

var validateUniqueUsername = function(value, callback) {
  var User = mongoose.model('User');
  User.find({ username: value, _id: { $ne: this._id } }, function(err, user) {
    callback(err || user.length === 0);
  });
};

/**
 * Getter
 */
var escapeProperty = function(value) {
  return _.escape(value);
};

/**
 * My Schema
 */
var MySchema = new Schema({
  name: {
    type: String,
    get: escapeProperty
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email address.'],
    validate: [validateUniqueEmail, 'Email address is already in-use.']
  },
  username: {
    type: String,
    unique: true,
    required: false,
    match: [/^[-\w\.]{4,50}$/, 'Please enter a valid username.'],
    validate: [validateUniqueUsername, 'Username is already in-use.']
  },
  password: {
    type: String,
    validate: [validatePresenceOf, 'Password cannot be blank.']
  },
  provider: {
    type: String,
    default: 'local'
  },
  photo: String,
  facebook: String,
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  status: {
    type: Boolean,
    default: true
  },
});

/**
 * Pre-save hook
 */
MySchema.pre('save', function(next) {
  var user = this;
  user.updated = new Date();
  if (user.provider === 'local' && user.password && !user.password.length) {
    return next(new Error('Invalid password.'));
  }
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

/**
 * Methods
 */
MySchema.methods.comparePassword = function(password, done) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    done(err, isMatch);
  });
};

module.exports = mongoose.model('User', MySchema);
