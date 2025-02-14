const DataLoader = require("dataloader");
const { User } = require("../database/schemas");
const logger = require("../logger");

async function batchUsers(ids) {
  const users = await User.find({ _id: { $in: ids } });
  logger.debug(
    { batchSize: ids.length, loadedCount: users.length },
    "Batch loaded users"
  );
  const userMap = {};
  users.forEach((user) => {
    userMap[user._id.toString()] = user;
  });
  return ids.map((id) => userMap[id.toString()]);
}

module.exports = () =>
  new DataLoader(batchUsers, { maxBatchSize: 1000, cache: false });
