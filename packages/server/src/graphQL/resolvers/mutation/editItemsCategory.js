module.exports = async (
  _,
  { names, newCategory },
  { schemas: { Item }, logger }
) => {
  await Item.updateMany(
    { name: { $in: names } },
    { $set: { category: newCategory } }
  );
  const updatedItems = await Item.find({ name: { $in: names } });
  logger.info(
    { count: updatedItems.length },
    "Successfully updated items category"
  );
  return updatedItems;
};
