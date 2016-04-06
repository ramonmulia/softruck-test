"use strict";

var services = require('./services');

var informationServices = {
  getCrawlerAnp: services.getCrawlerAnp,
  getInformationByState: services.getInformationByState
};

module.exports = {
  get: get,
  getByState: getByState
};

function get(req, res) {
  res.send();
}

function getByState(req, res) {
  var state = req.params.state;

  informationServices.getInformationByState(state)
    .then(function(result) {
      if (!result.length) {
        return informationServices.getCrawlerAnp(state);
      } else {
        return res.status(200).send(result);
      }
    })
    .then(function(result) {
      return res.status(200).send(result);
    })
    .catch(function(err) {
      console.log('Error: ', err);
      return res.status(err.status || 500).send(err.message || '');
    });
}
