module.exports = async (_, { name, category }, { schemas: { Purchase } }) => {
    // Count all purchases with the given name and a category that is different from the provided one
    const count = await Purchase.countDocuments({ name, category: { $ne: category } });
    return count;
};
