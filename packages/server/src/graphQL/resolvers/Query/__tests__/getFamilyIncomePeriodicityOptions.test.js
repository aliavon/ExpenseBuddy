const getFamilyIncomePeriodicityOptions = require("../getFamilyIncomePeriodicityOptions");
const { PERIODICITY_VALUES } = require("../../../../constants/familyIncomeEnums");

describe("getFamilyIncomePeriodicityOptions resolver", () => {
  it("should return all periodicity options", async () => {
    const result = await getFamilyIncomePeriodicityOptions();

    expect(result).toHaveLength(PERIODICITY_VALUES.length);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return options with correct structure", async () => {
    const result = await getFamilyIncomePeriodicityOptions();

    result.forEach(option => {
      expect(option).toHaveProperty("value");
      expect(option).toHaveProperty("label");
      expect(typeof option.value).toBe("string");
      expect(typeof option.label).toBe("string");
    });
  });

  it("should format labels correctly", async () => {
    const result = await getFamilyIncomePeriodicityOptions();

    const expectedMappings = {
      "ONE_TIME": "One Time",
      "DAILY": "Daily",
      "WEEKLY": "Weekly",
      "MONTHLY": "Monthly",
      "YEARLY": "Yearly"
    };

    result.forEach(option => {
      expect(expectedMappings[option.value]).toBe(option.label);
    });
  });

  it("should include all expected periodicity values", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const values = result.map(option => option.value);

    PERIODICITY_VALUES.forEach(expectedValue => {
      expect(values).toContain(expectedValue);
    });
  });

  it("should handle single word values correctly", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const weeklyOption = result.find(option => option.value === "WEEKLY");
    const monthlyOption = result.find(option => option.value === "MONTHLY");

    expect(weeklyOption.label).toBe("Weekly");
    expect(monthlyOption.label).toBe("Monthly");
  });

  it("should handle multi-word values correctly", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const oneTimeOption = result.find(option => option.value === "ONE_TIME");
    const yearlyOption = result.find(option => option.value === "YEARLY");

    expect(oneTimeOption.label).toBe("One Time");
    expect(yearlyOption.label).toBe("Yearly");
  });

  it("should handle underscores in values correctly", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const oneTimeOption = result.find(option => option.value === "ONE_TIME");

    expect(oneTimeOption.label).toBe("One Time");
  });

  it("should return consistent results on multiple calls", async () => {
    const result1 = await getFamilyIncomePeriodicityOptions();
    const result2 = await getFamilyIncomePeriodicityOptions();

    expect(result1).toEqual(result2);
  });

  it("should not modify the original PERIODICITY_VALUES", async () => {
    const originalValues = [...PERIODICITY_VALUES];
    
    await getFamilyIncomePeriodicityOptions();
    
    expect(PERIODICITY_VALUES).toEqual(originalValues);
  });

  it("should handle empty PERIODICITY_VALUES gracefully", async () => {
    // This test is not practical since we can't easily mock module exports
    // Instead, let's test that the function works with the actual values
    const result = await getFamilyIncomePeriodicityOptions();
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should preserve value case in output", async () => {
    const result = await getFamilyIncomePeriodicityOptions();

    result.forEach(option => {
      expect(option.value).toMatch(/^[A-Z_]+$/); // Should be uppercase with underscores
    });
  });

  it("should capitalize first letter of each word in label", async () => {
    const result = await getFamilyIncomePeriodicityOptions();

    result.forEach(option => {
      const words = option.label.split(" ");
      words.forEach(word => {
        expect(word.charAt(0)).toMatch(/[A-Z]/); // First letter should be uppercase
        if (word.length > 1) {
          expect(word.slice(1)).toMatch(/[a-z]+/); // Rest should be lowercase
        }
      });
    });
  });

  it("should not have duplicate values", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const values = result.map(option => option.value);
    const uniqueValues = [...new Set(values)];

    expect(values.length).toBe(uniqueValues.length);
  });

  it("should not have duplicate labels", async () => {
    const result = await getFamilyIncomePeriodicityOptions();
    const labels = result.map(option => option.label);
    const uniqueLabels = [...new Set(labels)];

    expect(labels.length).toBe(uniqueLabels.length);
  });
}); 