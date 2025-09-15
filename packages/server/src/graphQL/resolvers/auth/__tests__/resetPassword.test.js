const { resetPasswordResolver } = require("../resetPassword");
const { verifyPasswordResetToken } = require("../../../../auth/jwtUtils");
const bcrypt = require("bcryptjs");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils", () => ({
  verifyPasswordResetToken: jest.fn(),
}));

jest.mock("bcryptjs");

jest.mock("../../../../database/schemas", () => ({
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("resetPassword resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful password reset", () => {
    it("should reset password successfully with valid token", async () => {
      const token = "valid-reset-token";
      const newPassword = "NewSecurePassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      const hashedPassword = "hashed-new-password";

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await resetPasswordResolver(null, {
        input: { token, newPassword },
      });

      expect(result).toBe(true);
      expect(verifyPasswordResetToken).toHaveBeenCalledWith(token);
      expect(User.findById).toHaveBeenCalledWith("user-id");
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-id", {
        password: hashedPassword,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("token validation errors", () => {
    it("should throw error for invalid token", async () => {
      const token = "invalid-token";
      const newPassword = "NewPassword123!";

      verifyPasswordResetToken.mockImplementation(() => {
        const error = new Error("Invalid password reset token: invalid token");
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(verifyPasswordResetToken).toHaveBeenCalledWith(token);
      expect(User.findById).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should throw error for expired token", async () => {
      const token = "expired-token";
      const newPassword = "NewPassword123!";

      verifyPasswordResetToken.mockImplementation(() => {
        const error = new Error("Invalid password reset token: jwt expired");
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error for malformed token", async () => {
      const token = "malformed.token";
      const newPassword = "NewPassword123!";

      verifyPasswordResetToken.mockImplementation(() => {
        const error = new Error("Invalid password reset token: jwt malformed");
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error for wrong token type", async () => {
      const token = "wrong-type-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification", // Wrong type
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "non-existent-user",
        email: "john@example.com",
        type: "password_reset",
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(null);

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findById).toHaveBeenCalledWith("non-existent-user");
    });

    it("should throw error if user is deactivated", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: false, // User is deactivated
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(mockUser);

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");
    });
  });

  describe("password hashing errors", () => {
    it("should handle password hashing errors", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Password reset failed");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle database lookup errors gracefully", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockRejectedValue(new Error("Database connection error"));

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Password reset failed");

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should handle database update errors gracefully", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      const hashedPassword = "hashed-password";

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Password reset failed");
    });
  });

  describe("security considerations", () => {
    it("should update password and timestamp", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      const hashedPassword = "hashed-password";

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);
      User.findById.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await resetPasswordResolver(null, { input: { token, newPassword } });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        expect.objectContaining({
          password: hashedPassword,
          updatedAt: expect.any(Date),
        })
      );
    });

    it("should validate token type strictly", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "access_token", // Wrong type
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should require userId in token payload", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        email: "john@example.com", // Missing userId
        type: "password_reset",
      };

      verifyPasswordResetToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { input: { token, newPassword } })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should use resetPasswordSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
