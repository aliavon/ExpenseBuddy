const updateUser = require("../updateUser");
const { User } = require("../../../../database/schemas");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("updateUser mutation", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const createUserData = (overrides = {}) => ({
    firstName: "John",
    lastName: "Doe",
    ...overrides,
  });

  const createUserInDB = async (data = {}) => {
    const userData = createUserData(data);
    const user = new User(userData);
    return await user.save();
  };

  it("should update user successfully", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "Jane",
      lastName: "Smith",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
    expect(result._id.toString()).toBe(user._id.toString());
    expect(context.logger.info).toHaveBeenCalledWith(
      { id: result._id.toString() },
      "Successfully updated user"
    );
  });

  it("should update only specified fields", async () => {
    const user = await createUserInDB({
      firstName: "John",
      middleName: "William",
      lastName: "Doe",
      isVerified: false,
    });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "Johnny", // only update firstName
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("Johnny"); // updated
    expect(result.middleName).toBe("William"); // unchanged
    expect(result.lastName).toBe("Doe"); // unchanged
    expect(result.isVerified).toBe(false); // unchanged
  });

  it("should update all fields", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "Jane",
      middleName: "Marie",
      lastName: "Smith",
      isVerified: true,
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("Jane");
    expect(result.middleName).toBe("Marie");
    expect(result.lastName).toBe("Smith");
    expect(result.isVerified).toBe(true);
  });

  it("should handle special characters in names", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "José",
      middleName: "María",
      lastName: "García-López",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("José");
    expect(result.middleName).toBe("María");
    expect(result.lastName).toBe("García-López");
  });

  it("should handle unicode characters", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "李",
      lastName: "明",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("李");
    expect(result.lastName).toBe("明");
  });

  it("should handle emoji in names", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "John 😊",
      lastName: "Doe 🎉",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("John 😊");
    expect(result.lastName).toBe("Doe 🎉");
  });

  it("should handle empty middleName", async () => {
    const user = await createUserInDB({ middleName: "William" });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      middleName: "",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.middleName).toBe("");
  });

  it("should handle null middleName", async () => {
    const user = await createUserInDB({ middleName: "William" });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      middleName: null,
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.middleName).toBeNull();
  });

  it("should toggle isVerified status", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      isVerified: true,
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.isVerified).toBe(true);
  });

  it("should handle very long names", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();
    const longName = "A".repeat(100);

    const updateData = {
      id: user._id,
      firstName: longName,
      lastName: longName,
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe(longName);
    expect(result.lastName).toBe(longName);
  });

  it("should update timestamps correctly", async () => {
    const user = await createUserInDB();
    const originalUpdatedAt = user.updatedAt;
    const context = global.createMockContext();

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updateData = {
      id: user._id,
      firstName: "Updated",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
    expect(result.createdAt).toEqual(user.createdAt); // should not change
  });

  it("should throw error for non-existent user", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updateData = {
      id: nonExistentId,
      firstName: "Jane",
    };

    await expect(
      updateUser(null, { user: updateData }, context)
    ).rejects.toThrow(GraphQLError);

    await expect(
      updateUser(null, { user: updateData }, context)
    ).rejects.toThrow(`User not found for id ${nonExistentId}`);
  });

  it("should throw error with correct error code for non-existent user", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updateData = {
      id: nonExistentId,
      firstName: "Jane",
    };

    try {
      await updateUser(null, { user: updateData }, context);
      fail("Expected GraphQLError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.GET_USER_ERROR);
    }
  });

  it("should handle database errors gracefully", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    // Mock User.findByIdAndUpdate to throw an error
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    User.findByIdAndUpdate = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    const updateData = {
      id: user._id,
      firstName: "Jane",
    };

    await expect(
      updateUser(null, { user: updateData }, context)
    ).rejects.toThrow("Database connection failed");

    // Restore original method
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  it("should persist changes in database", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "Updated",
      lastName: "Name",
    };

    await updateUser(null, { user: updateData }, context);

    // Verify changes were persisted
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.firstName).toBe("Updated");
    expect(updatedUser.lastName).toBe("Name");
  });

  it("should handle partial updates without affecting other fields", async () => {
    const user = await createUserInDB({
      firstName: "John",
      middleName: "William",
      lastName: "Doe",
      isVerified: true,
    });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      lastName: "Smith", // only update lastName
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("John"); // unchanged
    expect(result.middleName).toBe("William"); // unchanged
    expect(result.lastName).toBe("Smith"); // updated
    expect(result.isVerified).toBe(true); // unchanged
  });

  it("should handle multiple consecutive updates", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    // First update
    const firstUpdate = {
      id: user._id,
      firstName: "First",
    };

    const firstResult = await updateUser(null, { user: firstUpdate }, context);

    expect(firstResult.firstName).toBe("First");

    // Second update
    const secondUpdate = {
      id: user._id,
      lastName: "Second",
    };

    const secondResult = await updateUser(
      null,
      { user: secondUpdate },
      context
    );

    expect(secondResult.firstName).toBe("First"); // from first update
    expect(secondResult.lastName).toBe("Second"); // from second update
  });

  it("should handle ObjectId string format", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    const updateData = {
      id: user._id.toString(), // string format instead of ObjectId
      firstName: "StringId",
    };

    const result = await updateUser(null, { user: updateData }, context);

    expect(result.firstName).toBe("StringId");
  });

  it("should handle boolean values correctly", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    // Test setting to true
    const updateToTrue = {
      id: user._id,
      isVerified: true,
    };

    const trueResult = await updateUser(null, { user: updateToTrue }, context);

    expect(trueResult.isVerified).toBe(true);

    // Test setting back to false
    const updateToFalse = {
      id: user._id,
      isVerified: false,
    };

    const falseResult = await updateUser(
      null,
      { user: updateToFalse },
      context
    );

    expect(falseResult.isVerified).toBe(false);
  });

  it("should return updated document with new: true option", async () => {
    const user = await createUserInDB({ firstName: "Original" });
    const context = global.createMockContext();

    const updateData = {
      id: user._id,
      firstName: "Updated",
    };

    const result = await updateUser(null, { user: updateData }, context);

    // Should return the updated document, not the original
    expect(result.firstName).toBe("Updated");
  });
});
