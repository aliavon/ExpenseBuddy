const deleteIncomeTypes = require("../deleteIncomeTypes");
const { IncomeType, FamilyIncome } = require("../../../../database/schemas");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("deleteIncomeTypes mutation", () => {
  beforeEach(async () => {
    await IncomeType.deleteMany({});
    await FamilyIncome.deleteMany({});
    incomeTypeCounter = 0; // Reset counter for each test
  });

  let incomeTypeCounter = 0;
  const createIncomeTypeData = (overrides = {}) => {
    incomeTypeCounter++;
    return {
      name: `Income Type ${incomeTypeCounter}`,
      description: `Description ${incomeTypeCounter}`,
      ...overrides,
    };
  };

  const createIncomeTypeInDB = async (data = {}) => {
    const incomeTypeData = createIncomeTypeData(data);
    const incomeType = new IncomeType(incomeTypeData);
    return await incomeType.save();
  };

  const createFamilyIncomeInDB = async (typeId, overrides = {}) => {
    const familyIncome = new FamilyIncome({
      typeId,
      amount: 5000,
      date: new Date(),
      contributorId: global.createMockId(),
      currencyId: global.createMockId(),
      ...overrides,
    });
    return await familyIncome.save();
  };

  it("should delete single income type successfully", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    );

    expect(result).toEqual([incomeType._id]);
    
    // Verify deletion
    const deletedIncomeType = await IncomeType.findById(incomeType._id);
    expect(deletedIncomeType).toBeNull();

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully deleted income types"
    );
  });

  it("should delete multiple income types successfully", async () => {
    const incomeType1 = await createIncomeTypeInDB({ name: "Salary" });
    const incomeType2 = await createIncomeTypeInDB({ name: "Bonus" });
    const incomeType3 = await createIncomeTypeInDB({ name: "Freelance" });
    const context = global.createMockContext();

    const ids = [incomeType1._id, incomeType2._id, incomeType3._id];

    const result = await deleteIncomeTypes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    
    // Verify all were deleted
    const remainingIncomeTypes = await IncomeType.find({ _id: { $in: ids } });
    expect(remainingIncomeTypes).toHaveLength(0);

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted income types"
    );
  });

  it("should handle empty ids array", async () => {
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully deleted income types"
    );
  });

  it("should throw error when income type is used in FamilyIncome records", async () => {
    const incomeType = await createIncomeTypeInDB();
    await createFamilyIncomeInDB(incomeType._id);
    const context = global.createMockContext();

    await expect(deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    )).rejects.toThrow(GraphQLError);

    // Verify income type still exists
    const existingIncomeType = await IncomeType.findById(incomeType._id);
    expect(existingIncomeType).not.toBeNull();
  });

  it("should throw error with correct error code for income type in use", async () => {
    const incomeType = await createIncomeTypeInDB();
    await createFamilyIncomeInDB(incomeType._id);
    const context = global.createMockContext();

    try {
      await deleteIncomeTypes(
        null,
        { ids: [incomeType._id] },
        context
      );
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.INCOME_TYPE_IN_USE);
      expect(error.message).toBe("One or more IncomeTypes are in use and cannot be deleted.");
    }
  });

  it("should delete income types when no FamilyIncome references exist", async () => {
    const incomeType1 = await createIncomeTypeInDB();
    const incomeType2 = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [incomeType1._id, incomeType2._id] },
      context
    );

    expect(result).toEqual([incomeType1._id, incomeType2._id]);
    
    const remainingIncomeTypes = await IncomeType.find({ 
      _id: { $in: [incomeType1._id, incomeType2._id] } 
    });
    expect(remainingIncomeTypes).toHaveLength(0);
  });

  it("should handle multiple FamilyIncome references to same income type", async () => {
    const incomeType = await createIncomeTypeInDB();
    await createFamilyIncomeInDB(incomeType._id, { amount: 1000 });
    await createFamilyIncomeInDB(incomeType._id, { amount: 2000 });
    await createFamilyIncomeInDB(incomeType._id, { amount: 3000 });
    const context = global.createMockContext();

    await expect(deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    )).rejects.toThrow(GraphQLError);

    // Verify income type still exists
    const existingIncomeType = await IncomeType.findById(incomeType._id);
    expect(existingIncomeType).not.toBeNull();
  });

  it("should handle mixed income types - some in use, some not", async () => {
    const incomeType1 = await createIncomeTypeInDB(); // will be used
    const incomeType2 = await createIncomeTypeInDB(); // will not be used
    await createFamilyIncomeInDB(incomeType1._id);
    const context = global.createMockContext();

    await expect(deleteIncomeTypes(
      null,
      { ids: [incomeType1._id, incomeType2._id] },
      context
    )).rejects.toThrow(GraphQLError);

    // Verify both income types still exist (transaction-like behavior)
    const existingIncomeType1 = await IncomeType.findById(incomeType1._id);
    const existingIncomeType2 = await IncomeType.findById(incomeType2._id);
    expect(existingIncomeType1).not.toBeNull();
    expect(existingIncomeType2).not.toBeNull();
  });

  it("should handle non-existent income type IDs gracefully", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [nonExistentId] },
      context
    );

    expect(result).toEqual([nonExistentId]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully deleted income types"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingIncomeType = await createIncomeTypeInDB();
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [existingIncomeType._id, nonExistentId] },
      context
    );

    expect(result).toEqual([existingIncomeType._id, nonExistentId]);
    
    // Verify existing income type was deleted
    const deletedIncomeType = await IncomeType.findById(existingIncomeType._id);
    expect(deletedIncomeType).toBeNull();

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully deleted income types"
    );
  });

  it("should preserve order of IDs in result", async () => {
    const incomeType1 = await createIncomeTypeInDB();
    const incomeType2 = await createIncomeTypeInDB();
    const incomeType3 = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const ids = [incomeType3._id, incomeType1._id, incomeType2._id];

    const result = await deleteIncomeTypes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids); // Same order as input
  });

  it("should handle large batch deletion", async () => {
    const incomeTypes = [];
    for (let i = 1; i <= 20; i++) {
      incomeTypes.push(await createIncomeTypeInDB({ name: `Type ${i}` }));
    }

    const ids = incomeTypes.map(incomeType => incomeType._id);
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    
    // Verify all were deleted
    const remainingIncomeTypes = await IncomeType.find({ _id: { $in: ids } });
    expect(remainingIncomeTypes).toHaveLength(0);

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20 },
      "Successfully deleted income types"
    );
  });

  it("should handle duplicate IDs in input", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const ids = [incomeType._id, incomeType._id, incomeType._id];

    const result = await deleteIncomeTypes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids); // Returns all IDs including duplicates
    
    // Verify income type was deleted
    const deletedIncomeType = await IncomeType.findById(incomeType._id);
    expect(deletedIncomeType).toBeNull();

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted income types"
    );
  });

  it("should not affect other income types during deletion", async () => {
    const incomeTypeToDelete = await createIncomeTypeInDB({ name: "To Delete" });
    const incomeTypeToKeep = await createIncomeTypeInDB({ name: "To Keep" });
    const context = global.createMockContext();

    await deleteIncomeTypes(
      null,
      { ids: [incomeTypeToDelete._id] },
      context
    );

    // Verify correct income type was deleted
    const deletedIncomeType = await IncomeType.findById(incomeTypeToDelete._id);
    expect(deletedIncomeType).toBeNull();

    // Verify other income type still exists
    const keptIncomeType = await IncomeType.findById(incomeTypeToKeep._id);
    expect(keptIncomeType).not.toBeNull();
    expect(keptIncomeType.name).toBe("To Keep");
  });

  it("should handle database errors gracefully during FamilyIncome count", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    // Mock FamilyIncome.countDocuments to throw an error
    const originalCountDocuments = FamilyIncome.countDocuments;
    FamilyIncome.countDocuments = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.countDocuments = originalCountDocuments;
  });

  it("should handle database errors gracefully during income type deletion", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    // Mock IncomeType.deleteMany to throw an error
    const originalDeleteMany = IncomeType.deleteMany;
    IncomeType.deleteMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    IncomeType.deleteMany = originalDeleteMany;
  });

  it("should check FamilyIncome usage before deletion", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    // Spy on FamilyIncome.countDocuments to verify it's called
    const countSpy = jest.spyOn(FamilyIncome, 'countDocuments');

    await deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    );

    expect(countSpy).toHaveBeenCalledWith({ typeId: { $in: [incomeType._id] } });
    
    countSpy.mockRestore();
  });

  it("should handle ObjectId strings and ObjectId objects", async () => {
    const incomeType = await createIncomeTypeInDB();
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [incomeType._id.toString()] }, // string format
      context
    );

    expect(result).toEqual([incomeType._id.toString()]);
    
    // Verify deletion
    const deletedIncomeType = await IncomeType.findById(incomeType._id);
    expect(deletedIncomeType).toBeNull();
  });

  it("should return original IDs even after successful deletion", async () => {
    const incomeType = await createIncomeTypeInDB();
    const originalId = incomeType._id;
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [originalId] },
      context
    );

    expect(result).toEqual([originalId]);
    
    // Verify the income type no longer exists
    const deletedIncomeType = await IncomeType.findById(originalId);
    expect(deletedIncomeType).toBeNull();
  });

  it("should handle income types with special characters", async () => {
    const incomeType = await createIncomeTypeInDB({ 
      name: "Salaire & Bonus",
      description: "Paiement mensuel - très important!",
    });
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    );

    expect(result).toEqual([incomeType._id]);
    
    // Verify deletion
    const deletedIncomeType = await IncomeType.findById(incomeType._id);
    expect(deletedIncomeType).toBeNull();
  });

  it("should handle income types with emoji", async () => {
    const incomeType = await createIncomeTypeInDB({ 
      name: "Salary 💰",
      description: "Monthly income 🎉",
    });
    const context = global.createMockContext();

    const result = await deleteIncomeTypes(
      null,
      { ids: [incomeType._id] },
      context
    );

    expect(result).toEqual([incomeType._id]);
    
    // Verify deletion
    const deletedIncomeType = await IncomeType.findById(incomeType._id);
    expect(deletedIncomeType).toBeNull();
  });
}); 