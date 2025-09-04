const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, __, context) => {
  const {
    schemas: { IncomeType },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const incomeTypes = await IncomeType.find({
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  logger.info(
    {
      count: incomeTypes.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved family income types"
  );

  return incomeTypes;
};
