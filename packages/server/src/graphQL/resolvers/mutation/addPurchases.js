const { GraphQLError } = require('graphql');

const purchaseInputsSchema = require('../../validation/purchaseInputsSchema');

module.exports = async (_, { purchases }, { schemas: { Purchase }, logger }) => {
  try {
    const { error, value: validatedPurchases } = purchaseInputsSchema.validate(purchases);
    if (error) {
      throw new GraphQLError(`Validation error: ${error.message}`, {
        extensions: {
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const newPurchases = await Purchase.insertMany(validatedPurchases);
    logger.info({ count: newPurchases.length }, 'Successfully added purchases');
    return newPurchases;
  } catch (error) {
    logger.error({ err: error }, 'Error adding purchases');
    throw new GraphQLError(
      error.message || 'Failed to add purchases. Please try again later.',
      {
        extensions: {
          code: error.extensions?.code || 'ADD_PURCHASES_ERROR',
          detailedMessage: error.message,
        },
      }
    );
  }
}