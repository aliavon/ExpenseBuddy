module.exports = {
  item: async (parent, args, { schemas: { Item } }) => {
    return await Item.findById(parent.itemId);
  }
};
