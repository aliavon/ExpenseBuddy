const IncomeType = require("../IncomeType");
const Family = require("../Family");
const User = require("../User");
const Currency = require("../Currency");

describe("IncomeType Schema", () => {
  let testFamily;

  beforeEach(async () => {
    const testCurrency = await Currency.create({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    });

    const testUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    testFamily = await Family.create({
      name: "Test Family",
      ownerId: testUser._id,
      currency: testCurrency._id,
    });
  });

  it("should create income type with required fields", async () => {
    const incomeTypeData = {
      familyId: testFamily._id,
      name: "Salary",
      description: "Monthly salary income",
    };

    const incomeType = new IncomeType(incomeTypeData);
    const savedIncomeType = await incomeType.save();

    expect(savedIncomeType.familyId.toString()).toBe(testFamily._id.toString());
    expect(savedIncomeType.name).toBe(incomeTypeData.name);
    expect(savedIncomeType.description).toBe(incomeTypeData.description);
    expect(savedIncomeType._id).toBeDefined();
  });

  it("should create income type with default empty description", async () => {
    const incomeTypeData = {
      familyId: testFamily._id,
      name: "Freelance",
    };

    const incomeType = new IncomeType(incomeTypeData);
    const savedIncomeType = await incomeType.save();

    expect(savedIncomeType.description).toBe("");
  });

  it("should fail validation without name", async () => {
    const incomeType = new IncomeType({
      familyId: testFamily._id,
      description: "Some description",
    });

    let error;
    try {
      await incomeType.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("should enforce unique name constraint per family", async () => {
    await IncomeType.create({
      familyId: testFamily._id,
      name: "Salary",
      description: "Monthly salary",
    });

    const duplicateIncomeType = new IncomeType({
      familyId: testFamily._id,
      name: "Salary",
      description: "Different description",
    });

    let error;
    try {
      await duplicateIncomeType.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });

  it("should find income types by name", async () => {
    await IncomeType.create([
      {
        familyId: testFamily._id,
        name: "Salary",
        description: "Monthly salary",
      },
      { familyId: testFamily._id, name: "Bonus", description: "Annual bonus" },
      {
        familyId: testFamily._id,
        name: "Freelance",
        description: "Freelance work",
      },
    ]);

    const salary = await IncomeType.findOne({ name: "Salary" });
    expect(salary.description).toBe("Monthly salary");
  });

  it("should update income type fields", async () => {
    const incomeType = await IncomeType.create({
      familyId: testFamily._id,
      name: "Consultation",
      description: "Old description",
    });

    incomeType.description = "Updated consultation description";
    const updatedIncomeType = await incomeType.save();

    expect(updatedIncomeType.description).toBe(
      "Updated consultation description"
    );
  });

  it("should allow empty description", async () => {
    const incomeType = await IncomeType.create({
      familyId: testFamily._id,
      name: "Unknown",
      description: "",
    });

    expect(incomeType.description).toBe("");
  });
});
