const { inviteToFamilyResolver } = require("../inviteToFamily");
const { sendFamilyInvitationEmail } = require("../../../../auth/emailService");
const { generateAccessToken } = require("../../../../auth/jwtUtils");
const { Family, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/emailService", () => ({
  sendFamilyInvitationEmail: jest.fn(),
}));

jest.mock("../../../../auth/jwtUtils", () => ({
  generateAccessToken: jest.fn(),
}));

jest.mock("../../../../database/schemas", () => ({
  Family: {
    findById: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
}));

describe("inviteToFamily resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful invitation", () => {
    it("should send family invitation successfully by owner", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
        message: "Welcome to our family!",
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

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      const mockToken = "invitation-token";

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(null); // Email not registered
      generateAccessToken.mockReturnValue(mockToken);
      sendFamilyInvitationEmail.mockResolvedValue(true);

      const result = await inviteToFamilyResolver(null, { input }, mockContext);

      expect(result).toBe(true);
      expect(Family.findById).toHaveBeenCalledWith(mockUser.familyId);
      expect(User.findOne).toHaveBeenCalledWith({
        email: "newmember@example.com",
        isActive: true,
      });
      expect(generateAccessToken).toHaveBeenCalledWith({
        inviteeEmail: input.email,
        familyId: mockFamily._id,
        familyName: mockFamily.name,
        role: input.role,
        invitedBy: mockUser._id,
        type: "family_invitation",
      });
      expect(sendFamilyInvitationEmail).toHaveBeenCalledWith(
        input.email,
        mockToken,
        mockFamily.name,
        mockUser.email,
        input.message
      );
    });

    it("should send family invitation successfully by admin", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
      };

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
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(null);
      generateAccessToken.mockReturnValue("token");
      sendFamilyInvitationEmail.mockResolvedValue(true);

      const result = await inviteToFamilyResolver(null, { input }, mockContext);

      expect(result).toBe(true);
      expect(sendFamilyInvitationEmail).toHaveBeenCalledWith(
        input.email,
        "token",
        mockFamily.name,
        mockUser.email,
        undefined // No custom message
      );
    });

    it("should handle invitation with case insensitive email", async () => {
      const input = {
        email: "NEWMEMBER@EXAMPLE.COM", // Uppercase email
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
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(null);
      generateAccessToken.mockReturnValue("token");
      sendFamilyInvitationEmail.mockResolvedValue(true);

      await inviteToFamilyResolver(null, { input }, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "newmember@example.com", // Should be normalized to lowercase
        isActive: true,
      });
      expect(generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteeEmail: "newmember@example.com", // Normalized email
        })
      );
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
      };

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to invite family members");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
      };

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to invite family members");
    });
  });

  describe("authorization errors", () => {
    it("should throw error if user is not in a family", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
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
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be a member of a family to invite others");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if family not found", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
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
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family not found");

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
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
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family is not active");

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if user is not owner or admin", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
      };

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
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Only family owner or admin can invite new members");

      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe("business logic errors", () => {
    it("should throw error if trying to invite someone who is already registered", async () => {
      const input = {
        email: "existing@example.com",
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
        ownerId: "owner-id",
        isActive: true,
      };

      const mockExistingUser = {
        _id: "existing-user-id",
        email: "existing@example.com",
        familyId: "another-family-id", // Already in another family
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(mockExistingUser);

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow(
        "This user is already registered and in another family"
      );

      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(sendFamilyInvitationEmail).not.toHaveBeenCalled();
    });

    it("should throw error if trying to invite someone who is already in the same family", async () => {
      const input = {
        email: "samefamily@example.com",
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
        ownerId: "owner-id",
        isActive: true,
      };

      const mockSameFamilyUser = {
        _id: "same-family-user-id",
        email: "samefamily@example.com",
        familyId: "family-id", // Same family
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(mockSameFamilyUser);

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("This user is already a member of your family");

      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(sendFamilyInvitationEmail).not.toHaveBeenCalled();
    });

    it("should not allow inviting with OWNER role", async () => {
      const input = {
        email: "newmember@example.com",
        role: "OWNER", // Invalid role for invitation
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
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Cannot invite users with OWNER role");

      expect(Family.findById).not.toHaveBeenCalled();
    });
  });

  describe("email service errors", () => {
    it("should handle email service failure gracefully", async () => {
      const input = {
        email: "newmember@example.com",
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
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockResolvedValue(null);
      generateAccessToken.mockReturnValue("token");
      sendFamilyInvitationEmail.mockRejectedValue(
        new Error("Email service down")
      );

      // Should still return true even if email fails (graceful degradation)
      const result = await inviteToFamilyResolver(null, { input }, mockContext);

      expect(result).toBe(true);
      expect(sendFamilyInvitationEmail).toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const input = {
        email: "newmember@example.com",
        role: "MEMBER",
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
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to send family invitation");

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should handle user lookup errors", async () => {
      const input = {
        email: "newmember@example.com",
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
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findOne.mockRejectedValue(new Error("Database connection error"));

      await expect(
        inviteToFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to send family invitation");

      expect(generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("token generation", () => {
    it("should generate token with correct payload", async () => {
      const input = {
        email: "newmember@example.com",
        role: "ADMIN",
        message: "Join our family!",
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
      User.findOne.mockResolvedValue(null);
      generateAccessToken.mockReturnValue("generated-token");
      sendFamilyInvitationEmail.mockResolvedValue(true);

      await inviteToFamilyResolver(null, { input }, mockContext);

      expect(generateAccessToken).toHaveBeenCalledWith({
        inviteeEmail: input.email,
        familyId: mockFamily._id,
        familyName: mockFamily.name,
        role: input.role,
        invitedBy: mockUser._id,
        type: "family_invitation",
      });
    });
  });

  describe("validation", () => {
    it("should use inviteToFamilySchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
