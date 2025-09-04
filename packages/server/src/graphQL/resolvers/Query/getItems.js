const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { names, category }, context) => {
  const {
    schemas: { Item },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const filter = {
    // Always filter by family
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  };

  if (names && names.length > 0) {
    filter.name = { $in: names };
  }
  if (category && category.trim() !== "") {
    filter.category = category;
  }

  const items = await Item.find(filter);

  logger.info(
    {
      count: items.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved family items"
  );

  return items;
};
