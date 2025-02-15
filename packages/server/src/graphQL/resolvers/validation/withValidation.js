const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Wrapper for resolvers that performs validation of input arguments.
 * @param {Joi.Schema} schema - Joi schema for validating the args object.
 * @param {Function} resolver - The original resolver to be called if validation passes.
 * @returns {Function} A new resolver wrapped with validation logic.
 */
const withValidation = (schema, resolver) => {
  return async (parent, args, context, info) => {
    // Validate the input args object using the provided Joi schema.
    const { error, value: validatedArgs } = schema.validate(args, {
      abortEarly: false,
    });

    if (error) {
      // Log validation details if a logger is available.
      context?.logger?.error(
        { validationErrors: error.details },
        `Validation error in resolver "${info.parentType}" for field "${info.fieldName}"`
      );

      // Throw an error with code "VALIDATION_ERROR" and detailed messages.
      throw new GraphQLError(`Validation error: ${error.message}`, {
        extensions: {
          code: ERROR_CODES.VALIDATION_ERROR,
          detailedMessage: error.details
            .map((detail) => detail.message)
            .join("; "),
        },
      });
    }
    // If validation passes, call the original resolver with the validated arguments.
    return resolver(parent, validatedArgs, context, info);
  };
};

module.exports = withValidation;
