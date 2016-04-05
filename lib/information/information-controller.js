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
        informationServices.getCrawlerAnp(state)
          .then(function(result) {
            return res.status(200).send(result);
          })
          .catch(function(err) {
            return res.status(400).send({
              msg: err
            });
          });
      } else {
        return res.status(200).send(result);
      }
    })
    .catch(function(err) {
      return res.status(err.status).send(err.message);
    });
}
