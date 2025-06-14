const User = require("../User");

describe("User Schema", () => {
  it("should create user with required fields", async () => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      middleName: "Smith",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.middleName).toBe(userData.middleName);
    expect(savedUser.isVerified).toBe(false);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it("should create user with default values", async () => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.middleName).toBe("");
    expect(savedUser.isVerified).toBe(false);
  });

  it("should fail validation without firstName", async () => {
    const user = new User({
      lastName: "Doe",
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
    });

    user.isVerified = true;
    const updatedUser = await user.save();

    expect(updatedUser.isVerified).toBe(true);
  });

  it("should find users by search pattern", async () => {
    await User.create([
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Smith" },
      { firstName: "Bob", lastName: "Johnson" },
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
    });

    const originalUpdatedAt = user.updatedAt;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    user.firstName = "Jane";
    const updatedUser = await user.save();

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
}); 