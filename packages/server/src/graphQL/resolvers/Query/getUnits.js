module.exports = async (_, __, { schemas: { Purchase }, logger }) => {
  const units = await Purchase.distinct("unit");
  const filteredUnits = units.filter((unit) => unit && unit.trim() !== "");
  logger.info({ count: filteredUnits.length }, "Successfully retrieved units");
  return filteredUnits;
};
