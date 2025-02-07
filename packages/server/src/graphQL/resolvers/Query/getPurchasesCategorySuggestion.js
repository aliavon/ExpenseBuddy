module.exports = async (_, { names }, { schemas: { Item } }) => {
  const items = await Item.find({ name: { $in: names } });
  const itemsByName = {};
  items.forEach(item => {
    itemsByName[item.name] = item;
  });
  return names.map(name => ({
    name,
    category: itemsByName[name] ? itemsByName[name].category : null,
  }));
};
