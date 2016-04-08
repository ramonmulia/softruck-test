"use strict";

var services = require('./services');

module.exports = {
  get: get,
  getByStateOnDb: getByStateOnDb,
  getByStateCrawler: getByStateCrawler,
  getDetailsByCity: getDetailsByCity
};

function getDetailsByCity(req, res) {
  var city = req.params.city,
    state = req.params.state;
  services.getDetailsByCity(state, city)
    .then(function(result) {
      res.status(200).send(result);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(err.status || 500).send(err.message || '');
    });
}

function get(req, res) {
  services.getAllInformations()
    .then(function(result) {
      res.status(200).send(result);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(err.status || 500).send(err.message || '');
    });
}

function getByStateOnDb(req, res, next) {
  console.time('TOTAL_GET_TIME');
  var state = req.params.state;

  services.getInformationByState(state)
    .then(function(result) {
      if (result) {
        console.timeEnd('TOTAL_GET_TIME');
        return res.status(200).send(result);
      }
      next();
    })
    .catch(function(err) {
      console.error(err);
      console.timeEnd('TOTAL_GET_TIME');
      return res.status(err.status || 500).send(err.message || '');
    });
}

function getByStateCrawler(req, res) {
  console.time('TOTAL_CRAWLER_TIME');
  var state = req.params.state;

  services.goCrawlerAnp(state)
    .then(function(result) {
      console.timeEnd('TOTAL_CRAWLER_TIME');
      return res.status(200).send(result);
    })
    .catch(function(err) {
      console.error(err);
      console.timeEnd('TOTAL_CRAWLER_TIME');
      return res.status(err.status || 500).send(err.message || '');
    });
}
