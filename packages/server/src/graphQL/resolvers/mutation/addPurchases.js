const { GraphQLError } = require('graphql');

module.exports = async (_, { purchases }, { schemas: { Purchase }, logger }) => {
  try {
    const newPurchases = await Purchase.insertMany(purchases);
    logger.info({ count: newPurchases.length }, 'Successfully added purchases');
    return newPurchases;
  } catch (error) {
    logger.error({ err: error }, 'Error adding purchases');
    throw new GraphQLError('Failed to add purchases. Please try again later.', {
      extensions: {
        code: 'ADD_PURCHASES_ERROR',
        detailedMessage: error.message,
      },
    });
  }
}