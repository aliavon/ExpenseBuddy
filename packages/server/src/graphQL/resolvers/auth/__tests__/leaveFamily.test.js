const { leaveFamilyResolver } = require("../leaveFamily");
const { Family, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findById: jest.fn(),
  },
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("leaveFamily resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful family leaving", () => {
    it("should allow family member to leave successfully", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // Different from user
        isActive: true,
      };

      const mockUpdatedUser = {
        ...mockUser,
        familyId: null, // Removed from family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await leaveFamilyResolver(null, {}, mockContext);

      expect(result).toBe(true);
      expect(Family.findById).toHaveBeenCalledWith(mockUser.familyId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { familyId: null },
        { new: true }
      );
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "You must be logged in to leave a family"
      );

      expect(Family.findById).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "You must be logged in to leave a family"
      );
    });
  });

  describe("business logic errors", () => {
    it("should throw error if user is not in a family", async () => {
      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: null, // Not in any family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "You are not a member of any family"
      );

      expect(Family.findById).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if family owner tries to leave", async () => {
      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "owner-id", // Same as user - user is owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Family owner cannot leave the family. Transfer ownership or delete the family first."
      );

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if family not found", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "non-existent-family",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(null); // Family not found

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
      );

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
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

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Family is not active"
      );

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockRejectedValue(new Error("Database connection error"));

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Failed to leave family"
      );

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update errors", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
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
      User.findByIdAndUpdate.mockRejectedValue(new Error("User update failed"));

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Failed to leave family"
      );
    });
  });

  describe("authorization and security", () => {
    it("should prevent data inconsistency by checking family membership", async () => {
      const mockUser = {
        _id: "hacker-id",
        email: "hacker@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: "legitimate-owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await leaveFamilyResolver(null, {}, mockContext);

      expect(result).toBe(true);
      // Should still work - user has familyId and is not owner, so can leave
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "hacker-id",
        { familyId: null },
        { new: true }
      );
    });

    it("should handle edge case of user with familyId but family doesn't exist", async () => {
      const mockUser = {
        _id: "orphan-id",
        email: "orphan@example.com",
        familyId: "deleted-family-id", // Family was deleted but user still has familyId
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(null); // Family doesn't exist

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
      );
    });
  });

  describe("ownership validation", () => {
    it("should correctly identify owner by ObjectId comparison", async () => {
      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: { toString: () => "owner-id" }, // Simulate MongoDB ObjectId
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(leaveFamilyResolver(null, {}, mockContext)).rejects.toThrow(
        "Family owner cannot leave the family"
      );
    });

    it("should allow member to leave when IDs are different", async () => {
      const mockUser = {
        _id: "member-id",
        email: "member@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Smith Family",
        ownerId: { toString: () => "different-owner-id" }, // Different owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await leaveFamilyResolver(null, {}, mockContext);

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
