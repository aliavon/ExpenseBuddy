const getUsers = require("../getUsers");
const User = require("../../../../database/schemas/User");

describe("getUsers resolver", () => {
  it("should return all users when no search provided", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" },
      { firstName: "Bob", lastName: "Wilson" }
    ]);

    const context = global.createMockContext();
    const result = await getUsers(null, {}, context);

    expect(result).toHaveLength(3);
    const firstNames = result.map(user => user.firstName);
    expect(firstNames).toContain("John");
    expect(firstNames).toContain("Jane");
    expect(firstNames).toContain("Bob");
  });

  it("should return users filtered by search", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" },
      { firstName: "John", lastName: "Wilson" }
    ]);

    const context = global.createMockContext();
    const args = { search: "John" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2);
    expect(result.every(user => user.fullName.includes("John"))).toBe(true);
  });

  it("should return users filtered by last name", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" },
      { firstName: "Bob", lastName: "Doe" }
    ]);

    const context = global.createMockContext();
    const args = { search: "Doe" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2);
    expect(result.every(user => user.fullName.includes("Doe"))).toBe(true);
  });

  it("should return empty array when no users match search", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" }
    ]);

    const context = global.createMockContext();
    const args = { search: "NonExistent" };
    const result = await getUsers(null, args, context);

    expect(result).toEqual([]);
  });

  it("should return empty array when no users exist", async () => {
    const context = global.createMockContext();
    const result = await getUsers(null, {}, context);

    expect(result).toEqual([]);
  });

  it("should handle empty search string", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" }
    ]);

    const context = global.createMockContext();
    const args = { search: "" };
    const result = await getUsers(null, args, context);

    expect(result).toHaveLength(2); // Should return all users
  });

  it("should handle database errors", async () => {
    const spy = jest.spyOn(User, "aggregate").mockRejectedValue(new Error("Database error"));
    const context = global.createMockContext();

    await expect(getUsers(null, {}, context)).rejects.toThrow("Database error");
    spy.mockRestore();
  });
}); 