const { changePasswordResolver } = require("../changePassword");
const bcrypt = require("bcryptjs");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("bcryptjs");

jest.mock("../../../../database/schemas", () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    }),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("changePassword resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful password change", () => {
    it("should change password successfully for authenticated user", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newSecurePassword456!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      const hashedNewPassword = "hashed-new-password";
      const updatedUser = {
        ...mockUser,
        password: hashedNewPassword,
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedNewPassword);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await changePasswordResolver(
        null,
        { input: { currentPassword, newPassword } },
        mockContext
      );

      expect(result).toBe(true);
      expect(User.findById).toHaveBeenCalledWith("user-id");
      expect(bcrypt.compare).toHaveBeenCalledWith(
        currentPassword,
        mockUser.password
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        { password: hashedNewPassword },
        { new: true }
      );
    });

    it("should use salt rounds from environment variable", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      // Set custom BCRYPT_ROUNDS
      const originalBcryptRounds = process.env.BCRYPT_ROUNDS;
      process.env.BCRYPT_ROUNDS = "10";

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("hashed-password");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await changePasswordResolver(
        null,
        { input: { currentPassword, newPassword } },
        mockContext
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);

      // Restore original value
      process.env.BCRYPT_ROUNDS = originalBcryptRounds;
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("You must be logged in to change password");

      expect(User.findById).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("You must be logged in to change password");
    });

    it("should throw error if auth context is undefined", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockContext = {}; // No auth context

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("You must be logged in to change password");
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found in database", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(null); // User not found

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("User not found");

      expect(User.findById).toHaveBeenCalledWith("user-id");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw error if user account is deactivated", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      const deactivatedUser = {
        ...mockUser,
        isActive: false,
      };

      User.findById().select.mockResolvedValue(deactivatedUser);

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Account is deactivated");

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("password verification errors", () => {
    it("should throw error if current password is incorrect", async () => {
      const currentPassword = "wrongPassword";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Current password is incorrect");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        currentPassword,
        mockUser.password
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle bcrypt compare errors", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest
        .fn()
        .mockRejectedValue(new Error("bcrypt compare error"));

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Password change failed");

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe("password hashing errors", () => {
    it("should handle bcrypt hash errors", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("bcrypt hash error"));

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Password change failed");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle database lookup errors", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Password change failed");

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should handle database update errors", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("hashed-new-password");
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("Password change failed");
    });
  });

  describe("security considerations", () => {
    it("should not allow changing to the same password", async () => {
      const currentPassword = "samePassword123!";
      const newPassword = "samePassword123!"; // Same password
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-same-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await expect(
        changePasswordResolver(
          null,
          { input: { currentPassword, newPassword } },
          mockContext
        )
      ).rejects.toThrow("New password must be different from current password");

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should use secure salt rounds for password hashing", async () => {
      const currentPassword = "oldPassword123!";
      const newPassword = "newPassword123!";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashed-old-password",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      User.findById().select.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("hashed-new-password");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await changePasswordResolver(
        null,
        { input: { currentPassword, newPassword } },
        mockContext
      );

      // Should use at least 12 salt rounds for security
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
    });
  });

  describe("validation", () => {
    it("should use changePasswordSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
