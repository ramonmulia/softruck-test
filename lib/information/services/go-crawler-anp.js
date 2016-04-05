'use strict';

var Crawler = require('crawler'),
  request = require('request'),
  async = require('async');

module.exports = function(state) {
  var promise = new Promise(function(resolve, reject) {

    var response = [];

    getValuesFromAnp()
      .then(function(anpValues) {
        return buildPayLoad(anpValues, state);
      })
      .then(doRequest)
      .then(convertResponse)
      .then(function(details) {
        response.push({
          name: state,
          cities: details
        });

        resolve(response);
      })
      .catch(function(err) {
        reject(err);
      });
  });

  return promise;
};

function convertResponse(resultsHtml) {
  var promise = new Promise(function(resolve, reject) {
    var city = [];
    var c = new Crawler({
      callback: function(error, result, $) {
        $('a[class="linkpadrao"]').each(function(index, item) {
          city.push({
            name: $(item).text(),
            statitics: [],
            stations: []
          });
        });
      },
      onDrain: function() {
        resolve(city);
      }
    });

    var arrayHtml = resultsHtml.map(function(item) {
      return {
        html: item
      };
    });

    c.queue(arrayHtml);
  });

  return promise;
}

function buildResponseObject(city) {

}

function buildPayLoad(anpValues, state) {
  var promise = new Promise(function(resolve, reject) {
    var stateValue = anpValues.states.filter(item => item.name.toLowerCase() === state.toLowerCase())[0];
    var arrayPayload = [];
    if (stateValue) {
      anpValues.fuelTypes.forEach(function(item) {
        arrayPayload.push({
          selSemana: anpValues.week,
          selEstado: stateValue.value,
          selCombustivel: item.value
        });
      });
      resolve(arrayPayload);
    } else {
      reject('Invalid state');
    }
  });

  return promise;
}

function doRequest(arrayPayload) {
  var promise = new Promise(function(resolve, reject) {
    var requestOptions = {
      method: 'post',
      url: 'http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp'
    };

    async.map(arrayPayload, function(payload, callback) {
      requestOptions.form = payload;
      request(requestOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          callback(null, body);
        } else {
          callback(error || response.statusCode);
        }
      });
    }, function(err, results) {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });

  return promise;
}

function getValuesFromAnp() {
  var promise = new Promise(function(resolve, reject) {
    var url = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp";
    var anpValues = {};

    var c = new Crawler({
      maxConnections: 10,
      callback: function(error, result, $) {
        if (error) {
          reject(error);
        } else {
          anpValues.states = getStatesAnp($);
          anpValues.fuelTypes = getFuelTypes($);
          anpValues.week = getWeek($);
        }
      },
      onDrain: function() {
        resolve(anpValues);
      }
    });
    c.queue(url);
  });

  return promise;
}

function getStatesAnp($) {
  var states = [];
  $('select[name="selEstado"] option').each(function(index, item) {
    states.push({
      name: $(item).text(),
      value: $(item).attr('value')
    });
  });
  return states;
}

function getFuelTypes($) {
  var fuelTypes = [];
  $('#selCombustivel option').each(function(index, item) {
    fuelTypes.push({
      value: $(item).attr('value'),
      name: $(item).text()
    });
  });
  return fuelTypes;
}

function getCaptcha($) {
  var captcha = '';
  captcha += $('#letra1').text();
  captcha += $('#letra2').text();
  captcha += $('#letra3').text();
  captcha += $('#letra4').text();
  return captcha;
}

function getWeek($) {
  var week = $('input[name="selSemana"]').val();
  return week;
}
