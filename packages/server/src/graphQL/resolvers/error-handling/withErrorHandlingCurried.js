const withErrorHandling = require("./withErrorHandling");

/**
 * Returns a function that accepts a resolver and returns an error-handled resolver.
 * @param {Object} options - Options for error handling (defaultErrorCode, defaultErrorMessage).
 * @returns {Function} - A function that takes a resolver and returns an error-handled resolver.
 */
const withErrorHandlingCurried = (options) => (resolver) =>
  withErrorHandling(resolver, options);

module.exports = withErrorHandlingCurried;
