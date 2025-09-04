const getIncomeTypes = require("../getIncomeTypes");
const IncomeType = require("../../../../database/schemas/IncomeType");

describe("getIncomeTypes resolver", () => {
  beforeEach(async () => {
    await IncomeType.deleteMany({});
    jest.clearAllMocks();
  });

  // Helper to create income types with proper family context
  const createIncomeTypeWithFamily = (familyId, incomeTypeData) => ({
    familyId,
    ...incomeTypeData,
  });

  it("should return empty array when no income types exist", async () => {
    const mockContext = global.createMockContext();
    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toEqual([]);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      {
        count: 0,
        userId: mockContext.auth.user.id,
        familyId: mockContext.auth.user.familyId,
      },
      "Successfully retrieved family income types"
    );
  });

  it("should return all income types", async () => {
    const mockContext = global.createMockContext();
    const incomeTypes = [
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Salary",
        description: "Monthly salary",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Bonus",
        description: "Annual bonus",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Freelance",
        description: "Freelance work",
      }),
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Salary", "Bonus", "Freelance"])
    );
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      {
        count: 3,
        userId: mockContext.auth.user.id,
        familyId: mockContext.auth.user.familyId,
      },
      "Successfully retrieved family income types"
    );
  });

  it("should return income types with all properties", async () => {
    const mockContext = global.createMockContext();
    const incomeTypeData = createIncomeTypeWithFamily(
      mockContext.auth.user.familyId,
      {
        name: "Consulting",
        description: "Consulting services income",
      }
    );

    await IncomeType.create(incomeTypeData);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: incomeTypeData.name,
      description: incomeTypeData.description,
    });
    expect(result[0]).toHaveProperty("_id");
  });

  it("should return income types with empty descriptions", async () => {
    const mockContext = global.createMockContext();
    const incomeTypes = [
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Type1",
        description: "Description for Type1",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Type2",
        description: null,
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Type3",
        description: "",
      }),
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);

    const type2 = result.find((item) => item.name === "Type2");
    const type3 = result.find((item) => item.name === "Type3");

    expect(type2.description).toBeNull();
    expect(type3.description).toBe("");
  });

  it("should handle large number of income types", async () => {
    const mockContext = global.createMockContext();
    const incomeTypes = Array.from({ length: 100 }, (_, index) =>
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: `Type${index + 1}`,
        description: `Description for Type${index + 1}`,
      })
    );

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(100);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      {
        count: 100,
        userId: mockContext.auth.user.id,
        familyId: mockContext.auth.user.familyId,
      },
      "Successfully retrieved family income types"
    );
  });

  it("should handle special characters in income type names", async () => {
    const mockContext = global.createMockContext();
    const incomeTypes = [
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Freelance & Consulting",
        description: "Mixed income",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Café Tips",
        description: "Service tips",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Rental (Apartment #1)",
        description: "Rental income",
      }),
    ];

    await IncomeType.create(incomeTypes);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        "Freelance & Consulting",
        "Café Tips",
        "Rental (Apartment #1)",
      ])
    );
  });

  it("should log retrieval with correct count", async () => {
    const mockContext = global.createMockContext();
    const incomeTypes = [
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Type1",
      }),
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "Type2",
      }),
    ];

    await IncomeType.create(incomeTypes);

    await getIncomeTypes(null, {}, mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledTimes(1);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: mockContext.auth.user.id,
        familyId: mockContext.auth.user.familyId,
      },
      "Successfully retrieved family income types"
    );
  });

  it("should return fresh data on each call", async () => {
    const mockContext = global.createMockContext();

    // First call should return empty
    const result1 = await getIncomeTypes(null, {}, mockContext);
    expect(result1).toHaveLength(0);

    // Add new data
    await IncomeType.create(
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "New Type",
      })
    );

    // Second call should include new data
    const result2 = await getIncomeTypes(null, {}, mockContext);
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toBe("New Type");
  });

  it("should only return income types for user's family", async () => {
    const mockContext = global.createMockContext();
    const otherFamilyId = global.createMockId();

    // Create income types for different families
    await IncomeType.create([
      createIncomeTypeWithFamily(mockContext.auth.user.familyId, {
        name: "My Family Type",
      }),
      createIncomeTypeWithFamily(otherFamilyId, {
        name: "Other Family Type",
      }),
    ]);

    const result = await getIncomeTypes(null, {}, mockContext);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My Family Type");
  });
});
