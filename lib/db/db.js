'use strict';

var mongoose = require('mongoose');

module.exports = {
  connect: connect
};

function connect(callback) {
  mongoose.connect('mongodb://localhost:27017/anp', function(err) {
    if (err) {
      console.error(err + ' Mongoose error');
      return process.exit(1);
    }
    console.log('Data base connected on port: ' + 27017);
    callback();

  });
}
