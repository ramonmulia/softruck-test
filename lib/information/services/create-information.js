'use strict';

var informationModel = require('../information-model'),
  getInformationService = require('./get-information-by-state');

module.exports = function(info) {
  var promise = new Promise(function(resolve, reject) {
    var information = new informationModel();
    information.name = info.name;
    information.cities = info.cities;
    information.dates = info.dates;
    information.save(information,
      function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
  });

  return promise;
};
