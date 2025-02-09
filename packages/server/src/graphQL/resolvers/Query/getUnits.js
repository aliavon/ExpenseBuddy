const { GraphQLError } = require('graphql');

module.exports = async (_, __, { schemas: { Purchase }, logger }) => {
  try {
    const units = await Purchase.distinct('unit');
    const filteredUnits = units.filter(unit => unit && unit.trim() !== '');
    logger.info({ count: filteredUnits.length }, 'Successfully retrieved units');
    return filteredUnits;
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving units');
    throw new GraphQLError('Failed to retrieve units. Please try again later.', {
      extensions: {
        code: 'GET_UNITS_ERROR',
        detailedMessage: error.message,
      },
    });
  }
};