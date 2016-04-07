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
        resolve(buildObject(result));
      }
    });
  });

  return promise;
};

function buildObject(result) {
  return result.map(function(item) {
    var cities = item.cities.map(function(item) {
      return {
        name: item.name,
        statistics: item.statistics,
        stations: item.stations
      };
    });
    return {
      name: item.name,
      cities: cities,
      dates: item.dates
    };
  });
}
