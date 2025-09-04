const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { names }, context) => {
  const {
    schemas: { Item },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const items = await Item.find({
    name: { $in: names },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  const itemsByName = {};
  items.forEach((item) => {
    itemsByName[item.name] = item;
  });

  const result = names.map((name) => ({
    name,
    category: itemsByName[name] ? itemsByName[name].category : null,
  }));

  logger.info(
    {
      count: result.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved family purchases category suggestion"
  );

  return result;
};
