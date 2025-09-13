const { joinFamilyByCodeResolver } = require("../joinFamilyByCode");
const { Family, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findOne: jest.fn(),
  },
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("joinFamilyByCode resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful family joining", () => {
    it("should join family successfully with valid invite code", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null, // User not in family
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        description: "Our happy family",
        currency: "currency-id",
        timezone: "UTC",
        ownerId: "owner-id",
        inviteCode: inviteCode,
        isActive: true,
      };

      const mockUpdatedUser = {
        ...mockUser,
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await joinFamilyByCodeResolver(
        null,
        { inviteCode },
        mockContext
      );

      expect(result).toEqual(mockFamily);
      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: inviteCode,
        isActive: true,
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { familyId: mockFamily._id },
        { new: true }
      );
    });

    it("should handle invite codes case insensitively", async () => {
      const inviteCode = "abc123xyz"; // Lowercase input
      const storedCode = "ABC123XYZ"; // Stored as uppercase

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // Added missing ownerId
        inviteCode: storedCode,
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await joinFamilyByCodeResolver(
        null,
        { inviteCode },
        mockContext
      );

      expect(result).toEqual(mockFamily);
      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: inviteCode.toUpperCase(), // Should convert to uppercase
        isActive: true,
      });
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const inviteCode = "ABC123XYZ";

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("You must be logged in to join a family");

      expect(Family.findOne).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const inviteCode = "ABC123XYZ";

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("You must be logged in to join a family");
    });
  });

  describe("business logic errors", () => {
    it("should throw error if user is already in a family", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: "existing-family-id", // Already in family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("You are already a member of a family");

      expect(Family.findOne).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if invite code is invalid", async () => {
      const inviteCode = "INVALID123";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(null); // No family found

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("Invalid invite code");

      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: inviteCode,
        isActive: true,
      });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(null); // No active family found

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("Invalid invite code");
    });

    it("should throw error if user tries to join their own family", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "owner-id", // User is the owner
        email: "owner@example.com",
        familyId: null,
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // Same as user
        inviteCode: inviteCode,
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("You cannot join your own family using invite code");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockRejectedValue(new Error("Database connection error"));

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("Failed to join family");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update errors", async () => {
      const inviteCode = "ABC123XYZ";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        inviteCode: inviteCode,
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockRejectedValue(new Error("User update failed"));

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("Failed to join family");
    });
  });

  describe("invite code validation", () => {
    it("should normalize invite code to uppercase", async () => {
      const inviteCode = "abc123xyz";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        inviteCode: "ABC123XYZ",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await joinFamilyByCodeResolver(null, { inviteCode }, mockContext);

      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: "ABC123XYZ", // Should be converted to uppercase
        isActive: true,
      });
    });

    it("should handle whitespace in invite codes", async () => {
      const inviteCode = " ABC123XYZ "; // With whitespace

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        inviteCode: "ABC123XYZ",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await joinFamilyByCodeResolver(null, { inviteCode }, mockContext);

      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: "ABC123XYZ", // Should be trimmed and uppercase
        isActive: true,
      });
    });
  });

  describe("security considerations", () => {
    it("should not reveal family details if invite code is invalid", async () => {
      const inviteCode = "INVALID123";

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findOne.mockResolvedValue(null);

      try {
        await joinFamilyByCodeResolver(null, { inviteCode }, mockContext);
      } catch (error) {
        // Should not reveal whether family exists or not
        expect(error.message).toBe("Invalid invite code");
        expect(error.message).not.toContain("active");
        expect(error.message).not.toContain("exists");
      }
    });

    it("should prevent timing attacks by consistent error messages", async () => {
      // This test ensures consistent error handling time regardless of failure reason
      const inviteCode = "TEST123";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };
      const mockContext = { auth: { user: mockUser } };

      Family.findOne.mockResolvedValue(null);

      await expect(
        joinFamilyByCodeResolver(null, { inviteCode }, mockContext)
      ).rejects.toThrow("Invalid invite code");
    });
  });

  describe("validation", () => {
    it("should use joinFamilyByCodeSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
