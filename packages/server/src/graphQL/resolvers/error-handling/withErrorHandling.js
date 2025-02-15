const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * A generic wrapper for error handling in resolvers.
 * @param {Function} resolver - The original resolver function.
 * @param {Object} options - Options for error handling.
 * @param {string} options.defaultErrorCode - The default error code.
 * @param {string} options.defaultErrorMessage - The default error message.
 * @returns {Function} - A new resolver wrapped with error handling.
 */
const withErrorHandling = (
  resolver,
  { defaultErrorCode, defaultErrorMessage } = {}
) => {
  return async (parent, args, context, info) => {
    try {
      return await resolver(parent, args, context, info);
    } catch (error) {
      // Determine error code and message using optional chaining.
      const errorCode =
        error?.extensions?.code ||
        defaultErrorCode ||
        ERROR_CODES.INTERNAL_SERVER_ERROR;
      const errorMessage =
        error?.message || defaultErrorMessage || "An error occurred";

      // Log error details if a logger is available in the context.
      context?.logger?.error(
        { err: error, code: errorCode, message: errorMessage },
        `Error in resolver "${info.parentType}" for field "${info.fieldName}"`
      );

      // If the error already has an error code, rethrow it as is.
      if (error?.extensions?.code) {
        throw error;
      }

      // Otherwise, wrap the error in a new GraphQLError with the default options.
      throw new GraphQLError(defaultErrorMessage || "An error occurred", {
        extensions: {
          code: defaultErrorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
          detailedMessage: error?.message,
        },
      });
    }
  };
};

module.exports = withErrorHandling;
