'use strict';

var informationModel = require('../information-model');

module.exports = function() {
  var promise = new Promise(function(resolve, reject) {
    informationModel.find({}, {
      _id: 0,
      __v: 0
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
