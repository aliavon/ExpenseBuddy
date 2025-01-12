module.exports = async (_, __, {schemas: {Purchase}}) => {
  const units = await Purchase.distinct('unit');
  return units.filter((unit) => unit);
}