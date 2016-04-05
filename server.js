var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();

var informationRoute = require('./lib/information/information-routes')();

app.use(cors({
  origin: "*"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/api/v1', informationRoute);

app.listen(8008, function() {
  console.log('Example app listening on port 3000!');
});
