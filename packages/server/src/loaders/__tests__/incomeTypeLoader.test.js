const createIncomeTypeLoader = require("../incomeTypeLoader");
const IncomeType = require("../../database/schemas/IncomeType");

describe("incomeTypeLoader", () => {
  let incomeTypeLoader;

  beforeEach(() => {
    incomeTypeLoader = createIncomeTypeLoader();
  });

  it("should create a DataLoader instance", () => {
    expect(incomeTypeLoader).toBeDefined();
    expect(typeof incomeTypeLoader.load).toBe("function");
    expect(typeof incomeTypeLoader.loadMany).toBe("function");
  });

  it("should load single income type by id", async () => {
    const incomeType = await IncomeType.create({
      name: "Salary",
      description: "Monthly salary income"
    });

    const result = await incomeTypeLoader.load(incomeType._id);
    expect(result.name).toBe("Salary");
    expect(result.description).toBe("Monthly salary income");
  });

  it("should load multiple income types in batch", async () => {
    const incomeTypes = await IncomeType.create([
      { name: "Salary", description: "Monthly salary" },
      { name: "Freelance", description: "Freelance projects" },
      { name: "Investment", description: "Investment returns" }
    ]);

    const ids = incomeTypes.map(it => it._id);
    const results = await incomeTypeLoader.loadMany(ids);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe("Salary");
    expect(results[1].name).toBe("Freelance");
    expect(results[2].name).toBe("Investment");
  });

  it("should return null for non-existent income type", async () => {
    const nonExistentId = global.createMockId();
    const result = await incomeTypeLoader.load(nonExistentId);
    expect(result).toBeNull();
  });

  it("should handle mixed existing and non-existing income types", async () => {
    const incomeType = await IncomeType.create({
      name: "Salary",
      description: "Monthly salary income"
    });
    const nonExistentId = global.createMockId();

    const results = await incomeTypeLoader.loadMany([incomeType._id, nonExistentId]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Salary");
    expect(results[1]).toBeNull();
  });

  it("should handle errors gracefully", async () => {
    const spy = jest.spyOn(IncomeType, "find").mockRejectedValue(new Error("Database error"));
    
    await expect(incomeTypeLoader.load(global.createMockId())).rejects.toThrow("Database error");
    spy.mockRestore();
  });
}); 