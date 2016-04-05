"use strict";

var express = require('express'),
  router = express.Router(),
  informationCtrl = require('./information-controller'),
  informationValidate = require('./information-validate');

module.exports = function() {
  router.get('/information', informationCtrl.get);
  router.get('/information/state/:state', informationValidate, informationCtrl.getByState);
  return router;
};
