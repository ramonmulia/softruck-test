'use strict';

var Crawler = require('crawler'),
  request = require('request'),
  async = require('async');

module.exports = function(state) {
  var promise = new Promise(function(resolve, reject) {

    getValuesFromAnp()
      .then(function(anpValues) {
        return payloadInfoCityPerFuel(anpValues, state);
      })
      .then(getInformationsPerCity)
      .then(buildStatisticsObject)
      .then(groupCities)
      .then(getInformationsOfStations)
      .then(buildStationsObject)
      .then(function(cities) {
        return buildHal(cities, state);
      })
      .then(function(hal) {
        resolve(hal);
      })
      .catch(function(err) {
        reject(err);
      });
  });

  return promise;
};

function groupCities(results) {
  var promise = new Promise(function(resolve, reject) {
    var uniqueCities = [],
      uniquePayloads = [];

    for (var i = 0; i < results.length; i++) {
      if (uniqueCities.indexOf(results[i].name) === -1) {
        uniqueCities.push(results[i].name);
      }
    }

    var cities = [];

    uniqueCities.forEach(function(item) {
      var cityatrr = results.filter(i => item === i.name),
        statitics = cityatrr.map(item => item.statitics),
        payloads = cityatrr.map(item => item.payload);

      cities.push({
        name: item,
        statistics: statitics,
        payloads: payloads,
        stations: []
      });
    });
    resolve(cities);
  });

  return promise;
}

function buildStationsObject(args) {
  var promise = new Promise(function(resolve, reject) {
    var resultsHtml = args[1],
      array = [],
      column,
      cities = args[0];

    var c = new Crawler({
      callback: function(error, result, $) {
        var table = $('#postos_nota_fiscal .table_padrao tr'),
          cityName = $('input[name="desc_municipio"]').val().toLowerCase();

        for (var i = 0; i < table.length; i++) {
          $(table[i + 1]).each(function(index, item) {
            column = $(item).find('td');
            array.push({
              name: $($(column)[0]).text(),
              address: $($(column)[1]).text(),
              area: $($(column)[2]).text(),
              flag: $($(column)[3]).text(),
              price: {
                type: $('input[name="desc_Combustivel"]').val(),
                sellPrice: $($(column)[4]).text(),
                buyPrice: $($(column)[5]).text(),
                saleMode: $($(column)[6]).text(),
                provider: $($(column)[7]).text(),
                date: $($(column)[8]).text()
              }
            });
          });
        }

        cities.forEach(function(item) {
          if (item.name.toLowerCase() == cityName) {
            item.stations.push(array);
          }
          delete item.payloads;
        });

        array = [];
        //atualiza a cidade
      },
      onDrain: function() {

        //console.log(array[0]);
        resolve(cities);
      }
    });

    c.queue(resultsHtml.map(function(item) {
      return {
        html: item
      };
    }));
  });

  return promise;
}

function getInformationsOfStations(cities) {
  var promise = new Promise(function(resolve, reject) {
    var requestOptions = {
        method: 'post',
        url: 'http://www.anp.gov.br/preco/prc/Resumo_Semanal_Posto.asp'
      },
      arrayPayload = [];

    cities.forEach(function(item) {
      item.payloads.forEach(function(payload) {
        arrayPayload.push(payload);
      });
    });

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
      resolve([cities, results]);
    });
  });

  return promise;
}

function buildHal(cities, state) {
  var promise = new Promise(function(resolve, reject) {
    var response = [],
      uniqueStations = [],
      estabelecimentos = [],
      prices = [];

    cities.forEach(function(city) {
      for (var i = 0; i < city.stations.length; i++) {
        city.stations.forEach(function(itemStation) {
          itemStation.forEach(function(station) {
            if (uniqueStations.indexOf(station.name) === -1) {
              uniqueStations.push(station.name);
            }
          });
        });
      }
      var getzulu = [],
        supera = [];
      uniqueStations.forEach(function(station) {
        var stations = city.stations.forEach(function(itemStation) {
          var stationFilter = itemStation.filter(function(filter) {
            return filter.name === station;
          });
          if (stationFilter.length) {
            getzulu.push(stationFilter[0]);

          }
        });
        if (getzulu.length) {
          supera.push(getzulu);
        }
        getzulu = [];
      });

      var eitcha = [];

      supera.forEach(function(itemGrouped) {
        itemGrouped.forEach(function(item) {
          prices.push(item.price);
          eitcha = {
            name: item.name,
            address: item.address,
            area: item.area,
            flag: item.flag
          };
        });
        eitcha.prices = prices;
        estabelecimentos.push(eitcha);

        prices = [];
      });
      city.stations = estabelecimentos;
      estabelecimentos = [];
    });

    response.push({
      name: state,
      cities: cities
    });

    resolve(response);
  });
  return promise;
}

function buildStatisticsObject(resultsHtml) {
  var promise = new Promise(function(resolve, reject) {
    var array = [],
      c = new Crawler({
        callback: function(error, result, $) {
          var size = $('.table_padrao tr').length,
            column, cityValue, cityName, type;
          for (var i = 0; i < size; i++) {
            $($('.table_padrao tr')[i + 3]).each(function(index, item) {
              column = $(item).find('td');
              cityValue = $(column[0]).find('a').attr('href');
              cityName = $(column[0]).find('a').text();
              type = $($('.tabela3 h3')[1]).text().split(' ')[4] + ($($('.tabela3 h3')[1]).text().split(' ')[5] === 'S10' ? ' ' + $($('.tabela3 h3')[1]).text().split(' ')[5] : '');

              array.push({
                name: $(column[0]).text(),
                payload: {
                  desc_Combustivel: type,
                  desc_municipio: cityName,
                  selMunicipio: cityValue.split("'")[1],
                  cod_semana: $('input[name="cod_semana"]').val(),
                  cod_combustivel: $('input[name="cod_combustivel"]').val(),
                },
                statitics: {
                  type: type,
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

    c.queue(resultsHtml.map(function(item) {
      return {
        html: item
      };
    }));
  });

  return promise;
}

function payloadInfoCityPerFuel(anpValues, state) {
  var promise = new Promise(function(resolve, reject) {
    var stateValue = anpValues.states.filter(item => item.name.toLowerCase() === state.toLowerCase())[0],
      arrayPayload = [];
    if (stateValue) {
      anpValues.fuelTypes.forEach(function(item) {
        arrayPayload.push({
          desc_Combustivel: item.name,
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

function getInformationsPerCity(arrayPayload) {
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
