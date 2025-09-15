const FamilyResolver = require("../Family");
const { User } = require("../../../database/schemas");
const userLoader = require("../../../loaders/userLoader");

// Mock database schemas
jest.mock("../../../database/schemas", () => ({
  User: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    }),
  },
}));

// Mock userLoader
jest.mock("../../../loaders/userLoader", () => ({
  load: jest.fn(),
}));

describe("Family type resolver", () => {
  let mockUserQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock query object
    mockUserQuery = {
      sort: jest.fn().mockResolvedValue([]),
    };
    User.find.mockReturnValue(mockUserQuery);
  });

  describe("owner resolver", () => {
    it("should load owner using userLoader", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        ownerId: "owner-id",
      };

      const mockOwner = {
        _id: "owner-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      userLoader.load.mockResolvedValue(mockOwner);

      const result = await FamilyResolver.owner(family);

      expect(userLoader.load).toHaveBeenCalledWith("owner-id");
      expect(result).toEqual(mockOwner);
    });

    it("should return null if ownerId is missing", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        ownerId: null,
      };

      const result = await FamilyResolver.owner(family);

      expect(userLoader.load).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if ownerId is undefined", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        // ownerId is undefined
      };

      const result = await FamilyResolver.owner(family);

      expect(userLoader.load).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should handle userLoader errors gracefully", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        ownerId: "owner-id",
      };

      userLoader.load.mockRejectedValue(new Error("User not found"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await FamilyResolver.owner(family);

      expect(userLoader.load).toHaveBeenCalledWith("owner-id");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading family owner:",
        expect.any(Error)
      );
      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it("should convert ObjectId ownerId to string", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        ownerId: { toString: () => "owner-object-id" }, // Mock ObjectId
      };

      const mockOwner = {
        _id: "owner-object-id",
        firstName: "Jane",
        lastName: "Smith",
      };

      userLoader.load.mockResolvedValue(mockOwner);

      const result = await FamilyResolver.owner(family);

      expect(userLoader.load).toHaveBeenCalledWith("owner-object-id");
      expect(result).toEqual(mockOwner);
    });
  });

  describe("members resolver", () => {
    it("should return all active family members sorted correctly", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
      };

      const mockMembers = [
        {
          _id: "owner-id",
          firstName: "Alice",
          lastName: "Owner",
          roleInFamily: "OWNER",
          isActive: true,
          familyId: "family-id",
        },
        {
          _id: "admin-id",
          firstName: "Bob",
          lastName: "Admin",
          roleInFamily: "ADMIN",
          isActive: true,
          familyId: "family-id",
        },
        {
          _id: "member1-id",
          firstName: "Charlie",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
          familyId: "family-id",
        },
        {
          _id: "member2-id",
          firstName: "David",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
          familyId: "family-id",
        },
      ];

      mockUserQuery.sort.mockResolvedValue(mockMembers);

      const result = await FamilyResolver.members(family);

      expect(User.find).toHaveBeenCalledWith({
        familyId: "family-id",
        isActive: true,
      });
      expect(mockUserQuery.sort).toHaveBeenCalledWith({
        roleInFamily: 1,
        firstName: 1,
      });

      expect(result).toEqual(mockMembers);
    });

    it("should return empty array if no members found", async () => {
      const family = {
        _id: "empty-family-id",
        name: "Empty Family",
      };

      mockUserQuery.sort.mockResolvedValue([]);
      User.find.mockReturnValue(mockUserQuery);

      const result = await FamilyResolver.members(family);

      expect(User.find).toHaveBeenCalledWith({
        familyId: "empty-family-id",
        isActive: true,
      });
      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
      };

      mockUserQuery.sort.mockRejectedValue(
        new Error("Database connection error")
      );
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await FamilyResolver.members(family);

      expect(User.find).toHaveBeenCalledWith({
        familyId: "family-id",
        isActive: true,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading family members:",
        expect.any(Error)
      );
      expect(result).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it("should only return active members", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
      };

      const mockMembers = [
        {
          _id: "active-member-id",
          firstName: "Active",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
          familyId: "family-id",
        },
        // Inactive members should not be returned by the query
      ];

      mockUserQuery.sort.mockResolvedValue(mockMembers);

      const result = await FamilyResolver.members(family);

      expect(User.find).toHaveBeenCalledWith({
        familyId: "family-id",
        isActive: true, // Only active members
      });
      expect(result).toEqual(mockMembers);
    });

    it("should handle ObjectId family._id", async () => {
      const family = {
        _id: { toString: () => "family-object-id" }, // Mock ObjectId
        name: "Test Family",
      };

      const mockMembers = [
        {
          _id: "member-id",
          firstName: "Test",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
          familyId: "family-object-id",
        },
      ];

      mockUserQuery.sort.mockResolvedValue(mockMembers);

      const result = await FamilyResolver.members(family);

      expect(User.find).toHaveBeenCalledWith({
        familyId: "family-object-id",
        isActive: true,
      });
      expect(result).toEqual(mockMembers);
    });

    it("should sort members by role then firstName", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
      };

      // Mock members are already sorted in expected order
      const mockMembers = [
        {
          _id: "owner-id",
          firstName: "Zebra", // Should come first due to OWNER role
          lastName: "Owner",
          roleInFamily: "OWNER",
          isActive: true,
        },
        {
          _id: "admin-id",
          firstName: "Alice", // Should come before Bob due to firstName
          lastName: "Admin",
          roleInFamily: "ADMIN",
          isActive: true,
        },
        {
          _id: "admin2-id",
          firstName: "Bob",
          lastName: "Admin2",
          roleInFamily: "ADMIN",
          isActive: true,
        },
        {
          _id: "member-id",
          firstName: "Charlie",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
        },
      ];

      mockUserQuery.sort.mockResolvedValue(mockMembers);

      const result = await FamilyResolver.members(family);

      expect(mockUserQuery.sort).toHaveBeenCalledWith({
        roleInFamily: 1,
        firstName: 1,
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe("context and args handling", () => {
    it("should work without context or args parameters", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
        ownerId: "owner-id",
      };

      const mockOwner = {
        _id: "owner-id",
        firstName: "Test",
        lastName: "Owner",
      };

      userLoader.load.mockResolvedValue(mockOwner);

      const result = await FamilyResolver.owner(family, null, null);

      expect(result).toEqual(mockOwner);
    });

    it("should work with context and args parameters", async () => {
      const family = {
        _id: "family-id",
        name: "Test Family",
      };

      const mockMembers = [
        {
          _id: "member-id",
          firstName: "Test",
          lastName: "Member",
          roleInFamily: "MEMBER",
          isActive: true,
        },
      ];

      mockUserQuery.sort.mockResolvedValue(mockMembers);

      const mockArgs = {};
      const mockContext = { auth: { user: { id: "user-id" } } };

      const result = await FamilyResolver.members(
        family,
        mockArgs,
        mockContext
      );

      expect(result).toEqual(mockMembers);
    });
  });
});
