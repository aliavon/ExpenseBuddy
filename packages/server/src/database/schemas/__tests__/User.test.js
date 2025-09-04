const User = require("../User");

describe("User Schema", () => {
  it("should create user with required fields", async () => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      middleName: "Smith",
      email: "john.doe@example.com",
      password: "securePassword123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.middleName).toBe(userData.middleName);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.isVerified).toBe(false);
    expect(savedUser.isEmailVerified).toBe(false);
    expect(savedUser.roleInFamily).toBe("MEMBER");
    expect(savedUser.isActive).toBe(true);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
    // Password should be hashed
    expect(savedUser.password).not.toBe(userData.password);
  });

  it("should create user with default values", async () => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.middleName).toBe("");
    expect(savedUser.isVerified).toBe(false);
    expect(savedUser.isEmailVerified).toBe(false);
    expect(savedUser.roleInFamily).toBe("MEMBER");
    expect(savedUser.isActive).toBe(true);
    expect(savedUser.familyId).toBe(null);
  });

  it("should fail validation without firstName", async () => {
    const user = new User({
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.firstName).toBeDefined();
  });

  it("should fail validation without lastName", async () => {
    const user = new User({
      firstName: "John",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.lastName).toBeDefined();
  });

  it("should update isVerified status", async () => {
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    user.isVerified = true;
    const updatedUser = await user.save();

    expect(updatedUser.isVerified).toBe(true);
  });

  it("should find users by search pattern", async () => {
    await User.create([
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        password: "password123",
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        password: "password123",
      },
    ]);

    const users = await User.find({
      $or: [
        { firstName: { $regex: "Joh", $options: "i" } },
        { lastName: { $regex: "Joh", $options: "i" } },
      ],
    });

    expect(users).toHaveLength(2);
  });

  it("should update timestamps on save", async () => {
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    const originalUpdatedAt = user.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    user.firstName = "Jane";
    const updatedUser = await user.save();

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });

  // Authentication-related tests
  it("should fail validation without email", async () => {
    const user = new User({
      firstName: "John",
      lastName: "Doe",
      password: "securePassword123",
    });

    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it("should fail validation without password", async () => {
    const user = new User({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });

    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it("should hash password before saving", async () => {
    const plainPassword = "securePassword123";
    const user = new User({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: plainPassword,
    });

    const savedUser = await user.save();

    // Password should be hashed, not plain text
    expect(savedUser.password).not.toBe(plainPassword);
    expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/);
  });

  it("should compare password correctly", async () => {
    const plainPassword = "securePassword123";
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: plainPassword,
    });

    // Get user with password field
    const userWithPassword = await User.findById(user._id).select("+password");

    const isMatch = await userWithPassword.comparePassword(plainPassword);
    const isNotMatch = await userWithPassword.comparePassword("wrongPassword");

    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });

  it("should exclude sensitive fields from JSON", async () => {
    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
      passwordResetToken: "reset-token-123",
      emailVerificationToken: "verify-token-123",
    });

    const jsonUser = user.toJSON();

    expect(jsonUser.firstName).toBe("John");
    expect(jsonUser.email).toBe("john.doe@example.com");
    expect(jsonUser.password).toBeUndefined();
    expect(jsonUser.passwordResetToken).toBeUndefined();
    expect(jsonUser.emailVerificationToken).toBeUndefined();
  });

  it("should enforce unique email", async () => {
    const email = "duplicate@example.com";

    await User.create({
      firstName: "John",
      lastName: "Doe",
      email: email,
      password: "password123",
    });

    const duplicateUser = new User({
      firstName: "Jane",
      lastName: "Smith",
      email: email, // Same email
      password: "password123",
    });

    let error;
    try {
      await duplicateUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });
});
