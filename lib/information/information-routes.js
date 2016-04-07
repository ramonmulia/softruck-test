"use strict";

var express = require('express'),
  router = express.Router(),
  informationCtrl = require('./information-controller');

module.exports = function() {
  router.get('/informations', informationCtrl.get);
  router.get('/informations/state/:state', informationCtrl.getByStateOnDb, informationCtrl.getByStateCrawler);
  router.get('/informations/city/:city', informationCtrl.getDetailsByCity);
  return router;
};
