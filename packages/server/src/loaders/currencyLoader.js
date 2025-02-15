const DataLoader = require("dataloader");
const { Currency } = require("../database/schemas");
const logger = require("../logger");

async function batchCurrencies(ids) {
  const currencies = await Currency.find({ _id: { $in: ids } });
  logger.debug(
    { batchSize: ids.length, loadedCount: currencies.length },
    "Batch loaded currencies"
  );
  const currencyMap = {};
  currencies.forEach((currency) => {
    currencyMap[currency._id.toString()] = currency;
  });
  return ids.map((id) => currencyMap[id.toString()]);
}

module.exports = () =>
  new DataLoader(batchCurrencies, { maxBatchSize: 1000, cache: false });
