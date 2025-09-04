const createUserLoader = require("../userLoader");
const User = require("../../database/schemas/User");

describe("userLoader", () => {
  let userLoader;

  beforeEach(() => {
    userLoader = createUserLoader();
  });

  it("should create a DataLoader instance", () => {
    expect(userLoader).toBeDefined();
    expect(typeof userLoader.load).toBe("function");
    expect(typeof userLoader.loadMany).toBe("function");
  });

  it("should load single user by id", async () => {
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
    });

    const result = await userLoader.load(user._id);
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
  });

  it("should load multiple users in batch", async () => {
    const users = await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" },
      { firstName: "Bob", lastName: "Wilson" },
    ]);

    const ids = users.map((u) => u._id);
    const results = await userLoader.loadMany(ids);

    expect(results).toHaveLength(3);
    expect(results[0].firstName).toBe("John");
    expect(results[1].firstName).toBe("Jane");
    expect(results[2].firstName).toBe("Bob");
  });

  it("should return null for non-existent user", async () => {
    const nonExistentId = global.createMockId();
    const result = await userLoader.load(nonExistentId);
    expect(result).toBeNull();
  });

  it("should handle mixed existing and non-existing users", async () => {
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
    });
    const nonExistentId = global.createMockId();

    const results = await userLoader.loadMany([user._id, nonExistentId]);
    expect(results).toHaveLength(2);
    expect(results[0].firstName).toBe("John");
    expect(results[1]).toBeNull();
  });

  it("should handle errors gracefully", async () => {
    const spy = jest
      .spyOn(User, "find")
      .mockRejectedValue(new Error("Database error"));

    await expect(userLoader.load(global.createMockId())).rejects.toThrow(
      "Database error"
    );
    spy.mockRestore();
  });
});
