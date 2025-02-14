const { PERIODICITY_VALUES } = require("../../../constants/familyIncomeEnums");

module.exports = async () => {
  const options = PERIODICITY_VALUES.map((value) => ({
    value,
    label: value
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  }));
  return options;
};
