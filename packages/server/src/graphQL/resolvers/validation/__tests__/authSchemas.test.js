const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createFamilySchema,
  updateFamilySchema,
  joinFamilyByCodeSchema,
  inviteToFamilySchema,
  removeFamilyMemberSchema,
  updateMemberRoleSchema,
} = require("../index");

describe("Authentication Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should validate valid registration input", () => {
      const validInput = {
        input: {
          firstName: "John",
          lastName: "Doe",
          middleName: "William",
          email: "john.doe@example.com",
          password: "password123",
          familyName: "Doe Family",
        },
      };
      const { error } = registerSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing firstName", () => {
      const input = {
        input: {
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "firstName"]);
    });

    it("should reject empty firstName", () => {
      const input = {
        input: {
          firstName: "",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"firstName" cannot be empty');
    });

    it("should reject short password", () => {
      const input = {
        input: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "123456", // Only 6 characters
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"password" must be at least 8 characters long'
      );
    });

    it("should reject invalid email", () => {
      const input = {
        input: {
          firstName: "John",
          lastName: "Doe",
          email: "invalid-email",
          password: "password123",
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"email" must be a valid email address'
      );
    });

    it("should reject lowercase inviteCode", () => {
      const input = {
        input: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
          inviteCode: "abcdef1234567890", // lowercase
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"inviteCode" must be exactly 16 uppercase characters'
      );
    });

    it("should accept valid uppercase inviteCode", () => {
      const input = {
        input: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
          inviteCode: "ABCDEF1234567890",
        },
      };
      const { error } = registerSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });

  describe("loginSchema", () => {
    it("should validate valid login input", () => {
      const validInput = {
        input: {
          email: "user@example.com",
          password: "password123",
        },
      };
      const { error } = loginSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing email", () => {
      const input = {
        input: {
          password: "password123",
        },
      };
      const { error } = loginSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "email"]);
    });

    it("should reject invalid email format", () => {
      const input = {
        input: {
          email: "invalid-email",
          password: "password123",
        },
      };
      const { error } = loginSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"email" must be a valid email address'
      );
    });

    it("should reject empty password", () => {
      const input = {
        input: {
          email: "user@example.com",
          password: "",
        },
      };
      const { error } = loginSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"password" cannot be empty');
    });

    it("should accept single character password", () => {
      const input = {
        input: {
          email: "user@example.com",
          password: "x",
        },
      };
      const { error } = loginSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });

  describe("refreshTokenSchema", () => {
    it("should validate valid refresh token input", () => {
      const validInput = {
        input: {
          refreshToken: "valid.jwt.token",
        },
      };
      const { error } = refreshTokenSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing refreshToken", () => {
      const input = {
        input: {},
      };
      const { error } = refreshTokenSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "refreshToken"]);
    });

    it("should reject empty refreshToken", () => {
      const input = {
        input: {
          refreshToken: "",
        },
      };
      const { error } = refreshTokenSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"refreshToken" cannot be empty');
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate valid reset password input", () => {
      const validInput = {
        input: {
          token: "valid-reset-token",
          newPassword: "newpassword123",
        },
      };
      const { error } = resetPasswordSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject short newPassword", () => {
      const input = {
        input: {
          token: "valid-token",
          newPassword: "123456", // Only 6 characters
        },
      };
      const { error } = resetPasswordSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"newPassword" must be at least 8 characters long'
      );
    });

    it("should reject missing token", () => {
      const input = {
        input: {
          newPassword: "newpassword123",
        },
      };
      const { error } = resetPasswordSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "token"]);
    });
  });

  describe("changePasswordSchema", () => {
    it("should validate valid change password input", () => {
      const validInput = {
        input: {
          currentPassword: "oldpassword123",
          newPassword: "newpassword123",
        },
      };
      const { error } = changePasswordSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing currentPassword", () => {
      const input = {
        input: {
          newPassword: "newpassword123",
        },
      };
      const { error } = changePasswordSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "currentPassword"]);
    });

    it("should reject short newPassword", () => {
      const input = {
        input: {
          currentPassword: "oldpass",
          newPassword: "123456", // Only 6 characters
        },
      };
      const { error } = changePasswordSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"newPassword" must be at least 8 characters long'
      );
    });
  });

  describe("createFamilySchema", () => {
    it("should validate valid create family input", () => {
      const validInput = {
        input: {
          name: "Smith Family",
          description: "Our lovely family",
          timezone: "America/New_York",
        },
      };
      const { error } = createFamilySchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing name", () => {
      const input = {
        input: {
          description: "Family description",
        },
      };
      const { error } = createFamilySchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "name"]);
    });

    it("should reject empty name", () => {
      const input = {
        input: {
          name: "",
          description: "Family description",
        },
      };
      const { error } = createFamilySchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" cannot be empty');
    });

    it("should allow missing description", () => {
      const input = {
        input: {
          name: "Family Name",
        },
      };
      const { error } = createFamilySchema.validate(input);
      expect(error).toBeUndefined();
    });
  });

  describe("updateFamilySchema", () => {
    it("should validate valid update family input", () => {
      const validInput = {
        input: {
          name: "Updated Family Name",
        },
      };
      const { error } = updateFamilySchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject empty input object", () => {
      const input = {
        input: {},
      };
      const { error } = updateFamilySchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        "At least one field (name, description, or timezone) must be provided"
      );
    });

    it("should accept partial updates", () => {
      const inputs = [
        { input: { name: "New Name" } },
        { input: { description: "New description" } },
        { input: { timezone: "Europe/Berlin" } },
      ];

      inputs.forEach((input) => {
        const { error } = updateFamilySchema.validate(input);
        expect(error).toBeUndefined();
      });
    });
  });

  describe("joinFamilyByCodeSchema", () => {
    it("should validate valid join family input", () => {
      const validInput = {
        input: {
          inviteCode: "ABCDEF1234567890",
        },
      };
      const { error } = joinFamilyByCodeSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should reject missing inviteCode", () => {
      const input = {
        input: {},
      };
      const { error } = joinFamilyByCodeSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(["input", "inviteCode"]);
    });

    it("should reject short inviteCode", () => {
      const input = {
        input: {
          inviteCode: "ABC123",
        },
      };
      const { error } = joinFamilyByCodeSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"inviteCode" must be exactly 16 characters long'
      );
    });

    it("should reject lowercase inviteCode", () => {
      const input = {
        input: {
          inviteCode: "abcdef1234567890",
        },
      };
      const { error } = joinFamilyByCodeSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"inviteCode" must be exactly 16 uppercase characters'
      );
    });
  });

  describe("edge cases", () => {
    it("should handle missing input object", () => {
      const inputWrapperSchemas = [
        registerSchema,
        loginSchema,
        refreshTokenSchema,
        resetPasswordSchema,
        changePasswordSchema,
        createFamilySchema,
        updateFamilySchema,
        joinFamilyByCodeSchema,
      ];

      inputWrapperSchemas.forEach((schema) => {
        const { error } = schema.validate({});
        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"input" is required');
      });

      // Direct input schemas
      const directInputSchemas = [
        inviteToFamilySchema,
        removeFamilyMemberSchema,
        updateMemberRoleSchema,
      ];

      directInputSchemas.forEach((schema) => {
        const { error } = schema.validate({});
        expect(error).toBeDefined();
        expect(error.details[0].path[0]).toMatch(/(email|userId)/);
      });
    });

    it("should handle null input", () => {
      const inputWrapperSchemas = [
        registerSchema,
        loginSchema,
        refreshTokenSchema,
        resetPasswordSchema,
        changePasswordSchema,
        createFamilySchema,
        updateFamilySchema,
        joinFamilyByCodeSchema,
      ];

      inputWrapperSchemas.forEach((schema) => {
        const { error } = schema.validate({ input: null });
        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"input" must be of type object');
      });

      // Direct input schemas don't have input wrapper
      const directInputSchemas = [
        {
          schema: inviteToFamilySchema,
          nullField: { email: null, role: "MEMBER" },
        },
        { schema: removeFamilyMemberSchema, nullField: { userId: null } },
        {
          schema: updateMemberRoleSchema,
          nullField: { userId: null, role: "MEMBER" },
        },
      ];

      directInputSchemas.forEach(({ schema, nullField }) => {
        const { error } = schema.validate(nullField);
        expect(error).toBeDefined();
        // Should have error about required field
        expect(error.details[0].message).toMatch(
          /(must be a string|is required)/
        );
      });
    });
  });
});
