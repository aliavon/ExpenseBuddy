module.exports = async (_, { name, newCategory }, { schemas: { Item } }) => {
  const item = await Item.findOneAndUpdate(
    { name },
    { $set: { category: newCategory } },
    { new: true }
  );
  if (!item) {
    throw new Error("Item not found");
  }
  return item;
};
