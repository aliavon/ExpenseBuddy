const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requestEmailChange = require("../requestEmailChange");
const User = require("../../../../database/schemas/User");
const {
  sendEmailChangeRequestEmail,
  sendEmailChangeConfirmationEmail,
} = require("../../../../auth/emailService");

// Mock dependencies
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../../../database/schemas/User");
jest.mock("../../../../auth/emailService");

describe("requestEmailChange", () => {
  let mockContext;
  let mockUser;
  let mockArgs;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Set up environment variable
    process.env.JWT_EMAIL_SECRET = "test-email-secret";

    mockUser = {
      _id: "user123",
      email: "current@example.com",
      firstName: "John",
      password: "hashedPassword123"
    };

    mockContext = {
      auth: {
        user: mockUser
      }
    };

    mockArgs = {
      input: {
        newEmail: "new@example.com",
        currentPassword: "currentPassword123"
      }
    };

    // Default mock implementations
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    User.findOne.mockResolvedValue(null); // No existing user with new email
    bcrypt.compare.mockResolvedValue(true); // Password is valid
    jwt.sign.mockReturnValue("mocked.email.change.token");
    sendEmailChangeRequestEmail.mockResolvedValue(true);
    sendEmailChangeConfirmationEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.JWT_EMAIL_SECRET;
  });

  describe("successful email change request", () => {
    it("should request email change successfully", async () => {
      const result = await requestEmailChange(null, mockArgs, mockContext);

      expect(result).toBe(true);
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(User.findById().select).toHaveBeenCalledWith("+password");
    });

    it("should verify current password", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "currentPassword123",
        "hashedPassword123"
      );
    });

    it("should check if new email is available", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "new@example.com",
        _id: { $ne: "user123" }
      });
    });

    it("should generate email change token with correct payload", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: "user123",
          currentEmail: "current@example.com",
          newEmail: "new@example.com",
          type: "email_change"
        },
        "test-email-secret",
        { expiresIn: "1h" }
      );
    });

    it("should send notification email to current address", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(sendEmailChangeRequestEmail).toHaveBeenCalledWith(
        "current@example.com",
        "John",
        "new@example.com"
      );
    });

    it("should send confirmation email to new address", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(sendEmailChangeConfirmationEmail).toHaveBeenCalledWith(
        "new@example.com",
        "John",
        "mocked.email.change.token"
      );
    });

    it("should normalize new email to lowercase", async () => {
      const argsWithUpperCase = {
        input: {
          newEmail: "NEW@EXAMPLE.COM",
          currentPassword: "currentPassword123"
        }
      };

      await requestEmailChange(null, argsWithUpperCase, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "new@example.com",
        _id: { $ne: "user123" }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          newEmail: "new@example.com"
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe("authentication checks", () => {
    it("should throw error when context.auth is missing", async () => {
      const contextWithoutAuth = {};

      await expect(
        requestEmailChange(null, mockArgs, contextWithoutAuth)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        expect.any(Error)
      );
    });

    it("should throw error when context.auth.user is missing", async () => {
      const contextWithoutUser = { auth: {} };

      await expect(
        requestEmailChange(null, mockArgs, contextWithoutUser)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error when context.auth.user is null", async () => {
      const contextWithNullUser = { auth: { user: null } };

      await expect(
        requestEmailChange(null, mockArgs, contextWithNullUser)
      ).rejects.toThrow("An error occurred");
    });
  });

  describe("user validation", () => {
    it("should throw error when user not found in database", async () => {
      User.findById().select.mockResolvedValue(null);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle User.findById errors", async () => {
      const dbError = new Error("Database connection failed");
      User.findById().select.mockRejectedValue(dbError);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        dbError
      );
    });
  });

  describe("password validation", () => {
    it("should throw error when current password is incorrect", async () => {
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle bcrypt.compare errors", async () => {
      const bcryptError = new Error("Bcrypt comparison failed");
      bcrypt.compare.mockRejectedValue(bcryptError);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        bcryptError
      );
    });
  });

  describe("email validation", () => {
    it("should throw error when new email is same as current (exact match)", async () => {
      const sameEmailArgs = {
        input: {
          newEmail: "current@example.com",
          currentPassword: "currentPassword123"
        }
      };

      await expect(
        requestEmailChange(null, sameEmailArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error when new email is same as current (case insensitive)", async () => {
      const sameEmailArgs = {
        input: {
          newEmail: "CURRENT@EXAMPLE.COM",
          currentPassword: "currentPassword123"
        }
      };

      await expect(
        requestEmailChange(null, sameEmailArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error when new email is already in use", async () => {
      User.findOne.mockResolvedValue({
        _id: "otherUser123",
        email: "new@example.com"
      });

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle User.findOne errors", async () => {
      const findOneError = new Error("Query failed");
      User.findOne.mockRejectedValue(findOneError);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        findOneError
      );
    });
  });

  describe("token generation", () => {
    it("should handle jwt.sign errors", async () => {
      const jwtError = new Error("JWT signing failed");
      jwt.sign.mockImplementation(() => { throw jwtError; });

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        jwtError
      );
    });

    it("should include all required fields in token payload", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      const tokenPayload = jwt.sign.mock.calls[0][0];
      expect(tokenPayload).toHaveProperty("userId", "user123");
      expect(tokenPayload).toHaveProperty("currentEmail", "current@example.com");
      expect(tokenPayload).toHaveProperty("newEmail", "new@example.com");
      expect(tokenPayload).toHaveProperty("type", "email_change");
    });

    it("should use correct JWT secret and expiration", async () => {
      await requestEmailChange(null, mockArgs, mockContext);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "test-email-secret",
        { expiresIn: "1h" }
      );
    });
  });

  describe("email sending", () => {
    it("should handle sendEmailChangeRequestEmail errors", async () => {
      const emailError = new Error("Email sending failed");
      sendEmailChangeRequestEmail.mockRejectedValue(emailError);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        emailError
      );
    });

    it("should handle sendEmailChangeConfirmationEmail errors", async () => {
      const confirmationError = new Error("Confirmation email failed");
      sendEmailChangeConfirmationEmail.mockRejectedValue(confirmationError);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        confirmationError
      );
    });

    it("should not send emails if early validation fails", async () => {
      // Make password validation fail
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(sendEmailChangeRequestEmail).not.toHaveBeenCalled();
      expect(sendEmailChangeConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle user with null email", async () => {
      const userWithNullEmail = { ...mockUser, email: null };
      User.findById().select.mockResolvedValue(userWithNullEmail);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle user with empty email", async () => {
      const userWithEmptyEmail = { ...mockUser, email: "" };
      User.findById().select.mockResolvedValue(userWithEmptyEmail);

      // Empty email will be compared with new email, and they won't match
      // so the function should succeed
      const result = await requestEmailChange(null, mockArgs, mockContext);
      expect(result).toBe(true);
    });

    it("should handle missing firstName", async () => {
      const userWithoutFirstName = { ...mockUser, firstName: null };
      User.findById().select.mockResolvedValue(userWithoutFirstName);

      const result = await requestEmailChange(null, mockArgs, mockContext);

      expect(result).toBe(true);
      expect(sendEmailChangeRequestEmail).toHaveBeenCalledWith(
        "current@example.com",
        null,
        "new@example.com"
      );
    });

    it("should handle empty new email", async () => {
      const emptyEmailArgs = {
        input: {
          newEmail: "",
          currentPassword: "currentPassword123"
        }
      };

      // Empty string is different from current email, so check will pass
      // and emails will be sent
      const result = await requestEmailChange(null, emptyEmailArgs, mockContext);
      expect(result).toBe(true);
    });

    it("should handle missing current password", async () => {
      const noPasswordArgs = {
        input: {
          newEmail: "new@example.com",
          currentPassword: ""
        }
      };

      bcrypt.compare.mockResolvedValue(false); // Empty password won't match

      await expect(
        requestEmailChange(null, noPasswordArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle user without password field", async () => {
      const userWithoutPassword = { ...mockUser };
      delete userWithoutPassword.password;
      User.findById().select.mockResolvedValue(userWithoutPassword);

      // bcrypt.compare with undefined will return false, which triggers password error
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        requestEmailChange(null, mockArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete email change flow", async () => {
      const complexArgs = {
        input: {
          newEmail: "complex.new@example.com",
          currentPassword: "myComplexPassword123!"
        }
      };

      const complexUser = {
        _id: "complex-user-123",
        email: "complex.current@example.com",
        firstName: "Jane",
        lastName: "Doe",
        password: "hashedComplexPassword"
      };

      const complexContext = {
        auth: {
          user: complexUser
        }
      };

      User.findById().select.mockResolvedValue(complexUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("complex.email.change.token");

      const result = await requestEmailChange(null, complexArgs, complexContext);

      expect(result).toBe(true);
      expect(User.findById).toHaveBeenCalledWith("complex-user-123");
      expect(bcrypt.compare).toHaveBeenCalledWith("myComplexPassword123!", "hashedComplexPassword");
      expect(User.findOne).toHaveBeenCalledWith({
        email: "complex.new@example.com",
        _id: { $ne: "complex-user-123" }
      });
      expect(sendEmailChangeRequestEmail).toHaveBeenCalledWith(
        "complex.current@example.com",
        "Jane",
        "complex.new@example.com"
      );
      expect(sendEmailChangeConfirmationEmail).toHaveBeenCalledWith(
        "complex.new@example.com",
        "Jane",
        "complex.email.change.token"
      );
    });

    it("should handle case variations in email comparison", async () => {
      const userWithMixedCaseEmail = { ...mockUser, email: "Current@Example.Com" };
      User.findById().select.mockResolvedValue(userWithMixedCaseEmail);

      const mixedCaseArgs = {
        input: {
          newEmail: "current@EXAMPLE.com",
          currentPassword: "currentPassword123"
        }
      };

      await expect(
        requestEmailChange(null, mixedCaseArgs, mockContext)
      ).rejects.toThrow("An error occurred");
    });
  });
});
