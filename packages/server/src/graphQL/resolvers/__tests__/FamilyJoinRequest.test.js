const FamilyJoinRequestResolver = require("../FamilyJoinRequest");

describe("FamilyJoinRequest Resolver", () => {
  describe("id resolver", () => {
    it("should return _id when available", () => {
      const familyJoinRequest = { _id: "507f1f77bcf86cd799439011" };
      const result = FamilyJoinRequestResolver.id(familyJoinRequest);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return id when _id is not available", () => {
      const familyJoinRequest = { id: "507f1f77bcf86cd799439011" };
      const result = FamilyJoinRequestResolver.id(familyJoinRequest);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return _id when both _id and id are available", () => {
      const familyJoinRequest = { 
        _id: "507f1f77bcf86cd799439011", 
        id: "differentid" 
      };
      const result = FamilyJoinRequestResolver.id(familyJoinRequest);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return undefined when neither _id nor id are available", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.id(familyJoinRequest);
      expect(result).toBeUndefined();
    });
  });

  describe("user resolver", () => {
    it("should return populated user object", () => {
      const mockUser = { _id: "user123", name: "John Doe", email: "john@example.com" };
      const familyJoinRequest = { userId: mockUser };
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toEqual(mockUser);
    });

    it("should return null when userId is just a string ID", () => {
      const familyJoinRequest = { userId: "user123" };
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when userId is an object without _id", () => {
      const familyJoinRequest = { userId: { name: "John Doe" } };
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when userId is null", () => {
      const familyJoinRequest = { userId: null };
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when userId is undefined", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toBeNull();
    });
  });

  describe("family resolver", () => {
    it("should return populated family object", () => {
      const mockFamily = { _id: "family123", name: "Smith Family", ownerId: "owner123" };
      const familyJoinRequest = { familyId: mockFamily };
      const result = FamilyJoinRequestResolver.family(familyJoinRequest);
      expect(result).toEqual(mockFamily);
    });

    it("should return null when familyId is just a string ID", () => {
      const familyJoinRequest = { familyId: "family123" };
      const result = FamilyJoinRequestResolver.family(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when familyId is an object without _id", () => {
      const familyJoinRequest = { familyId: { name: "Smith Family" } };
      const result = FamilyJoinRequestResolver.family(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when familyId is null", () => {
      const familyJoinRequest = { familyId: null };
      const result = FamilyJoinRequestResolver.family(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when familyId is undefined", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.family(familyJoinRequest);
      expect(result).toBeNull();
    });
  });

  describe("owner resolver", () => {
    it("should return populated owner object", () => {
      const mockOwner = { _id: "owner123", name: "Jane Doe", email: "jane@example.com" };
      const familyJoinRequest = { ownerId: mockOwner };
      const result = FamilyJoinRequestResolver.owner(familyJoinRequest);
      expect(result).toEqual(mockOwner);
    });

    it("should return null when ownerId is just a string ID", () => {
      const familyJoinRequest = { ownerId: "owner123" };
      const result = FamilyJoinRequestResolver.owner(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when ownerId is an object without _id", () => {
      const familyJoinRequest = { ownerId: { name: "Jane Doe" } };
      const result = FamilyJoinRequestResolver.owner(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when ownerId is null", () => {
      const familyJoinRequest = { ownerId: null };
      const result = FamilyJoinRequestResolver.owner(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return null when ownerId is undefined", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.owner(familyJoinRequest);
      expect(result).toBeNull();
    });
  });

  describe("requestedAt resolver", () => {
    it("should convert Date object to ISO string", () => {
      const testDate = new Date("2024-01-01T12:00:00.000Z");
      const familyJoinRequest = { requestedAt: testDate };
      const result = FamilyJoinRequestResolver.requestedAt(familyJoinRequest);
      expect(result).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should return string value as-is", () => {
      const familyJoinRequest = { requestedAt: "2024-01-01T12:00:00.000Z" };
      const result = FamilyJoinRequestResolver.requestedAt(familyJoinRequest);
      expect(result).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should return null as-is", () => {
      const familyJoinRequest = { requestedAt: null };
      const result = FamilyJoinRequestResolver.requestedAt(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return undefined as-is", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.requestedAt(familyJoinRequest);
      expect(result).toBeUndefined();
    });
  });

  describe("respondedAt resolver", () => {
    it("should convert Date object to ISO string", () => {
      const testDate = new Date("2024-01-02T15:30:00.000Z");
      const familyJoinRequest = { respondedAt: testDate };
      const result = FamilyJoinRequestResolver.respondedAt(familyJoinRequest);
      expect(result).toBe("2024-01-02T15:30:00.000Z");
    });

    it("should return string value as-is", () => {
      const familyJoinRequest = { respondedAt: "2024-01-02T15:30:00.000Z" };
      const result = FamilyJoinRequestResolver.respondedAt(familyJoinRequest);
      expect(result).toBe("2024-01-02T15:30:00.000Z");
    });

    it("should return null as-is", () => {
      const familyJoinRequest = { respondedAt: null };
      const result = FamilyJoinRequestResolver.respondedAt(familyJoinRequest);
      expect(result).toBeNull();
    });

    it("should return undefined as-is", () => {
      const familyJoinRequest = {};
      const result = FamilyJoinRequestResolver.respondedAt(familyJoinRequest);
      expect(result).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty familyJoinRequest object", () => {
      const familyJoinRequest = {};
      
      expect(FamilyJoinRequestResolver.id(familyJoinRequest)).toBeUndefined();
      expect(FamilyJoinRequestResolver.user(familyJoinRequest)).toBeNull();
      expect(FamilyJoinRequestResolver.family(familyJoinRequest)).toBeNull();
      expect(FamilyJoinRequestResolver.owner(familyJoinRequest)).toBeNull();
      expect(FamilyJoinRequestResolver.requestedAt(familyJoinRequest)).toBeUndefined();
      expect(FamilyJoinRequestResolver.respondedAt(familyJoinRequest)).toBeUndefined();
    });

    it("should handle populated objects with extra fields", () => {
      const mockUser = { 
        _id: "user123", 
        name: "John", 
        email: "john@example.com",
        extraField: "extra"
      };
      const familyJoinRequest = { userId: mockUser };
      const result = FamilyJoinRequestResolver.user(familyJoinRequest);
      expect(result).toEqual(mockUser);
    });
  });
});
