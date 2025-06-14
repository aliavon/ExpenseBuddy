const DataLoader = require("dataloader");
const { IncomeType } = require("../database/schemas");
const logger = require("../logger");

async function batchIncomeTypes(ids) {
  const incomeTypes = await IncomeType.find({ _id: { $in: ids } });
  logger.debug(
    { batchSize: ids.length, loadedCount: incomeTypes.length },
    "Batch loaded income types"
  );
  const incomeTypeMap = {};
  incomeTypes.forEach((incomeType) => {
    incomeTypeMap[incomeType._id.toString()] = incomeType;
  });
  return ids.map((id) => incomeTypeMap[id.toString()] || null);
}

module.exports = () =>
  new DataLoader(batchIncomeTypes, { maxBatchSize: 1000, cache: false });
