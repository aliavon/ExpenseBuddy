const DataLoader = require("dataloader");

const { Item } = require("../database/schemas");
const logger = require("../logger");

async function batchItems(ids) {
  const items = await Item.find({ _id: { $in: ids } });
  logger.debug(
    { batchSize: ids.length, loadedCount: items.length },
    "Batch loaded items"
  );

  const itemMap = {};
  items.forEach((item) => {
    itemMap[item._id.toString()] = item;
  });
  return ids.map((id) => itemMap[id.toString()]);
}

module.exports = () =>
  new DataLoader(batchItems, { maxBatchSize: 1000, cache: false });
