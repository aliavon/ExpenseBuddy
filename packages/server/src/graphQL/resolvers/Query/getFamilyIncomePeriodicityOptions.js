const { PERIODICITY } = require("../../../constants/familyIncomeEnums");

module.exports = async () => {
  const options = Object.entries(PERIODICITY).map(([key, value]) => ({
    value,
    label: key.replace("_", " ").toLowerCase(), // "ONE_TIME" -> "one time"
  }));
  return options;
};
