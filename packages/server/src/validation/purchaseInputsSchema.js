const Joi = require('joi');
const purchaseInputSchema = require('./purchaseInputSchema');

const purchaseInputsSchema = Joi.array().items(purchaseInputSchema).required();

module.exports = purchaseInputsSchema;
