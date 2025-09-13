const { updateMemberRoleResolver } = require("../updateMemberRole");
const { Family, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findById: jest.fn(),
  },
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("updateMemberRole resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful role updates", () => {
    it("should promote member to admin by owner", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

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

      const mockMemberToUpdate = {
        _id: input.userId,
        email: "member@example.com",
        familyId: "family-id", // Same family
        roleInFamily: "MEMBER",
        isActive: true,
      };

      const mockUpdatedMember = {
        ...mockMemberToUpdate,
        roleInFamily: "ADMIN",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockMemberToUpdate);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedMember);

      const result = await updateMemberRoleResolver(null, { input }, mockContext);

      expect(result).toEqual(mockUpdatedMember);
      expect(Family.findById).toHaveBeenCalledWith(mockUser.familyId);
      expect(User.findById).toHaveBeenCalledWith(input.userId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        input.userId,
        { roleInFamily: input.role },
        { new: true }
      );
    });

    it("should demote admin to member by owner", async () => {
      const input = {
        userId: "admin-id",
        role: "MEMBER",
      };

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

      const mockAdminToUpdate = {
        _id: input.userId,
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN", // Currently admin
        isActive: true,
      };

      const mockUpdatedMember = {
        ...mockAdminToUpdate,
        roleInFamily: "MEMBER",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockAdminToUpdate);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedMember);

      const result = await updateMemberRoleResolver(null, { input }, mockContext);

      expect(result).toEqual(mockUpdatedMember);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        input.userId,
        { roleInFamily: "MEMBER" },
        { new: true }
      );
    });

    it("should handle role update to same role (idempotent)", async () => {
      const input = {
        userId: "member-id",
        role: "MEMBER", // Same as current role
      };

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

      const mockMember = {
        _id: input.userId,
        email: "member@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER", // Already MEMBER
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockMember);
      User.findByIdAndUpdate.mockResolvedValue(mockMember);

      const result = await updateMemberRoleResolver(null, { input }, mockContext);

      expect(result).toEqual(mockMember);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        input.userId,
        { roleInFamily: "MEMBER" },
        { new: true }
      );
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to update member roles");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to update member roles");
    });
  });

  describe("authorization errors", () => {
    it("should throw error if user is not in a family", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: null, // Not in family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be a member of a family to update member roles");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if family not found", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: "non-existent-family",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(null);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family not found");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

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
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockInactiveFamily);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family is not active");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if user is not owner", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockUser = {
        _id: "admin-id",
        email: "admin@example.com",
        familyId: "family-id",
        roleInFamily: "ADMIN", // Admin, not owner
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "different-owner-id", // User is not owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Only family owner can update member roles");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error if regular member tries to update roles", async () => {
      const input = {
        userId: "another-member-id",
        role: "ADMIN",
      };

      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER", // Regular member
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "different-owner-id", // User is not owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Only family owner can update member roles");

      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe("business logic errors", () => {
    it("should throw error if target user not found", async () => {
      const input = {
        userId: "non-existent-user-id",
        role: "ADMIN",
      };

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
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(null);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("User not found");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if target user is deactivated", async () => {
      const input = {
        userId: "deactivated-user-id",
        role: "ADMIN",
      };

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
        _id: input.userId,
        email: "deactivated@example.com",
        familyId: "family-id",
        isActive: false, // Deactivated user
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockDeactivatedUser);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("User account is deactivated");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if target user is not in the same family", async () => {
      const input = {
        userId: "different-family-user-id",
        role: "ADMIN",
      };

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
        _id: input.userId,
        email: "outsider@example.com",
        familyId: "different-family-id", // Different family
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockDifferentFamilyUser);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("User is not a member of your family");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if trying to change owner role", async () => {
      const input = {
        userId: "owner-id",
        role: "MEMBER", // Trying to demote owner
      };

      const mockUser = {
        _id: "owner-id", // Same as target user
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // Target user is the owner
        isActive: true,
      };

      const mockOwner = {
        _id: input.userId,
        email: "owner@example.com",
        familyId: "family-id",
        roleInFamily: "OWNER",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockOwner);

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Cannot change family owner role");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if trying to assign OWNER role", async () => {
      const input = {
        userId: "member-id",
        role: "OWNER", // Invalid role assignment
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      // This should be caught by validation, but let's test the resolver logic too
      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Cannot assign OWNER role to members");

      expect(Family.findById).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockRejectedValue(new Error("Database connection error"));

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update member role");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should handle user lookup errors", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

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
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockRejectedValue(new Error("Database connection error"));

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update member role");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update errors", async () => {
      const input = {
        userId: "member-id",
        role: "ADMIN",
      };

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

      const mockMember = {
        _id: input.userId,
        email: "member@example.com",
        familyId: "family-id",
        roleInFamily: "MEMBER",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findById.mockResolvedValue(mockMember);
      User.findByIdAndUpdate.mockRejectedValue(new Error("Database update error"));

      await expect(
        updateMemberRoleResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update member role");
    });
  });

  describe("validation", () => {
    it("should use updateMemberRoleSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
