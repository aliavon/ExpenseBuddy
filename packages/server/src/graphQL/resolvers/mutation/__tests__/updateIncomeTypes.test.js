const updateIncomeTypes = require("../updateIncomeTypes");
const { IncomeType } = require("../../../../database/schemas");

describe("updateIncomeTypes mutation", () => {
  beforeEach(async () => {
    await IncomeType.deleteMany({});
    incomeTypeCounter = 0; // Reset counter for each test
  });

  let incomeTypeCounter = 0;
  const createIncomeTypeData = (overrides = {}) => {
    incomeTypeCounter++;
    return {
      name: `Income Type ${incomeTypeCounter}`,
      description: `Description ${incomeTypeCounter}`,
      ...overrides,
    };
  };

  const createIncomeTypeInDB = async (data = {}) => {
    const incomeTypeData = createIncomeTypeData(data);
    const incomeType = new IncomeType(incomeTypeData);
    return await incomeType.save();
  };

  it("should update single income type successfully", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "Updated Salary",
        description: "Updated monthly salary",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Updated Salary");
    expect(result[0].description).toBe("Updated monthly salary");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated income types"
    );
  });

  it("should update multiple income types successfully", async () => {
    const incomeType1 = await createIncomeTypeInDB({ name: "Salary" });
    const incomeType2 = await createIncomeTypeInDB({ name: "Bonus" });
    const incomeType3 = await createIncomeTypeInDB({ name: "Freelance" });
    const context = global.createMockContext();

    const updates = [
      { id: incomeType1._id, description: "Monthly salary payment" },
      { id: incomeType2._id, name: "Annual Bonus" },
      {
        id: incomeType3._id,
        name: "Freelance Work",
        description: "Project-based income",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result).toHaveLength(3);

    const updated1 = result.find(
      (r) => r._id.toString() === incomeType1._id.toString()
    );
    const updated2 = result.find(
      (r) => r._id.toString() === incomeType2._id.toString()
    );
    const updated3 = result.find(
      (r) => r._id.toString() === incomeType3._id.toString()
    );

    expect(updated1.description).toBe("Monthly salary payment");
    expect(updated2.name).toBe("Annual Bonus");
    expect(updated3.name).toBe("Freelance Work");
    expect(updated3.description).toBe("Project-based income");

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully updated income types"
    );
  });

  it("should handle empty updates array", async () => {
    const context = global.createMockContext();

    const result = await updateIncomeTypes(null, { updates: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated income types"
    );
  });

  it("should update only specified fields", async () => {
    const originalData = {
      name: "Original Salary",
      description: "Original description",
    };
    const incomeType = await createIncomeTypeInDB(originalData);
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "Updated Salary", // only update name
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("Updated Salary"); // updated
    expect(result[0].description).toBe("Original description"); // unchanged
  });

  it("should handle special characters in income type data", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "Salaire & Bonus",
        description: "Paiement mensuel - très important!",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("Salaire & Bonus");
    expect(result[0].description).toBe("Paiement mensuel - très important!");
  });

  it("should handle unicode characters", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "工资",
        description: "月薪收入",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("工资");
    expect(result[0].description).toBe("月薪收入");
  });

  it("should handle emoji in income type data", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "Salary 💰",
        description: "Monthly income 🎉",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("Salary 💰");
    expect(result[0].description).toBe("Monthly income 🎉");
  });

  it("should handle large batch updates", async () => {
    const incomeTypes = [];
    for (let i = 1; i <= 20; i++) {
      incomeTypes.push(
        await createIncomeTypeInDB({
          name: `Type ${i}`,
          description: `Description ${i}`,
        })
      );
    }

    const updates = incomeTypes.map((incomeType, index) => ({
      id: incomeType._id,
      description: `Updated Description ${index + 1}`,
    }));

    const context = global.createMockContext();

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result).toHaveLength(20);
    expect(result[0].description).toBe("Updated Description 1");
    expect(result[19].description).toBe("Updated Description 20");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20 },
      "Successfully updated income types"
    );
  });

  it("should handle non-existent income type IDs gracefully", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      {
        id: nonExistentId,
        name: "Non-existent Type",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated income types"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingIncomeType = await createIncomeTypeInDB({ name: "Original" });
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      { id: existingIncomeType._id, name: "Updated" },
      { id: nonExistentId, name: "Non-existent" },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Updated");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated income types"
    );
  });

  it("should handle database errors gracefully", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    // Mock IncomeType.bulkWrite to throw an error
    const originalBulkWrite = IncomeType.bulkWrite;
    IncomeType.bulkWrite = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    const updates = [
      {
        id: incomeType._id,
        name: "Updated",
      },
    ];

    await expect(updateIncomeTypes(null, { updates }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    IncomeType.bulkWrite = originalBulkWrite;
  });

  it("should persist changes in database", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "Persisted Update",
        description: "Persisted description",
      },
    ];

    await updateIncomeTypes(null, { updates }, context);

    // Verify changes were persisted
    const updatedIncomeType = await IncomeType.findById(incomeType._id);
    expect(updatedIncomeType.name).toBe("Persisted Update");
    expect(updatedIncomeType.description).toBe("Persisted description");
  });

  it("should handle ObjectId string format", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id.toString(), // string format
        name: "String ID Update",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("String ID Update");
  });

  it("should handle very long names and descriptions", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();
    const longName = "A".repeat(200);
    const longDescription = "B".repeat(500);

    const updates = [
      {
        id: incomeType._id,
        name: longName,
        description: longDescription,
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe(longName);
    expect(result[0].description).toBe(longDescription);
  });

  it("should handle empty string values", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        name: "",
        description: "",
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].name).toBe("");
    expect(result[0].description).toBe("");
  });

  it("should handle null values", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: incomeType._id,
        description: null,
      },
    ];

    const result = await updateIncomeTypes(null, { updates }, context);

    expect(result[0].description).toBeNull();
  });

  it("should handle multiple updates to same income type", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    // First update
    const firstUpdates = [
      {
        id: incomeType._id,
        name: "First Update",
      },
    ];

    await updateIncomeTypes(null, { updates: firstUpdates }, context);

    // Second update
    const secondUpdates = [
      {
        id: incomeType._id,
        description: "Second Update",
      },
    ];

    const result = await updateIncomeTypes(
      null,
      { updates: secondUpdates },
      context
    );

    expect(result[0].name).toBe("First Update"); // from first update
    expect(result[0].description).toBe("Second Update"); // from second update
  });
});
