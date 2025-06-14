const IncomeType = require("../IncomeType");

describe("IncomeType Schema", () => {
  it("should create income type with required fields", async () => {
    const incomeTypeData = {
      name: "Salary",
      description: "Monthly salary income",
    };

    const incomeType = new IncomeType(incomeTypeData);
    const savedIncomeType = await incomeType.save();

    expect(savedIncomeType.name).toBe(incomeTypeData.name);
    expect(savedIncomeType.description).toBe(incomeTypeData.description);
    expect(savedIncomeType._id).toBeDefined();
  });

  it("should create income type with default empty description", async () => {
    const incomeTypeData = {
      name: "Freelance",
    };

    const incomeType = new IncomeType(incomeTypeData);
    const savedIncomeType = await incomeType.save();

    expect(savedIncomeType.description).toBe("");
  });

  it("should fail validation without name", async () => {
    const incomeType = new IncomeType({
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

  it("should enforce unique name constraint", async () => {
    await IncomeType.create({
      name: "Salary",
      description: "Monthly salary",
    });

    const duplicateIncomeType = new IncomeType({
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
      { name: "Salary", description: "Monthly salary" },
      { name: "Bonus", description: "Annual bonus" },
      { name: "Freelance", description: "Freelance work" },
    ]);

    const salary = await IncomeType.findOne({ name: "Salary" });
    expect(salary.description).toBe("Monthly salary");
  });

  it("should update income type fields", async () => {
    const incomeType = await IncomeType.create({
      name: "Consultation",
      description: "Old description",
    });

    incomeType.description = "Updated consultation description";
    const updatedIncomeType = await incomeType.save();

    expect(updatedIncomeType.description).toBe("Updated consultation description");
  });

  it("should allow empty description", async () => {
    const incomeType = await IncomeType.create({
      name: "Unknown",
      description: "",
    });

    expect(incomeType.description).toBe("");
  });
}); 