"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  stateSchema,
  citySchema,
  statiticsSchema,
  consumerPriceSchema,
  distributionPriceSchema,
  stationsSchema,
  priceSchema,
  dateSchema,
  informationSchema;


consumerPriceSchema = mongoose.Schema({
  averagePrice: {
    type: Number,
    sparse: true
  },
  standardDeviation: {
    type: Number,
    sparse: true
  },
  minPrice: {
    type: Number,
    sparse: true
  },
  maxPrice: {
    type: Number,
    sparse: true
  },
  averageMargin: {
    type: Number,
    sparse: true
  }
}, {
  _id: false
});

distributionPriceSchema = mongoose.Schema({
  averagePrice: Number,
  standardDeviation: Number,
  minPrice: {
    type: Number,
    sparse: true
  },
  maxPrice: {
    type: Number,
    sparse: true
  }
}, {
  _id: false
});

statiticsSchema = {
  type: {
    type: String,
    required: true,
    trin: true
  },
  consumerPrice: [consumerPriceSchema],
  distributionPrice: [distributionPriceSchema]
};

priceSchema = mongoose.Schema({
  type: String,
  sellPrice: {
    type: Number,
    sparse: true
  },
  buyPrice: {
    type: Number,
    sparse: true
  },
  saleMode: String,
  provider: String,
  date: String
}, {
  _id: false
});

stationsSchema = mongoose.Schema({
  name: String,
  address: String,
  area: String,
  flag: String,
  prices: {}
}, {
  _id: false
});

dateSchema = mongoose.Schema({
  from: String,
  to: String
}, {
  _id: false
});

citySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trin: true
  },
  statistics: [statiticsSchema],
  stations: [stationsSchema]
}, {
  _id: false
});

stateSchema = {
  name: {
    type: String,
    required: true,
    trin: true
  },
  cities: [citySchema],
  dates: dateSchema
};


informationSchema = new Schema(stateSchema);

informationSchema.methods.toJSON = function() {
  var obj = JSON.parse(JSON.stringify(this.toObject()));
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('information', informationSchema);
