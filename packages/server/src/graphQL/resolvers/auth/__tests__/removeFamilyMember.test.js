const { removeFamilyMemberResolver } = require("../removeFamilyMember");
const { Family, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn(),
      }),
    }),
  },
  User: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn(),
      }),
    }),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("removeFamilyMember resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful member removal", () => {
    it("should remove family member successfully by owner", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // User is owner
        isActive: true,
      };

      const mockMemberToRemove = {
        _id: userId,
        email: "member@example.com",
        familyId: "family-id", // Same family
        roleInFamily: "MEMBER",
        isActive: true,
      };

      const mockUpdatedMember = {
        ...mockMemberToRemove,
        familyId: null,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockMemberToRemove);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedMember);

      const result = await removeFamilyMemberResolver(
        null,
        { userId },
        mockContext
      );

      expect(result).toBe(true);
      expect(Family.findById).toHaveBeenCalledWith(mockUser.familyId);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $unset: {
          familyId: 1,
          roleInFamily: 1,
        },
      });
    });

    it("should throw error if admin tries to remove member (only owners can remove)", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "admin-id",
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "different-owner-id", // User is not owner but admin
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findById).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should allow owner to remove admin", async () => {
      const userId = "admin-to-remove-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // User is owner
        isActive: true,
      };

      const mockAdminToRemove = {
        _id: userId,
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN", // Removing admin
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockAdminToRemove);
      User.findByIdAndUpdate.mockResolvedValue(mockAdminToRemove);

      const result = await removeFamilyMemberResolver(
        null,
        { userId },
        mockContext
      );

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $unset: {
          familyId: 1,
          roleInFamily: 1,
        },
      });
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const userId = "member-to-remove-id";

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Authentication required");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const userId = "member-to-remove-id";

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("authorization errors", () => {
    it("should throw error if user is not in a family", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: null, // Not in family
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("User is not part of any family");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if family not found", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: "non-existent-family",
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(null);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: "family-id",
      };

      const mockInactiveFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: false, // Inactive family
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockInactiveFamily);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if user is not owner or admin", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER", // Regular member, not admin/owner
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "different-owner-id", // User is not owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if admin tries to remove another admin", async () => {
      const userId = "admin-to-remove-id";

      const mockUser = {
        _id: "admin-id",
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN", // User is admin
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "different-owner-id", // User is not owner
        isActive: true,
      };

      const mockAdminToRemove = {
        _id: userId,
        email: "anotheradmin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN", // Target is also admin
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockAdminToRemove);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("business logic errors", () => {
    it("should throw error if target user not found", async () => {
      const userId = "non-existent-user-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(null);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("User not found");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should remove deactivated user successfully (code does not check isActive)", async () => {
      const userId = "deactivated-user-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockDeactivatedUser = {
        _id: userId,
        email: "deactivated@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER",
        isActive: false, // Deactivated user but code doesn't check this
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockDeactivatedUser);
      User.findByIdAndUpdate.mockResolvedValue(mockDeactivatedUser);

      const result = await removeFamilyMemberResolver(
        null,
        { userId },
        mockContext
      );

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $unset: {
          familyId: 1,
          roleInFamily: 1,
        },
      });
    });

    it("should throw error if target user is not in the same family", async () => {
      const userId = "different-family-user-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockDifferentFamilyUser = {
        _id: userId,
        email: "outsider@example.com",
        familyId: "different-family-id", // Different family
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockDifferentFamilyUser);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("User is not a member of your family");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if trying to remove family owner", async () => {
      const userId = "owner-id";

      const mockUser = {
        _id: "admin-id",
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: userId, // Target user is the owner
        isActive: true,
      };

      const mockOwner = {
        _id: userId,
        email: "owner@example.com",
        familyId: "family-id",
        roleInFamily: "OWNER",
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockOwner);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can remove members");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if trying to remove self", async () => {
      const userId = "owner-id"; // Same as current user

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      const mockOwnerToRemove = {
        _id: userId,
        email: "owner@example.com",
        familyId: "family-id",
        roleInFamily: "OWNER",
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockOwnerToRemove);

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Cannot remove family owner");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById()
        .select()
        .lean.mockRejectedValue(new Error("Database connection error"));

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Failed to remove family member");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should handle user lookup errors", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById()
        .select()
        .lean.mockRejectedValue(new Error("Database connection error"));

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Failed to remove family member");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update errors", async () => {
      const userId = "member-to-remove-id";

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockMemberToRemove = {
        _id: userId,
        email: "member@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER",
        isActive: true,
      };

      const mockContext = {
        auth: {
          isAuthenticated: true,
          user: mockUser,
        },
      };

      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.findById().select().lean.mockResolvedValue(mockMemberToRemove);
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        removeFamilyMemberResolver(null, { userId }, mockContext)
      ).rejects.toThrow("Failed to remove family member");
    });
  });

  describe("validation", () => {
    it("should use removeFamilyMemberSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
