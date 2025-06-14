const FamilyIncome = require("../FamilyIncome");
const User = require("../User");
const IncomeType = require("../IncomeType");
const Currency = require("../Currency");
const { PERIODICITY, PERIODICITY_VALUES } = require("../../../constants/familyIncomeEnums");

describe("FamilyIncome Schema", () => {
  let testUser, testIncomeType, testCurrency;

  beforeEach(async () => {
    testUser = await User.create({
      firstName: "John",
      lastName: "Doe",
    });

    testIncomeType = await IncomeType.create({
      name: "Salary",
      description: "Monthly salary",
    });

    testCurrency = await Currency.create({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    });
  });

  it("should create family income with required fields", async () => {
    const familyIncomeData = {
      date: new Date("2023-01-01"),
      amount: 5000,
      typeId: testIncomeType._id,
      contributorId: testUser._id,
      currencyId: testCurrency._id,
      periodicity: PERIODICITY.MONTHLY,
      note: "January salary",
    };

    const familyIncome = new FamilyIncome(familyIncomeData);
    const savedFamilyIncome = await familyIncome.save();

    expect(savedFamilyIncome.date).toEqual(familyIncomeData.date);
    expect(savedFamilyIncome.amount).toBe(familyIncomeData.amount);
    expect(savedFamilyIncome.typeId.toString()).toBe(testIncomeType._id.toString());
    expect(savedFamilyIncome.contributorId.toString()).toBe(testUser._id.toString());
    expect(savedFamilyIncome.currencyId.toString()).toBe(testCurrency._id.toString());
    expect(savedFamilyIncome.periodicity).toBe(familyIncomeData.periodicity);
    expect(savedFamilyIncome.note).toBe(familyIncomeData.note);
  });

  it("should create family income with default values", async () => {
    const familyIncomeData = {
      date: new Date(),
      amount: 1000,
      typeId: testIncomeType._id,
      contributorId: testUser._id,
      currencyId: testCurrency._id,
    };

    const familyIncome = new FamilyIncome(familyIncomeData);
    const savedFamilyIncome = await familyIncome.save();

    expect(savedFamilyIncome.periodicity).toBe(PERIODICITY.ONE_TIME);
    expect(savedFamilyIncome.note).toBe("");
  });

  it("should fail validation without required fields", async () => {
    const requiredFields = [
      { field: "date", data: { amount: 1000, typeId: testIncomeType._id, contributorId: testUser._id, currencyId: testCurrency._id } },
      { field: "amount", data: { date: new Date(), typeId: testIncomeType._id, contributorId: testUser._id, currencyId: testCurrency._id } },
      { field: "typeId", data: { date: new Date(), amount: 1000, contributorId: testUser._id, currencyId: testCurrency._id } },
      { field: "contributorId", data: { date: new Date(), amount: 1000, typeId: testIncomeType._id, currencyId: testCurrency._id } },
      { field: "currencyId", data: { date: new Date(), amount: 1000, typeId: testIncomeType._id, contributorId: testUser._id } },
    ];

    for (const testCase of requiredFields) {
      const familyIncome = new FamilyIncome(testCase.data);
      
      let error;
      try {
        await familyIncome.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors[testCase.field]).toBeDefined();
    }
  });

  it("should validate amount is positive", async () => {
    const familyIncome = new FamilyIncome({
      date: new Date(),
      amount: -100,
      typeId: testIncomeType._id,
      contributorId: testUser._id,
      currencyId: testCurrency._id,
    });

    let error;
    try {
      await familyIncome.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.amount).toBeDefined();
    expect(error.errors.amount.message).toContain("Amount must be positive");
  });

  it("should validate periodicity enum values", async () => {
    const familyIncome = new FamilyIncome({
      date: new Date(),
      amount: 1000,
      typeId: testIncomeType._id,
      contributorId: testUser._id,
      currencyId: testCurrency._id,
      periodicity: "INVALID_PERIODICITY",
    });

    let error;
    try {
      await familyIncome.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.periodicity).toBeDefined();
  });

  it("should accept all valid periodicity values", async () => {
    for (const periodicity of PERIODICITY_VALUES) {
      const familyIncome = await FamilyIncome.create({
        date: new Date(),
        amount: 1000,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
        periodicity,
      });

      expect(familyIncome.periodicity).toBe(periodicity);
    }
  });

  it("should populate references", async () => {
    const familyIncome = await FamilyIncome.create({
      date: new Date(),
      amount: 2000,
      typeId: testIncomeType._id,
      contributorId: testUser._id,
      currencyId: testCurrency._id,
    });

    const populatedIncome = await FamilyIncome.findById(familyIncome._id)
      .populate("typeId")
      .populate("contributorId")
      .populate("currencyId");

    expect(populatedIncome.typeId.name).toBe(testIncomeType.name);
    expect(populatedIncome.contributorId.firstName).toBe(testUser.firstName);
    expect(populatedIncome.currencyId.code).toBe(testCurrency.code);
  });

  it("should find income by date range", async () => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");
    const outsideDate = new Date("2024-01-01");

    await FamilyIncome.create([
      {
        date: startDate,
        amount: 1000,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
      },
      {
        date: new Date("2023-06-15"),
        amount: 1500,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
      },
      {
        date: outsideDate,
        amount: 2000,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
      },
    ]);

    const incomes = await FamilyIncome.find({
      date: { $gte: startDate, $lte: endDate }
    });

    expect(incomes).toHaveLength(2);
  });

  it("should find income by contributor", async () => {
    const anotherUser = await User.create({
      firstName: "Jane",
      lastName: "Smith",
    });

    await FamilyIncome.create([
      {
        date: new Date(),
        amount: 1000,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
      },
      {
        date: new Date(),
        amount: 1200,
        typeId: testIncomeType._id,
        contributorId: anotherUser._id,
        currencyId: testCurrency._id,
      },
    ]);

    const johnsIncomes = await FamilyIncome.find({ contributorId: testUser._id });
    expect(johnsIncomes).toHaveLength(1);
    expect(johnsIncomes[0].amount).toBe(1000);
  });

  it("should handle date indexing for performance", async () => {
    const incomes = [];
    for (let i = 0; i < 5; i++) {
      incomes.push({
        date: new Date(2023, i, 1),
        amount: 1000 + i * 100,
        typeId: testIncomeType._id,
        contributorId: testUser._id,
        currencyId: testCurrency._id,
      });
    }

    await FamilyIncome.create(incomes);

    const sortedIncomes = await FamilyIncome.find({}).sort({ date: 1 });
    
    for (let i = 1; i < sortedIncomes.length; i++) {
      expect(sortedIncomes[i].date.getTime()).toBeGreaterThanOrEqual(
        sortedIncomes[i - 1].date.getTime()
      );
    }
  });
}); 