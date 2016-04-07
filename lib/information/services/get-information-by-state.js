'use strict';

var informationModel = require('../information-model');

module.exports = function(state) {
  var promise = new Promise(function(resolve, reject) {
    var query = {
      name: state
    };

    informationModel.findOne(query, {
      _id: 0,
      __v: 0,
      'cities.station': 0
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  return promise;
};
