/**
 * IncomeType field resolvers
 * Handle transformation of MongoDB _id to GraphQL id
 */

const IncomeTypeResolver = {
  id: (incomeType) => {
    return incomeType.id || incomeType._id;
  },
};

module.exports = IncomeTypeResolver;
