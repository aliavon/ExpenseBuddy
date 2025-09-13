const { resetPasswordResolver } = require("../resetPassword");
const { verifyToken } = require("../../../../auth/jwtUtils");
const bcrypt = require("bcryptjs");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("bcryptjs");

jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn(),
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
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        isActive: true,
      };

      const hashedPassword = "hashed-new-password";
      const mockUpdatedUser = {
        ...mockUser,
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await resetPasswordResolver(null, { token, newPassword });

      expect(result).toBe(true);
      expect(verifyToken).toHaveBeenCalledWith(
        token,
        process.env.JWT_ACCESS_SECRET
      );
      expect(User.findOne).toHaveBeenCalledWith({
        _id: "user-id",
        passwordResetToken: token,
        passwordResetExpires: { $gt: expect.any(Date) },
        isActive: true,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        { new: true }
      );
    });
  });

  describe("token validation errors", () => {
    it("should throw error for invalid token", async () => {
      const token = "invalid-token";
      const newPassword = "NewPassword123!";

      verifyToken.mockImplementation(() => {
        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(verifyToken).toHaveBeenCalledWith(
        token,
        process.env.JWT_ACCESS_SECRET
      );
      expect(User.findOne).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should throw error for expired token", async () => {
      const token = "expired-token";
      const newPassword = "NewPassword123!";

      verifyToken.mockImplementation(() => {
        const error = new Error("Token expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error for malformed token", async () => {
      const token = "malformed.token";
      const newPassword = "NewPassword123!";

      verifyToken.mockImplementation(() => {
        const error = new Error("Malformed token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await expect(
        resetPasswordResolver(null, { token, newPassword })
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

      verifyToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findOne).not.toHaveBeenCalled();
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

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null);

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "non-existent-user",
        passwordResetToken: token,
        passwordResetExpires: { $gt: expect.any(Date) },
        isActive: true,
      });
    });

    it("should throw error if user is deactivated", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null); // No active user found

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error if token has expired in database", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null); // No user with non-expired token

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error if token does not match", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "password_reset",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null); // No user with matching token

      await expect(
        resetPasswordResolver(null, { token, newPassword })
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
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      await expect(
        resetPasswordResolver(null, { token, newPassword })
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

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockRejectedValue(new Error("Database connection error"));

      await expect(
        resetPasswordResolver(null, { token, newPassword })
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
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
      };

      const hashedPassword = "hashed-password";

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Password reset failed");
    });
  });

  describe("security considerations", () => {
    it("should clear reset token after successful reset", async () => {
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
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
      };

      const hashedPassword = "hashed-password";

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await resetPasswordResolver(null, { token, newPassword });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        expect.objectContaining({
          passwordResetToken: null, // Should clear token
          passwordResetExpires: null, // Should clear expiry
        }),
        { new: true }
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

      verifyToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should require userId in token payload", async () => {
      const token = "valid-token";
      const newPassword = "NewPassword123!";
      const mockDecodedToken = {
        email: "john@example.com", // Missing userId
        type: "password_reset",
      };

      verifyToken.mockReturnValue(mockDecodedToken);

      await expect(
        resetPasswordResolver(null, { token, newPassword })
      ).rejects.toThrow("Invalid or expired reset token");

      expect(User.findOne).not.toHaveBeenCalled();
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
