const deleteUser = require("../deleteUser");
const { User, FamilyIncome } = require("../../../../database/schemas");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("deleteUser mutation", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await FamilyIncome.deleteMany({});
  });

  const createUserData = (overrides = {}) => ({
    firstName: "John",
    lastName: "Doe",
    isVerified: false,
    ...overrides,
  });

  const createUserInDB = async (data = {}) => {
    const userData = createUserData(data);
    const user = new User(userData);
    return await user.save();
  };

  const createFamilyIncomeData = (overrides = {}) => ({
    contributorId: global.createMockId(),
    currencyId: global.createMockId(),
    typeId: global.createMockId(),
    amount: 1000,
    periodicity: "MONTHLY",
    date: new Date("2024-01-15"),
    ...overrides,
  });

  const createFamilyIncomeInDB = async (data = {}) => {
    const incomeData = createFamilyIncomeData(data);
    const income = new FamilyIncome(incomeData);
    return await income.save();
  };

  it("should delete unverified user successfully", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    const result = await deleteUser(null, { id: user._id }, context);

    expect(result).toBe(user._id);
    expect(context.logger.info).toHaveBeenCalledWith(
      { id: user._id },
      "Successfully deleted user"
    );

    // Verify user was actually deleted
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should throw error when trying to delete verified user", async () => {
    const user = await createUserInDB({ isVerified: true });
    const context = global.createMockContext();

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      GraphQLError
    );

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "Cannot delete verified user."
    );

    // Verify user was not deleted
    const existingUser = await User.findById(user._id);
    expect(existingUser).not.toBeNull();
  });

  it("should throw error with correct error code for verified user", async () => {
    const user = await createUserInDB({ isVerified: true });
    const context = global.createMockContext();

    try {
      await deleteUser(null, { id: user._id }, context);
      fail("Expected GraphQLError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.DELETE_USER_FORBIDDEN);
    }
  });

  it("should throw error for non-existent user", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    await expect(
      deleteUser(null, { id: nonExistentId }, context)
    ).rejects.toThrow(GraphQLError);

    await expect(
      deleteUser(null, { id: nonExistentId }, context)
    ).rejects.toThrow(`User not found for id ${nonExistentId}`);
  });

  it("should throw error with correct error code for non-existent user", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    try {
      await deleteUser(null, { id: nonExistentId }, context);
      fail("Expected GraphQLError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.GET_USER_ERROR);
    }
  });

  it("should throw error when user is referenced in FamilyIncome records", async () => {
    const user = await createUserInDB({ isVerified: false });

    // Create FamilyIncome record referencing this user
    await createFamilyIncomeInDB({ contributorId: user._id });

    const context = global.createMockContext();

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      GraphQLError
    );

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "User is used in family income records and cannot be deleted."
    );

    // Verify user was not deleted
    const existingUser = await User.findById(user._id);
    expect(existingUser).not.toBeNull();
  });

  it("should throw error with correct error code for user with FamilyIncome references", async () => {
    const user = await createUserInDB({ isVerified: false });
    await createFamilyIncomeInDB({ contributorId: user._id });
    const context = global.createMockContext();

    try {
      await deleteUser(null, { id: user._id }, context);
      fail("Expected GraphQLError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.DELETE_USER_ERROR);
    }
  });

  it("should delete user when no FamilyIncome references exist", async () => {
    const user = await createUserInDB({ isVerified: false });

    // Create FamilyIncome record with different contributorId
    const otherUserId = global.createMockId();
    await createFamilyIncomeInDB({ contributorId: otherUserId });

    const context = global.createMockContext();

    const result = await deleteUser(null, { id: user._id }, context);

    expect(result).toBe(user._id);

    // Verify user was deleted
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();

    // Verify other FamilyIncome record still exists
    const remainingIncome = await FamilyIncome.findOne({
      contributorId: otherUserId,
    });
    expect(remainingIncome).not.toBeNull();
  });

  it("should handle multiple FamilyIncome references", async () => {
    const user = await createUserInDB({ isVerified: false });

    // Create multiple FamilyIncome records referencing this user
    await createFamilyIncomeInDB({ contributorId: user._id, amount: 1000 });
    await createFamilyIncomeInDB({ contributorId: user._id, amount: 2000 });
    await createFamilyIncomeInDB({ contributorId: user._id, amount: 3000 });

    const context = global.createMockContext();

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "User is used in family income records and cannot be deleted."
    );

    // Verify user was not deleted
    const existingUser = await User.findById(user._id);
    expect(existingUser).not.toBeNull();
  });

  it("should handle ObjectId string format", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    const result = await deleteUser(
      null,
      { id: user._id.toString() }, // string format
      context
    );

    expect(result.toString()).toBe(user._id.toString());

    // Verify user was deleted
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should handle database errors gracefully during user lookup", async () => {
    const user = await createUserInDB();
    const context = global.createMockContext();

    // Mock User.findById to throw an error
    const originalFindById = User.findById;
    User.findById = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    User.findById = originalFindById;
  });

  it("should handle database errors gracefully during FamilyIncome count", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    // Mock FamilyIncome.countDocuments to throw an error
    const originalCountDocuments = FamilyIncome.countDocuments;
    FamilyIncome.countDocuments = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    FamilyIncome.countDocuments = originalCountDocuments;
  });

  it("should handle database errors gracefully during user deletion", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    // Mock User.findByIdAndDelete to throw an error
    const originalFindByIdAndDelete = User.findByIdAndDelete;
    User.findByIdAndDelete = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    User.findByIdAndDelete = originalFindByIdAndDelete;
  });

  it("should check verification status before checking FamilyIncome references", async () => {
    const user = await createUserInDB({ isVerified: true });

    // Create FamilyIncome record (this should not be checked since user is verified)
    await createFamilyIncomeInDB({ contributorId: user._id });

    const context = global.createMockContext();

    // Should fail due to verification, not FamilyIncome references
    await expect(deleteUser(null, { id: user._id }, context)).rejects.toThrow(
      "Cannot delete verified user."
    );

    // Verify user was not deleted
    const existingUser = await User.findById(user._id);
    expect(existingUser).not.toBeNull();
  });

  it("should return the original ID after successful deletion", async () => {
    const user = await createUserInDB({ isVerified: false });
    const originalId = user._id;
    const context = global.createMockContext();

    const result = await deleteUser(null, { id: originalId }, context);

    expect(result).toBe(originalId);
    expect(result.toString()).toBe(originalId.toString());
  });

  it("should handle edge case with zero FamilyIncome count", async () => {
    const user = await createUserInDB({ isVerified: false });
    const context = global.createMockContext();

    // Explicitly verify count is 0
    const count = await FamilyIncome.countDocuments({
      contributorId: user._id,
    });
    expect(count).toBe(0);

    const result = await deleteUser(null, { id: user._id }, context);

    expect(result).toBe(user._id);

    // Verify user was deleted
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should handle user with all possible field combinations", async () => {
    const user = await createUserInDB({
      firstName: "Test",
      middleName: "Middle",
      lastName: "User",
      isVerified: false,
    });
    const context = global.createMockContext();

    const result = await deleteUser(null, { id: user._id }, context);

    expect(result).toBe(user._id);

    // Verify user was deleted regardless of field values
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should not affect other users during deletion", async () => {
    const userToDelete = await createUserInDB({
      firstName: "Delete",
      isVerified: false,
    });
    const userToKeep = await createUserInDB({
      firstName: "Keep",
      isVerified: false,
    });
    const context = global.createMockContext();

    await deleteUser(null, { id: userToDelete._id }, context);

    // Verify only the targeted user was deleted
    const deletedUser = await User.findById(userToDelete._id);
    const keptUser = await User.findById(userToKeep._id);

    expect(deletedUser).toBeNull();
    expect(keptUser).not.toBeNull();
    expect(keptUser.firstName).toBe("Keep");
  });
});
