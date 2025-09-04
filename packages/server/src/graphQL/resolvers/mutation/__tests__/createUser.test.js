const createUser = require("../createUser");
const { User } = require("../../../../database/schemas");

describe("createUser mutation", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const createUserData = (overrides = {}) => ({
    firstName: "John",
    lastName: "Doe",
    ...overrides,
  });

  it("should create user with required fields successfully", async () => {
    const userData = createUserData();
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.middleName).toBe(""); // default value
    expect(result.isVerified).toBe(false); // default value
    expect(result).toHaveProperty("_id");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
    expect(context.logger.info).toHaveBeenCalledWith(
      { id: result._id.toString() },
      "Successfully created user"
    );
  });

  it("should create user with all fields", async () => {
    const userData = createUserData({
      firstName: "Jane",
      middleName: "Marie",
      lastName: "Smith",
      isVerified: true,
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("Jane");
    expect(result.middleName).toBe("Marie");
    expect(result.lastName).toBe("Smith");
    expect(result.isVerified).toBe(true);
  });

  it("should handle empty middleName", async () => {
    const userData = createUserData({
      middleName: "",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.middleName).toBe("");
  });

  it("should handle special characters in names", async () => {
    const userData = createUserData({
      firstName: "José",
      middleName: "María",
      lastName: "García-López",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("José");
    expect(result.middleName).toBe("María");
    expect(result.lastName).toBe("García-López");
  });

  it("should handle very long names", async () => {
    const longName = "A".repeat(100);
    const userData = createUserData({
      firstName: longName,
      lastName: longName,
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe(longName);
    expect(result.lastName).toBe(longName);
  });

  it("should handle names with spaces", async () => {
    const userData = createUserData({
      firstName: "Mary Jane",
      lastName: "Watson Parker",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("Mary Jane");
    expect(result.lastName).toBe("Watson Parker");
  });

  it("should handle names with numbers", async () => {
    const userData = createUserData({
      firstName: "John2",
      lastName: "Doe3rd",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("John2");
    expect(result.lastName).toBe("Doe3rd");
  });

  it("should create multiple users successfully", async () => {
    const context = global.createMockContext();

    const user1 = await createUser(
      null,
      { user: createUserData({ firstName: "Alice" }) },
      context
    );

    const user2 = await createUser(
      null,
      { user: createUserData({ firstName: "Bob" }) },
      context
    );

    expect(user1.firstName).toBe("Alice");
    expect(user2.firstName).toBe("Bob");
    expect(user1._id.toString()).not.toBe(user2._id.toString());
  });

  it("should set timestamps correctly", async () => {
    const userData = createUserData();
    const context = global.createMockContext();
    const beforeCreate = new Date();

    const result = await createUser(null, { user: userData }, context);

    const afterCreate = new Date();

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime()
    );
    expect(result.createdAt.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime()
    );
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime()
    );
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime()
    );
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();

    // Mock User.create to throw an error
    const originalCreate = User.create;
    User.create = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(
      createUser(null, { user: createUserData() }, context)
    ).rejects.toThrow("Database connection failed");

    // Restore original method
    User.create = originalCreate;
  });

  it("should handle validation errors for missing required fields", async () => {
    const context = global.createMockContext();

    // Test missing firstName
    await expect(
      createUser(null, { user: { lastName: "Doe" } }, context)
    ).rejects.toThrow();

    // Test missing lastName
    await expect(
      createUser(null, { user: { firstName: "John" } }, context)
    ).rejects.toThrow();
  });

  it("should persist user in database", async () => {
    const userData = createUserData();
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    // Verify user was actually saved to database
    const savedUser = await User.findById(result._id);
    expect(savedUser).not.toBeNull();
    expect(savedUser.firstName).toBe("John");
    expect(savedUser.lastName).toBe("Doe");
  });

  it("should handle null middleName", async () => {
    const userData = createUserData({
      middleName: null,
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    // Mongoose preserves null values when explicitly set
    expect(result.middleName).toBeNull();
  });

  it("should handle boolean isVerified correctly", async () => {
    const context = global.createMockContext();

    // Test explicit false
    const unverifiedUser = await createUser(
      null,
      { user: createUserData({ isVerified: false }) },
      context
    );
    expect(unverifiedUser.isVerified).toBe(false);

    // Test explicit true
    const verifiedUser = await createUser(
      null,
      { user: createUserData({ isVerified: true }) },
      context
    );
    expect(verifiedUser.isVerified).toBe(true);
  });

  it("should handle unicode characters in names", async () => {
    const userData = createUserData({
      firstName: "李",
      middleName: "小",
      lastName: "明",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("李");
    expect(result.middleName).toBe("小");
    expect(result.lastName).toBe("明");
  });

  it("should handle emoji in names", async () => {
    const userData = createUserData({
      firstName: "John 😊",
      lastName: "Doe 🎉",
    });
    const context = global.createMockContext();

    const result = await createUser(null, { user: userData }, context);

    expect(result.firstName).toBe("John 😊");
    expect(result.lastName).toBe("Doe 🎉");
  });
});
