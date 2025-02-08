const { GraphQLError } = require('graphql');

module.exports = async (_, { purchases }, {schemas: {Purchase}}) => {
  try {
    const newPurchases = await Purchase.insertMany(purchases);
    return newPurchases;
  } catch (error) {
    throw new GraphQLError("Failed to add purchases. Please try again later.", {
      extensions: {
        code: "ADD_PURCHASES_ERROR",
        originalError: error,
      },
    });
  }
}