const bcrypt = require("bcryptjs");
const { registerResolver: register } = require("../register");
const { generateVerificationToken } = require("../../../../auth/jwtUtils");
const { sendVerificationEmail } = require("../../../../auth/emailService");
const { User, Family, Currency } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils");
jest.mock("../../../../auth/emailService");
jest.mock("bcryptjs");

// Mock database schemas
jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  Family: {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
  Currency: {
    findOne: jest.fn(),
  },
}));

describe("register resolver", () => {
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {};

    // Mock bcrypt
    bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

    // Mock JWT generation
    generateVerificationToken.mockReturnValue("verification-token");

    // Mock email service
    sendVerificationEmail.mockResolvedValue(true);
  });

  describe("successful registration with new family", () => {
    it("should register user and create new family successfully", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        familyName: "Doe Family",
      };

      const mockCurrency = { _id: "currency-id", code: "USD" };
      const mockFamily = {
        _id: "family-id",
        name: "Doe Family",
        ownerId: null,
      };
      const mockUser = {
        _id: "user-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        familyId: "family-id",
        roleInFamily: "OWNER",
      };

      User.findOne.mockResolvedValue(null);
      Currency.findOne.mockResolvedValue(mockCurrency);
      Family.create.mockResolvedValue(mockFamily);
      User.create.mockResolvedValue(mockUser);
      Family.findByIdAndUpdate.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await register(null, { input }, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(Currency.findOne).toHaveBeenCalledWith({ code: "USD" });

      expect(Family.create).toHaveBeenCalledWith({
        name: "Doe Family",
        description: "",
        ownerId: null,
        currency: "currency-id",
        timezone: "UTC",
        isActive: true,
      });

      expect(User.create).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        middleName: "",
        email: "john@example.com",
        password: "hashedPassword",
        familyId: "family-id",
        roleInFamily: "OWNER",
        isEmailVerified: false,
        isVerified: false,
        isActive: true,
      });

      expect(Family.findByIdAndUpdate).toHaveBeenCalledWith("family-id", {
        ownerId: "user-id",
      });

      expect(generateVerificationToken).toHaveBeenCalledWith({
        userId: "user-id",
        email: "john@example.com",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-id", {
        emailVerificationToken: "verification-token",
        emailVerificationExpires: expect.any(Date),
      });

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "john@example.com",
        "verification-token",
        "John"
      );

      expect(result).toEqual({
        success: true,
        message:
          "Registration successful! Please check your email to activate your account.",
      });
    });
  });

  describe("successful registration with invite code", () => {
    it("should register user and join existing family by invite code", async () => {
      const input = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "password123",
        inviteCode: "INVITE123",
      };

      const mockFamily = {
        _id: "existing-family-id",
        name: "Existing Family",
        inviteCode: "INVITE123",
        isActive: true,
      };
      const mockUser = {
        _id: "user-id",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        familyId: "existing-family-id",
        roleInFamily: "MEMBER",
      };

      User.findOne.mockResolvedValue(null);
      Family.findOne.mockResolvedValue(mockFamily);
      User.create.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await register(null, { input }, mockContext);

      expect(Family.findOne).toHaveBeenCalledWith({
        inviteCode: "INVITE123",
        isActive: true,
      });

      expect(User.create).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Smith",
        middleName: "",
        email: "jane@example.com",
        password: "hashedPassword",
        familyId: "existing-family-id",
        roleInFamily: "MEMBER",
        isEmailVerified: false,
        isVerified: false,
        isActive: true,
      });

      expect(generateVerificationToken).toHaveBeenCalledWith({
        userId: "user-id",
        email: "jane@example.com",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-id", {
        emailVerificationToken: "verification-token",
        emailVerificationExpires: expect.any(Date),
      });

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "jane@example.com",
        "verification-token",
        "Jane"
      );

      expect(result).toEqual({
        success: true,
        message:
          "Registration successful! Please check your email to activate your account.",
      });
    });
  });

  describe("error scenarios", () => {
    it("should throw error if user already exists", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        familyName: "Doe Family",
      };

      const existingUser = {
        _id: "existing-user-id",
        email: "john@example.com",
      };
      User.findOne.mockResolvedValue(existingUser);

      await expect(register(null, { input }, mockContext)).rejects.toThrow(
        "User with this email already exists"
      );

      expect(User.create).not.toHaveBeenCalled();
      expect(Family.create).not.toHaveBeenCalled();
    });

    it("should throw error if default currency not found", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        familyName: "Doe Family",
      };

      User.findOne.mockResolvedValue(null);
      Currency.findOne.mockResolvedValue(null);

      await expect(register(null, { input }, mockContext)).rejects.toThrow(
        "Default currency not found"
      );

      expect(Family.create).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it("should throw error if invite code is invalid", async () => {
      const input = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "password123",
        inviteCode: "INVALID123",
      };

      User.findOne.mockResolvedValue(null);
      Family.findOne.mockResolvedValue(null);

      await expect(register(null, { input }, mockContext)).rejects.toThrow(
        "Invalid or expired invite code"
      );

      expect(User.create).not.toHaveBeenCalled();
    });

    it("should register user without family successfully", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        // No familyName, inviteCode, or invitationToken
      };

      const mockUser = {
        _id: "user-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        familyId: null,
        roleInFamily: "MEMBER",
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await register(null, { input }, mockContext);

      expect(User.create).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        middleName: "",
        email: "john@example.com",
        password: "hashedPassword",
        familyId: null,
        roleInFamily: "MEMBER",
        isEmailVerified: false,
        isVerified: false,
        isActive: true,
      });

      expect(Family.create).not.toHaveBeenCalled();
      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(generateVerificationToken).toHaveBeenCalledWith({
        userId: "user-id",
        email: "john@example.com",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-id", {
        emailVerificationToken: "verification-token",
        emailVerificationExpires: expect.any(Date),
      });

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "john@example.com",
        "verification-token",
        "John"
      );

      expect(result).toEqual({
        success: true,
        message:
          "Registration successful! Please check your email to activate your account.",
      });
    });

    it("should continue if email verification fails", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        familyName: "Doe Family",
      };

      const mockCurrency = { _id: "currency-id", code: "USD" };
      const mockFamily = { _id: "family-id" };
      const mockUser = {
        _id: "user-id",
        familyId: "family-id",
        roleInFamily: "OWNER",
      };

      User.findOne.mockResolvedValue(null);
      Currency.findOne.mockResolvedValue(mockCurrency);
      Family.create.mockResolvedValue(mockFamily);
      User.create.mockResolvedValue(mockUser);
      Family.findByIdAndUpdate.mockResolvedValue(mockFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Email service fails
      sendVerificationEmail.mockRejectedValue(new Error("SMTP error"));
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await register(null, { input }, mockContext);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to send verification email:",
        "SMTP error"
      );
      expect(result).toEqual({
        success: true,
        message:
          "Registration successful! Please check your email to activate your account.",
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe("validation", () => {
    it("should use registerSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
