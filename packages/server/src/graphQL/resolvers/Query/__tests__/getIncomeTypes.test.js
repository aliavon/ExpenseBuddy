const getIncomeTypes = require("../getIncomeTypes");
const IncomeType = require("../../../../database/schemas/IncomeType");

describe("getIncomeTypes resolver", () => {
  const mockContext = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when no income types exist", async () => {
    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toEqual([]);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved income types"
    );
  });

  it("should return all income types", async () => {
    const incomeTypes = [
      { name: "Salary", description: "Monthly salary" },
      { name: "Bonus", description: "Annual bonus" },
      { name: "Freelance", description: "Freelance work" },
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Salary", "Bonus", "Freelance"])
    );
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully retrieved income types"
    );
  });

  it("should return income types with all properties", async () => {
    const incomeTypeData = {
      name: "Consulting",
      description: "Consulting services income",
    };

    await IncomeType.create(incomeTypeData);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: incomeTypeData.name,
      description: incomeTypeData.description,
    });
    expect(result[0]._id).toBeDefined();
  });

  it("should return income types with empty descriptions", async () => {
    const incomeTypes = [
      { name: "Type1", description: "Description 1" },
      { name: "Type2", description: "" },
      { name: "Type3" }, // No description provided, should default to ""
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);

    const type2 = result.find((item) => item.name === "Type2");
    const type3 = result.find((item) => item.name === "Type3");

    expect(type2.description).toBe("");
    expect(type3.description).toBe("");
  });

  it("should maintain consistent order across calls", async () => {
    const incomeTypes = [
      { name: "Alpha", description: "First" },
      { name: "Beta", description: "Second" },
      { name: "Gamma", description: "Third" },
    ];

    await IncomeType.create(incomeTypes);

    const result1 = await getIncomeTypes(null, {}, mockContext);
    const result2 = await getIncomeTypes(null, {}, mockContext);

    expect(result1.map((item) => item.name)).toEqual(
      result2.map((item) => item.name)
    );
  });

  it("should handle large number of income types", async () => {
    const incomeTypes = Array.from({ length: 100 }, (_, i) => ({
      name: `IncomeType${i}`,
      description: `Description for income type ${i}`,
    }));

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(100);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      { count: 100 },
      "Successfully retrieved income types"
    );
  });

  it("should handle special characters in income type names", async () => {
    const incomeTypes = [
      { name: "Freelance & Consulting", description: "Mixed income" },
      { name: "投資収益", description: "Investment returns in Japanese" },
      { name: "Café Revenue", description: "Revenue with accented characters" },
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        "Freelance & Consulting",
        "投資収益",
        "Café Revenue",
      ])
    );
  });

  it("should log retrieval with correct count", async () => {
    await IncomeType.create([
      { name: "Type1", description: "Desc1" },
      { name: "Type2", description: "Desc2" },
    ]);

    await getIncomeTypes(null, {}, mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledTimes(1);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully retrieved income types"
    );
  });

  it("should return fresh data on each call", async () => {
    // First call with empty database
    const result1 = await getIncomeTypes(null, {}, mockContext);
    expect(result1).toHaveLength(0);

    // Add data
    await IncomeType.create({
      name: "New Type",
      description: "New description",
    });

    // Second call should include new data
    const result2 = await getIncomeTypes(null, {}, mockContext);
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toBe("New Type");
  });
});
