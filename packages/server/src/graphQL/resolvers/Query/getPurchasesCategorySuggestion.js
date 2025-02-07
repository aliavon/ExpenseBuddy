
module.exports = async (_, { names }, { schemas: { Purchase } }) => {
    // Fetch all purchases whose name is in the provided list
    const purchases = await Purchase.find({ name: { $in: names } });

    // Group purchases by name
    const groupedByName = {};
    purchases.forEach(purchase => {
      if (!groupedByName[purchase.name]) {
        groupedByName[purchase.name] = [];
      }
      groupedByName[purchase.name].push(purchase);
    });

    const result = [];

    // For each name in the input array, determine a representative purchase and a suggested category
    for (const name of names) {
      if (groupedByName[name]) {
        const group = groupedByName[name];

        const distinctCategories = Array.from(
          new Set(group.map(p => p.category).filter(category => category))
        );

        const suggestedCategory = (distinctCategories.length === 1)
          ? distinctCategories[0]
          : null;

        result.push({
          name: name,
          category: suggestedCategory
        });
      }
    }

    return result;
};
