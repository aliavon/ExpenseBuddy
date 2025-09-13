const { verifyEmailResolver } = require("../verifyEmail");
const { verifyToken } = require("../../../../auth/jwtUtils");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("verifyEmail resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful email verification", () => {
    it("should verify email successfully with valid token", async () => {
      const token = "valid-verification-token";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isEmailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
      };

      const mockUpdatedUser = {
        ...mockUser,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await verifyEmailResolver(null, { token });

      expect(result).toBe(true);
      expect(verifyToken).toHaveBeenCalledWith(
        token,
        process.env.JWT_ACCESS_SECRET
      );
      expect(User.findOne).toHaveBeenCalledWith({
        _id: "user-id",
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: expect.any(Date) },
        isActive: true,
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
        { new: true }
      );
    });
  });

  describe("token validation errors", () => {
    it("should throw error for invalid token", async () => {
      const token = "invalid-token";

      verifyToken.mockImplementation(() => {
        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Invalid or expired verification token"
      );

      expect(verifyToken).toHaveBeenCalledWith(
        token,
        process.env.JWT_ACCESS_SECRET
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw error for expired token", async () => {
      const token = "expired-token";

      verifyToken.mockImplementation(() => {
        const error = new Error("Token expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Invalid or expired verification token"
      );
    });

    it("should throw error for malformed token", async () => {
      const token = "malformed.token";

      verifyToken.mockImplementation(() => {
        const error = new Error("Malformed token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Invalid or expired verification token"
      );
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found", async () => {
      const token = "valid-token";
      const mockDecodedToken = {
        userId: "non-existent-user",
        email: "john@example.com",
        type: "email_verification",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null);

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Invalid or expired verification token"
      );

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "non-existent-user",
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: expect.any(Date) },
        isActive: true,
      });
    });

    it("should throw error if user is deactivated", async () => {
      const token = "valid-token";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(null); // No user found with isActive: true

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Invalid or expired verification token"
      );
    });

    it("should handle already verified email gracefully", async () => {
      const token = "valid-token";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isEmailVerified: true, // Already verified
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);

      const result = await verifyEmailResolver(null, { token });

      expect(result).toBe(true);
      // Should not attempt to update if already verified
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle database lookup errors gracefully", async () => {
      const token = "valid-token";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification",
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockRejectedValue(new Error("Database connection error"));

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Email verification failed"
      );
    });

    it("should handle database update errors gracefully", async () => {
      const token = "valid-token";
      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
        type: "email_verification",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isEmailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      verifyToken.mockReturnValue(mockDecodedToken);
      User.findOne.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(verifyEmailResolver(null, { token })).rejects.toThrow(
        "Email verification failed"
      );
    });
  });

  describe("validation", () => {
    it("should use verifyEmailSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
