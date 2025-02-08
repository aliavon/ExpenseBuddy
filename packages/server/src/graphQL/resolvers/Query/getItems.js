module.exports = async (_, { names, category }, { schemas: { Item } }) => {
    const filter = {};

    if (names && names.length > 0) {
      filter.name = { $in: names };
    }

    if (category && category.trim() !== "") {
      filter.category = category;
    }

    return await Item.find(filter);
};
