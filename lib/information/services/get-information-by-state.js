'use strict';

module.exports = function(state) {
  var promise = new Promise(function(resolve, reject) {
    resolve([]);
  });

  return promise;
};
