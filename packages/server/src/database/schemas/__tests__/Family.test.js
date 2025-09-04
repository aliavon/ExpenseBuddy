const Family = require("../Family");
const User = require("../User");
const Currency = require("../Currency");

describe("Family Schema", () => {
  let testUser, testCurrency;

  beforeEach(async () => {
    testCurrency = await Currency.create({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    });

    testUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });
  });

  it("should create family with required fields", async () => {
    const familyData = {
      name: "Doe Family",
      description: "Our family budget",
      ownerId: testUser._id,
      currency: testCurrency._id,
      timezone: "America/New_York",
    };

    const family = new Family(familyData);
    const savedFamily = await family.save();

    expect(savedFamily.name).toBe(familyData.name);
    expect(savedFamily.description).toBe(familyData.description);
    expect(savedFamily.ownerId.toString()).toBe(testUser._id.toString());
    expect(savedFamily.currency.toString()).toBe(testCurrency._id.toString());
    expect(savedFamily.timezone).toBe(familyData.timezone);
    expect(savedFamily.isActive).toBe(true);
    expect(savedFamily.inviteCode).toBeUndefined();
    expect(savedFamily.createdAt).toBeDefined();
    expect(savedFamily.updatedAt).toBeDefined();
  });

  it("should create family with default values", async () => {
    const familyData = {
      name: "Simple Family",
      ownerId: testUser._id,
      currency: testCurrency._id,
    };

    const family = new Family(familyData);
    const savedFamily = await family.save();

    expect(savedFamily.description).toBe("");
    expect(savedFamily.timezone).toBe("UTC");
    expect(savedFamily.isActive).toBe(true);
    expect(savedFamily.inviteCode).toBeUndefined();
    expect(savedFamily.inviteCodeExpires).toBe(null);
  });

  it("should fail validation without name", async () => {
    const family = new Family({
      ownerId: testUser._id,
      currency: testCurrency._id,
    });

    let error;
    try {
      await family.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("should fail validation without ownerId", async () => {
    const family = new Family({
      name: "Test Family",
      currency: testCurrency._id,
    });

    let error;
    try {
      await family.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.ownerId).toBeDefined();
  });

  it("should fail validation without currency", async () => {
    const family = new Family({
      name: "Test Family",
      ownerId: testUser._id,
    });

    let error;
    try {
      await family.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.currency).toBeDefined();
  });

  it("should generate invite code", async () => {
    const family = await Family.create({
      name: "Test Family",
      ownerId: testUser._id,
      currency: testCurrency._id,
    });

    const inviteCode = family.generateInviteCode();
    const savedFamily = await family.save();

    expect(inviteCode).toMatch(/^[A-F0-9]{16}$/); // 16 uppercase hex chars
    expect(savedFamily.inviteCode).toBe(inviteCode);
    expect(savedFamily.inviteCodeExpires).toBeInstanceOf(Date);
    expect(savedFamily.inviteCodeExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it("should validate invite code", async () => {
    const family = await Family.create({
      name: "Test Family",
      ownerId: testUser._id,
      currency: testCurrency._id,
    });

    // No invite code initially
    expect(family.isInviteCodeValid()).toBeFalsy();

    // Generate invite code
    family.generateInviteCode();
    await family.save();
    expect(family.isInviteCodeValid()).toBe(true);

    // Expired invite code
    family.inviteCodeExpires = new Date(Date.now() - 1000); // 1 second ago
    expect(family.isInviteCodeValid()).toBeFalsy();
  });

  it("should enforce unique invite codes", async () => {
    const anotherUser = await User.create({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      password: "securePassword123",
    });

    const family2 = new Family({
      name: "Family 2",
      ownerId: anotherUser._id,
      currency: testCurrency._id,
      inviteCode: "TESTCODE123", // Same invite code
    });

    let error;
    try {
      await family2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });

  it("should trim and validate name length", async () => {
    const longName = "A".repeat(101); // 101 characters
    const family = new Family({
      name: longName,
      ownerId: testUser._id,
      currency: testCurrency._id,
    });

    let error;
    try {
      await family.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });
});
