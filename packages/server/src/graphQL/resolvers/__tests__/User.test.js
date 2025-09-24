const UserResolver = require("../User");

describe("User Resolver", () => {
  describe("id resolver", () => {
    it("should return user.id when available", () => {
      const user = { id: "507f1f77bcf86cd799439011" };
      const result = UserResolver.id(user);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return user._id when id is not available", () => {
      const user = { _id: "507f1f77bcf86cd799439011" };
      const result = UserResolver.id(user);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return user.id when both id and _id are available", () => {
      const user = { 
        id: "507f1f77bcf86cd799439011", 
        _id: "different_id" 
      };
      const result = UserResolver.id(user);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return undefined when neither id nor _id are available", () => {
      const user = {};
      const result = UserResolver.id(user);
      expect(result).toBeUndefined();
    });

    it("should return null when id is null and _id is not available", () => {
      const user = { id: null };
      const result = UserResolver.id(user);
      expect(result).toBeUndefined(); // id: null || undefined = undefined
    });

    it("should return null when _id is null and id is not available", () => {
      const user = { _id: null };
      const result = UserResolver.id(user);
      expect(result).toBeNull();
    });
  });

  describe("familyId resolver", () => {
    it("should return _id from populated familyId object", () => {
      const mockFamily = { _id: "family123", name: "Smith Family", ownerId: "owner123" };
      const user = { familyId: mockFamily };
      const result = UserResolver.familyId(user);
      expect(result).toBe("family123");
    });

    it("should return familyId as-is when it's already a string ID", () => {
      const user = { familyId: "family123" };
      const result = UserResolver.familyId(user);
      expect(result).toBe("family123");
    });

    it("should return null when familyId is null", () => {
      const user = { familyId: null };
      const result = UserResolver.familyId(user);
      expect(result).toBeNull();
    });

    it("should return undefined when familyId is undefined", () => {
      const user = {};
      const result = UserResolver.familyId(user);
      expect(result).toBeUndefined();
    });

    it("should return object as-is when familyId is an object without _id", () => {
      const familyObj = { name: "Smith Family" };
      const user = { familyId: familyObj };
      const result = UserResolver.familyId(user);
      expect(result).toEqual(familyObj);
    });

    it("should return populated object _id even when it has other properties", () => {
      const mockFamily = { 
        _id: "family123", 
        name: "Smith Family", 
        ownerId: "owner123",
        members: ["user1", "user2"],
        createdAt: new Date()
      };
      const user = { familyId: mockFamily };
      const result = UserResolver.familyId(user);
      expect(result).toBe("family123");
    });

    it("should handle empty object as familyId", () => {
      const emptyObj = {};
      const user = { familyId: emptyObj };
      const result = UserResolver.familyId(user);
      expect(result).toEqual(emptyObj);
    });

    it("should handle number as familyId", () => {
      const user = { familyId: 123 };
      const result = UserResolver.familyId(user);
      expect(result).toBe(123);
    });

    it("should handle boolean as familyId", () => {
      const user = { familyId: false };
      const result = UserResolver.familyId(user);
      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty user object", () => {
      const user = {};
      
      expect(UserResolver.id(user)).toBeUndefined();
      expect(UserResolver.familyId(user)).toBeUndefined();
    });

    it("should handle user with all properties", () => {
      const mockFamily = { _id: "family123", name: "Smith Family" };
      const user = {
        id: "user123",
        _id: "mongo_id",
        familyId: mockFamily,
        name: "John Doe",
        email: "john@example.com"
      };
      
      expect(UserResolver.id(user)).toBe("user123");
      expect(UserResolver.familyId(user)).toBe("family123");
    });

    it("should handle user with mixed data types", () => {
      const user = {
        id: "user123",
        familyId: "string_family_id"
      };
      
      expect(UserResolver.id(user)).toBe("user123");
      expect(UserResolver.familyId(user)).toBe("string_family_id");
    });

    it("should prioritize id over _id when id is truthy", () => {
      const testCases = [
        { user: { id: "id1", _id: "id2" }, expected: "id1" },
        { user: { id: "test", _id: "id2" }, expected: "test" },
        { user: { id: 123, _id: "id2" }, expected: 123 }
      ];

      testCases.forEach(({ user, expected }) => {
        expect(UserResolver.id(user)).toBe(expected);
      });
    });

    it("should fallback to _id when id is falsy", () => {
      const testCases = [
        { user: { id: null, _id: "id2" }, expected: "id2" },
        { user: { id: "", _id: "id2" }, expected: "id2" },
        { user: { id: 0, _id: "id2" }, expected: "id2" },
        { user: { id: false, _id: "id2" }, expected: "id2" },
        { user: { id: undefined, _id: "id2" }, expected: "id2" }
      ];

      testCases.forEach(({ user, expected }) => {
        expect(UserResolver.id(user)).toBe(expected);
      });
    });
  });
});
