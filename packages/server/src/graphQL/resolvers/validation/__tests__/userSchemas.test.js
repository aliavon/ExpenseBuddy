const createUserSchema = require("../createUserSchema");
const updateUserSchema = require("../updateUserSchema");

describe("User Schemas Validation", () => {
  describe("createUserSchema", () => {
    it("should validate with all required fields", () => {
      const validInput = {
        user: {
          firstName: "John",
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with optional fields", () => {
      const validInput = {
        user: {
          firstName: "John",
          middleName: "Michael",
          lastName: "Doe",
          isVerified: true
        }
      };

      const { error } = createUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty middleName", () => {
      const validInput = {
        user: {
          firstName: "John",
          middleName: "",
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when user object is missing", () => {
      const invalidInput = {};

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"user" is required');
    });

    it("should fail when firstName is missing", () => {
      const invalidInput = {
        user: {
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"firstName" is required');
    });

    it("should fail when firstName is empty", () => {
      const invalidInput = {
        user: {
          firstName: "",
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"firstName" cannot be empty');
    });

    it("should fail when firstName is not a string", () => {
      const invalidInput = {
        user: {
          firstName: 123,
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"firstName" must be a string');
    });

    it("should fail when lastName is missing", () => {
      const invalidInput = {
        user: {
          firstName: "John"
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"lastName" is required');
    });

    it("should fail when lastName is empty", () => {
      const invalidInput = {
        user: {
          firstName: "John",
          lastName: ""
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"lastName" cannot be empty');
    });

    it("should fail when middleName is not a string", () => {
      const invalidInput = {
        user: {
          firstName: "John",
          middleName: 123,
          lastName: "Doe"
        }
      };

      const { error } = createUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"middleName" must be a string');
    });
  });

  describe("updateUserSchema", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should validate with required id only", () => {
      const validInput = {
        user: {
          id: validObjectId
        }
      };

      const { error } = updateUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with all optional fields", () => {
      const validInput = {
        user: {
          id: validObjectId,
          firstName: "John",
          middleName: "Michael",
          lastName: "Doe"
        }
      };

      const { error } = updateUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty middleName", () => {
      const validInput = {
        user: {
          id: validObjectId,
          middleName: ""
        }
      };

      const { error } = updateUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when user object is missing", () => {
      const invalidInput = {};

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"user" is required');
    });

    it("should fail when id is missing", () => {
      const invalidInput = {
        user: {
          firstName: "John"
        }
      };

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = {
        user: {
          id: "invalid-id"
        }
      };

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" must be a valid ObjectId');
    });

    it("should fail when firstName is empty", () => {
      const invalidInput = {
        user: {
          id: validObjectId,
          firstName: ""
        }
      };

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"firstName" cannot be empty');
    });

    it("should fail when lastName is empty", () => {
      const invalidInput = {
        user: {
          id: validObjectId,
          lastName: ""
        }
      };

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"lastName" cannot be empty');
    });

    it("should fail when middleName is not a string", () => {
      const invalidInput = {
        user: {
          id: validObjectId,
          middleName: 123
        }
      };

      const { error } = updateUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"middleName" must be a string');
    });
  });
}); 