const DataLoader = require("dataloader");
const { IncomeType } = require("../database/schemas");
const logger = require("../logger");

async function batchIncomeTypes(ids) {
  const types = await IncomeType.find({ _id: { $in: ids } });
  logger.debug(
    { batchSize: ids.length, loadedCount: types.length },
    "Batch loaded income types"
  );
  const typeMap = {};
  types.forEach((type) => {
    typeMap[type._id.toString()] = type;
  });
  return ids.map((id) => typeMap[id.toString()]);
}

module.exports = () =>
  new DataLoader(batchIncomeTypes, { maxBatchSize: 1000, cache: false });
