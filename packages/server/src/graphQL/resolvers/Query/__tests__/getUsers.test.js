const getUsers = require("../getUsers");
const User = require("../../../../database/schemas/User");

describe("getUsers resolver", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Helper to create users with proper family and auth fields
  const createUserWithFamily = (familyId, userData) => ({
    email: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}@test.com`,
    password: "hashedpassword123",
    familyId,
    isActive: true,
    isEmailVerified: true,
    ...userData,
  });

  it("should return all users when no search provided", async () => {
    const context = global.createMockContext();

    const users = [
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Bob",
        lastName: "Wilson",
      }),
    ];

    await User.create(users);

    const result = await getUsers(null, {}, context);

    expect(result).toHaveLength(3);
    const firstNames = result.map((user) => user.firstName);
    expect(firstNames).toContain("John");
    expect(firstNames).toContain("Jane");
    expect(firstNames).toContain("Bob");

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 3,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should return users filtered by search", async () => {
    const context = global.createMockContext();

    await User.create([
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Wilson",
      }),
    ]);

    const args = { search: "John" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2);
    expect(result.every((user) => user.fullName.includes("John"))).toBe(true);

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should return users filtered by last name", async () => {
    const context = global.createMockContext();

    await User.create([
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Bob",
        lastName: "Doe",
      }),
    ]);

    const args = { search: "Doe" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2);
    expect(result.every((user) => user.fullName.includes("Doe"))).toBe(true);

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should return empty array when no users match search", async () => {
    const context = global.createMockContext();

    await User.create([
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
    ]);

    const args = { search: "NonExistent" };
    const result = await getUsers(null, args, context);

    expect(result).toEqual([]);

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should handle empty search string", async () => {
    const context = global.createMockContext();

    await User.create([
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
    ]);

    const args = { search: "" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2); // Should return all users

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should only return users from the same family", async () => {
    const context = global.createMockContext();
    const otherFamilyId = global.createMockId();

    await User.create([
      // Users in auth user's family
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
      }),
      // Users in different family (should be filtered out)
      createUserWithFamily(otherFamilyId, {
        firstName: "Bob",
        lastName: "Wilson",
      }),
      createUserWithFamily(otherFamilyId, {
        firstName: "Alice",
        lastName: "Brown",
      }),
    ]);

    const result = await getUsers(null, {}, context);

    expect(result).toHaveLength(2);
    const firstNames = result.map((user) => user.firstName);
    expect(firstNames).toContain("John");
    expect(firstNames).toContain("Jane");
    expect(firstNames).not.toContain("Bob");
    expect(firstNames).not.toContain("Alice");

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });

  it("should only return active users", async () => {
    const context = global.createMockContext();

    await User.create([
      // Active users
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "John",
        lastName: "Doe",
      }),
      // Inactive user (should be filtered out)
      createUserWithFamily(context.auth.user.familyId, {
        firstName: "Jane",
        lastName: "Smith",
        isActive: false,
      }),
    ]);

    const result = await getUsers(null, {}, context);

    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("John");

    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family users by fullName"
    );
  });
});
