'use strict';

/**
 * Module dependencies.
 */
var async = require('async'),
  Snail = require('../models/snail');

/**
 * Exports.
 */
var Snails = {};
module.exports = Snails;

/**
 * Execute a new snail
 *
 * @property {string} req.body.h - the height of the well in feet
 * @property {string} req.body.u - the distance in feet that the snail can climb during the day
 * @property {string} req.body.d - the distance in feet that the snail slides down during the night
 * @property {string} req.body.f - the fatigue factor expressed as a percentage
 * @returns {Object} snail
 */
Snails.create = function (req, res) {
  // initialize data
  var snail = new Snail({
    h: req.body.h,
    u: req.body.u,
    d: req.body.d,
    f: req.body.f,
    result: '',
    climbed: 0,
    days: 1
  });

  var progress = 0; // daily progress of the snail
  var fatigue = snail.u * snail.f / 100; // fatigue factor that will be subtracted each day
  do {
    progress += snail.u - fatigue * (snail.days - 1); // fatigue is only subtracted since second day
    // store the climbed distance if the progress of the snail is greater than the current climb
    if (progress > snail.climbed) {
      snail.climbed = progress;
    }
    // store the success results if the snail left the well
    if (progress > snail.h) {
      snail.result = 'success on day ' + snail.days;
      snail.success = true;
      break;
    }
    progress -= snail.d; // otherwise, the snail slides down
    // store the failure results if the snail slid back to the bottom
    if (progress < 0) {
      snail.result = 'failure on day ' + snail.days;
      snail.success = false;
      break;
    }
    snail.days++; // otherwise, the snail continues one more day
  } while (true); // infinite bucle (conditionals and breaks are inside)

  // save the snail data
  snail.save(function(err, result) {
    if (err) {
      res.status(500).send({ message: err.message });
    }
    // remove unnecessary fields
    snail = snail.toObject();
    delete snail.__v;
    delete snail.success;
    delete snail.climbed;
    delete snail.days;
    res.send(snail);
  });
};

/**
 * @typedef {Object} Report
 * @property {Object[]} snail - list of snails
 * @property {Number} successes - total successes executions
 * @property {Number} failures - total failures executions
 * @property {Number} average_total_distance_climbed - average total distance climbed
 * @property {Number} average_time_success - average time for success
 * @property {Number} average_time_failure - average time for failure
 */

/**
 * Review past executions
 *
 * @returns {Report} snail report
 */
Snails.report = function (req, res) {
  Snail.find({}).lean().exec(function (err, snails) { // get the snails list
    if (err) {
      return res.status(400).send({ message: 'Couldn\'t list snails.' });
    }
    // initialize result object
    var result = {
      snails: snails,
      successes: 0,
      failures: 0,
      average_total_distance_climbed: 0,
      average_time_success: 0,
      average_time_failure: 0
    }
    async.each(snails, function(snail, callback) { // asynchronous loop
      if (snail.success) {
        result.successes++; // how many successful executions are there
        result.average_time_success += snail.days; // accumulate days of succeed executions
      } else {
        result.failures++; // how many failed executions are there
        result.average_time_failure += snail.days; // accumulate days of failed executions
      }
      result.average_total_distance_climbed += snail.climbed; // accumulate the maximum climbed distances of each execution
      callback();
    }, function(err) {
      // get the average of each accumulated field
      result.average_total_distance_climbed = parseFloat(result.average_total_distance_climbed / snails.length).toFixed(2);
      result.average_time_success = parseFloat(result.average_time_success / result.successes).toFixed(2);
      result.average_time_failure = parseFloat(result.average_time_failure / result.failures).toFixed(2);
      res.send(result);
    });
  });
};
