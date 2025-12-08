const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, __, context) => {
  const {
    schemas: { Item },
    logger,
  } = context;

  // Require authentication and get familyId
  const auth = requireFamily(context);
  const familyId = new mongoose.Types.ObjectId(auth.user.familyId);

  // Get categories only from user's family
  const categories = await Item.distinct("category", { familyId });
  const filteredCategories = categories.filter(
    (category) => category && category.trim() !== ""
  );

  logger.info(
    { count: filteredCategories.length, familyId: auth.user.familyId },
    "Successfully retrieved categories for family"
  );

  return filteredCategories;
};
