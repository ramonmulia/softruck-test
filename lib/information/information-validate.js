"use strict";

module.exports = function(req, res, next) {
  var state = req.params.state;
  if (!state) {
    return res.state(400).send({
      msg: 'Invalid is required.'
    });
  }

  next();
};
