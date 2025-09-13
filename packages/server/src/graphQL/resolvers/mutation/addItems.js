const { requireFamily } = require("../../../auth");

module.exports = async (_, { items }, context) => {
  const {
    schemas: { Item },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Enrich items with family context
  const enrichedItems = items.map((item) => ({
    ...item,
    familyId: auth.user.familyId,
  }));

  const newItems = await Item.insertMany(enrichedItems);

  logger.info(
    {
      count: newItems.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully added family items"
  );

  return newItems;
};
