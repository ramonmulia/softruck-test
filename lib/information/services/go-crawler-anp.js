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

        var uniqueCities = details.getUnique();
        var cities = [];

        uniqueCities.forEach(function(item) {
          var cityatrr = details.filter(function(i) {
            return i.name === item;
          });

          var result = cityatrr.map(function(item) {
            return item.statitics;
          });

          cities.push({
            name: item,
            sttatics: result,
            stations: []
          });
        });

        response.push({
          name: state,
          cities: cities
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
    var arrayResp = [],
      array = [];
    var c = new Crawler({
      callback: function(error, result, $) {
        var size = $('.table_padrao tr').length;

        for (var i = 0; i < size; i++) {
          $($('.table_padrao tr')[i + 3]).each(function(index, item) {
            var column = $(item).find('td');
            array.push({
              name: $(column[0]).text(),
              statitics: {
                type: $($('.tabela3 h3')[1]).text().split(' ')[4] + ($($('.tabela3 h3')[1]).text().split(' ')[5] === 'S10' ? ' ' + $($('.tabela3 h3')[1]).text().split(' ')[5] : ''),
                consumerPrice: [{
                  averagePrice: $(column[2]).html(),
                  standardDeviation: $(column[3]).html(),
                  minPrice: $(column[4]).html(),
                  maxPrice: $(column[5]).html(),
                  averageMargin: $(column[6]).html()
                }],
                distributionPrice: [{
                  averagePrice: $(column[7]).html(),
                  standardDeviation: $(column[8]).html(),
                  minPrice: $(column[9]).html(),
                  maxPrice: $(column[10]).html()
                }]
              }
            });
          });
        }
      },
      onDrain: function() {
        resolve(array);
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

function getWeek($) {
  var week = $('input[name="selSemana"]').val();
  return week;
}

Array.prototype.getUnique = function() {
  var u = {},
    a = [];
  for (var i = 0, l = this.length; i < l; ++i) {
    if (u.hasOwnProperty(this[i].name)) {
      continue;
    }
    a.push(this[i].name);
    u[this[i].name] = 1;
  }
  return a;
};
