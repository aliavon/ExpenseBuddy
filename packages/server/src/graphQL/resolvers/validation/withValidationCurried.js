const withValidation = require("./withValidation");

/**
 * Returns a function that accepts a resolver and returns a validated resolver.
 * @param {Joi.Schema} schema - The Joi schema.
 * @returns {Function} - A function that takes a resolver and returns a validated resolver.
 */
const withValidationCurried = (schema) => (resolver) =>
  withValidation(schema, resolver);

module.exports = withValidationCurried;
