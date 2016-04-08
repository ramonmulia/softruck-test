var express = require('express');
var morgan = require("morgan");
var cors = require('cors');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
var db = require('./lib/db/db');
var app = express();
var informationRoute = require('./lib/information/information-routes')();

app.use(timeout(120000000));
app.use(morgan());
app.use(cors({
  origin: "http://localhost:3000"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use('/api/v1', informationRoute);
app.listen(8008, function() {
  db.connect(function() {
    console.log('Server listening on port: 8008');
  });
});
