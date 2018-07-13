'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * My Schema
 */
var MySchema = new Schema({
  // the height of the well in feet
  h: Number, 
  // the distance in feet that the snail can climb during the day
  u: Number, 
  // the distance in feet that the snail slides down during the night
  d: Number, 
  // the fatigue factor expressed as a percentage
  f: Number, 
  // string indicating whether the snail succeeded (left the well) 
  // or failed (slid back to the bottom) and on what day
  result: String, 
  // bollean indicating whether the snail succeeded or failed
  success: Boolean, 
  // total distance of the snail that has climbed
  climbed: Number, 
  // number of days of the snail either leave the well 
  // or slide back to the bottom of the well
  days: Number, 
  // creation date
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Snail', MySchema);
