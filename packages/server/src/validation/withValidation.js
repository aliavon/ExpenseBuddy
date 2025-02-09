const { GraphQLError } = require('graphql');

/**
 * Wrapper for resolvers that performs validation of input arguments.
 * @param {Joi.Schema} schema - Joi schema for validating the args object.
 * @param {Function} resolver - The original resolver to be called if validation passes.
 * @returns {Function} A new resolver wrapped with validation logic.
 */
const withValidation = (schema, resolver) => {
  return async (parent, args, context, info) => {
    // Validate the input args object using the provided Joi schema.
    const { error, value: validatedArgs } = schema.validate(args);
    if (error) {
      throw new GraphQLError(`Validation error: ${error.message}`, {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }
    // If validation passes, call the original resolver with the validated arguments.
    return resolver(parent, validatedArgs, context, info);
  };
};

module.exports = withValidation;
