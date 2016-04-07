'use strict';

var Crawler = require('crawler'),
  request = require('request'),
  async = require('async'),
  saveInformation = require('./create-information'),
  iconv = require('iconv-lite');

module.exports = function(state) {
  var promise = new Promise(function(resolve, reject) {

    var information = {};
    getValuesFromAnp()
      .then(function(anpValues) {
        information.dates = anpValues.dates;
        return payloadInfoCityPerFuel(anpValues, state);
      })
      .then(getInformationsPerCity)
      .then(buildStatisticsObject)
      .then(groupCities)
      .then(getInformationsOfStations)
      .then(buildStationsObject)
      .then(function(cities) {
        return buildHal(cities, state, information);
      })
      .then(saveInformation)
      .then(function(result) {
        resolve(result);
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
        statistics = cityatrr.map(item => item.statistics),
        payloads = cityatrr.map(item => item.payload);

      cities.push({
        name: item,
        statistics: statistics,
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
      cities = args[0],
      type;

    var c = new Crawler({
      callback: function(error, result, $) {
        var table = $('#postos_nota_fiscal .table_padrao tr'),
          cityName = $('input[name="desc_municipio"]').val().toLowerCase();

        for (var i = 0; i < table.length; i++) {
          $(table[i + 1]).each(function(index, item) {
            column = $(item).find('td');
            type = $('input[name="desc_Combustivel"]').val()
            array.push({
              name: $($(column)[0]).text(),
              address: $($(column)[1]).text(),
              area: $($(column)[2]).text(),
              flag: $($(column)[3]).text(),
              price: {
                type: type,
                sellPrice: formatToNumber($(column[4]).text()),
                buyPrice: formatToNumber($(column[5]).text()),
                saleMode: $(column[6]).text(),
                provider: type !== 'GLP' ? $(column[7]).text() : '',
                date: type !== 'GLP' ? $(column[8]).text() : $(column[7]).text()
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
      },
      onDrain: function() {
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

function formatToNumber(text) {
  if (text) {
    text = text.replace(',', '.');
  }
  return isNaN(text) ? null : parseFloat(text);
}

function getInformationsOfStations(cities) {
  var promise = new Promise(function(resolve, reject) {
    var requestOptions = {
        method: 'post',
        url: 'http://www.anp.gov.br/preco/prc/Resumo_Semanal_Posto.asp',
        encoding: null
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
        body = iconv.decode(body, 'ISO-8859-1');
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

function buildHal(cities, state, information) {
  var promise = new Promise(function(resolve, reject) {
    cities = formatCities(cities);
    information.name = state;
    information.cities = cities;
    resolve(information);
  });
  return promise;
}

function formatCities(cities) {
  var uniqueStations = [],
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

    var eitcha = [],
      pass = true;

    supera.forEach(function(itemGrouped) {
      itemGrouped.forEach(function(item) {
        prices.push(item.price);
        if (pass) {
          eitcha = {
            name: item.name,
            address: item.address,
            area: item.area,
            flag: item.flag
          };
          pass = false;
        }
      });
      eitcha.prices = prices;
      estabelecimentos.push(eitcha);
      pass = true;
      prices = [];
    });
    city.stations = estabelecimentos;
    estabelecimentos = [];
  });

  return cities;
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
                statistics: {
                  type: type,
                  consumerPrice: [{
                    averagePrice: formatToNumber($(column[2]).html()),
                    standardDeviation: formatToNumber($(column[3]).html()),
                    minPrice: formatToNumber($(column[4]).html()),
                    maxPrice: formatToNumber($(column[5]).html()),
                    averageMargin: formatToNumber($(column[6]).html())
                  }],
                  distributionPrice: [{
                    averagePrice: formatToNumber($(column[7]).html()),
                    standardDeviation: formatToNumber($(column[8]).html()),
                    minPrice: formatToNumber($(column[9]).html()),
                    maxPrice: formatToNumber($(column[10]).html())
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
      url: 'http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp',
      encoding: null
    };

    async.map(arrayPayload, function(payload, callback) {
      requestOptions.form = payload;
      request(requestOptions, function(error, response, body) {
        body = iconv.decode(body, 'ISO-8859-1');
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
          anpValues.dates = getDates($);
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


function getDates($) {
  var arrDate = $('input[name="selSemana"]').val().split(' '),
    dates = {},
    year = arrDate[1].split('/')[2],
    month = arrDate[1].split('/')[1],
    day = arrDate[1].split('/')[0];

  dates.from = year + '-' + month + '-' + day;

  year = arrDate[3].split('/')[2];
  month = arrDate[3].split('/')[1];
  day = arrDate[3].split('/')[0];

  dates.to = year + '-' + month + '-' + day;

  return dates;
}
