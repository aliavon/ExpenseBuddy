const createIncomeTypes = require("../createIncomeTypes");
const IncomeType = require("../../../../database/schemas/IncomeType");

describe("createIncomeTypes resolver", () => {
  const mockContext = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create single income type successfully", async () => {
    const args = {
      incomeTypes: [
        {
          name: "Salary",
          description: "Monthly salary income",
        },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Salary");
    expect(result[0].description).toBe("Monthly salary income");
    expect(result[0]._id).toBeDefined();

    const savedIncomeType = await IncomeType.findById(result[0]._id);
    expect(savedIncomeType).toBeTruthy();
    expect(savedIncomeType.name).toBe("Salary");
  });

  it("should create multiple income types successfully", async () => {
    const args = {
      incomeTypes: [
        {
          name: "Salary",
          description: "Monthly salary",
        },
        {
          name: "Bonus",
          description: "Annual bonus",
        },
        {
          name: "Freelance",
          description: "Freelance work",
        },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toEqual([
      "Salary",
      "Bonus",
      "Freelance",
    ]);

    const savedIncomeTypes = await IncomeType.find({});
    expect(savedIncomeTypes).toHaveLength(3);
  });

  it("should create income type with empty description", async () => {
    const args = {
      incomeTypes: [
        {
          name: "Consultation",
        },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Consultation");
    expect(result[0].description).toBe("");
  });

  it("should log successful creation", async () => {
    const args = {
      incomeTypes: [
        {
          name: "Salary",
          description: "Monthly salary",
        },
        {
          name: "Bonus",
          description: "Annual bonus",
        },
      ],
    };

    await createIncomeTypes(null, args, mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully added income types"
    );
  });

  it("should handle database errors gracefully", async () => {
    // Create a duplicate income type first
    await IncomeType.create({
      name: "Salary",
      description: "Existing salary",
    });

    const args = {
      incomeTypes: [
        {
          name: "Salary", // This will cause a duplicate key error
          description: "New salary",
        },
      ],
    };

    await expect(createIncomeTypes(null, args, mockContext)).rejects.toThrow();
  });

  it("should preserve order of created income types", async () => {
    const args = {
      incomeTypes: [
        { name: "Alpha", description: "First" },
        { name: "Beta", description: "Second" },
        { name: "Gamma", description: "Third" },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result[0].name).toBe("Alpha");
    expect(result[1].name).toBe("Beta");
    expect(result[2].name).toBe("Gamma");
  });

  it("should handle income types with special characters", async () => {
    const args = {
      incomeTypes: [
        {
          name: "Freelance & Consulting",
          description: "Income from freelance work & consulting services",
        },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result[0].name).toBe("Freelance & Consulting");
    expect(result[0].description).toBe(
      "Income from freelance work & consulting services"
    );
  });

  it("should create income types with long descriptions", async () => {
    const longDescription = "A".repeat(500);
    const args = {
      incomeTypes: [
        {
          name: "Test",
          description: longDescription,
        },
      ],
    };

    const result = await createIncomeTypes(null, args, mockContext);

    expect(result[0].description).toBe(longDescription);
  });
});
