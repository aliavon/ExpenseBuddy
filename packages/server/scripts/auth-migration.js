const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const path = require("path");

// Import schemas
const {
  User,
  Family,
  Currency,
  Purchase,
  FamilyIncome,
} = require("../src/database/schemas");

// Configuration
const BATCH_SIZE = 100; // Process large collections in batches
const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = "temp123"; // Users will need to reset
const CHECKPOINT_DIR = path.join(__dirname, "checkpoints");

/**
 * Create default USD currency if it doesn't exist
 */
async function createDefaultCurrency() {
  console.log("🏦 Creating default USD currency...");

  try {
    let currency = await Currency.findOne({ code: "USD" });

    if (!currency) {
      currency = await Currency.create({
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        isActive: true,
      });
      console.log("✅ Created new USD currency");
    } else {
      // Ensure it's active
      if (!currency.isActive) {
        currency.isActive = true;
        await currency.save();
        console.log("✅ Activated existing USD currency");
      } else {
        console.log("ℹ️  USD currency already exists and is active");
      }
    }

    return currency;
  } catch (error) {
    console.error("❌ Error creating default currency:", error);
    throw error;
  }
}

/**
 * Create Legacy Family for existing users
 */
async function createLegacyFamily(currencyId) {
  console.log("👨‍👩‍👧‍👦 Creating Legacy Family...");

  try {
    let family = await Family.findOne({ name: "Legacy Family" });

    if (!family) {
      // Create with temporary ownerId, will be updated when first user is migrated
      const tempOwnerId = new mongoose.Types.ObjectId();

      family = await Family.create({
        name: "Legacy Family",
        description:
          "Auto-created family for existing users during authentication migration",
        currency: currencyId,
        timezone: "UTC",
        isActive: true,
        ownerId: tempOwnerId, // Temporary - will be updated during user migration
      });
      console.log("✅ Created Legacy Family with temporary owner");
    } else {
      console.log("ℹ️  Legacy Family already exists");
    }

    return family;
  } catch (error) {
    console.error("❌ Error creating Legacy Family:", error);
    throw error;
  }
}

/**
 * Migrate existing users with auth fields
 */
async function migrateUsers(familyId) {
  console.log("👤 Migrating users with authentication fields...");

  try {
    // Find users that don't have email (not yet migrated)
    const usersToMigrate = await User.find({
      email: { $exists: false },
    }).sort({ createdAt: 1 }); // First user becomes OWNER

    let migrated = 0;
    let skipped = 0;
    let ownerUser = null;

    for (const [index, user] of usersToMigrate.entries()) {
      try {
        // Generate temporary email
        const tempEmail = `user${user._id}@temp-expensebuddy.com`;

        // Hash default password
        const hashedPassword = await bcrypt.hash(
          DEFAULT_PASSWORD,
          BCRYPT_ROUNDS
        );

        // First user becomes OWNER, others are MEMBERs
        const roleInFamily = index === 0 ? "OWNER" : "MEMBER";

        // Update user with auth fields
        user.email = tempEmail;
        user.password = hashedPassword;
        user.familyId = familyId;
        user.roleInFamily = roleInFamily;
        user.isEmailVerified = false;
        user.lastLoginAt = null;

        await user.save();

        if (index === 0) {
          ownerUser = user;
        }

        migrated++;
        console.log(
          `✅ Migrated user: ${user.firstName} ${user.lastName} (${roleInFamily})`
        );
      } catch (userError) {
        console.error(
          `⚠️  Failed to migrate user ${user._id}:`,
          userError.message
        );
        skipped++;
      }
    }

    // Update Legacy Family with owner
    if (ownerUser) {
      await Family.findByIdAndUpdate(familyId, { ownerId: ownerUser._id });
      console.log(
        `✅ Set ${ownerUser.firstName} ${ownerUser.lastName} as Legacy Family owner`
      );
    }

    console.log(
      `📊 User migration complete: ${migrated} migrated, ${skipped} skipped`
    );

    return { migrated, skipped, ownerUserId: ownerUser?._id };
  } catch (error) {
    console.error("❌ Error migrating users:", error);
    throw error;
  }
}

/**
 * Migrate FamilyIncome records with familyId
 */
async function migrateFamilyIncomes(familyId) {
  console.log("💰 Migrating FamilyIncome records...");

  try {
    let migrated = 0;
    let skipped = 0;
    let batchesProcessed = 0;
    let totalRecords = 0;

    // Process in batches for memory efficiency
    let batch;

    do {
      // Find records without familyId (always start from beginning since records get updated)
      batch = await FamilyIncome.find({
        $or: [{ familyId: { $exists: false } }, { familyId: null }],
      }).limit(BATCH_SIZE);

      if (batch.length === 0) break;

      totalRecords = await FamilyIncome.countDocuments({
        $or: [{ familyId: { $exists: false } }, { familyId: null }],
      });

      console.log(
        `📦 Processing FamilyIncome batch: ${migrated + 1}-${
          migrated + batch.length
        } of ${totalRecords + migrated}`
      );

      // Update batch
      const batchIds = batch.map((record) => record._id);
      const updateResult = await FamilyIncome.updateMany(
        { _id: { $in: batchIds } },
        { $set: { familyId: familyId } }
      );

      migrated += updateResult.modifiedCount;
      batchesProcessed++;
    } while (batch.length === BATCH_SIZE);

    console.log(
      `📊 FamilyIncome migration complete: ${migrated} migrated, ${skipped} skipped, ${batchesProcessed} batches`
    );

    return { migrated, skipped, batchesProcessed };
  } catch (error) {
    console.error("❌ Error migrating FamilyIncome records:", error);
    throw error;
  }
}

/**
 * Migrate Purchase records with familyId and createdByUserId
 */
async function migratePurchases(familyId, defaultCreatedByUserId) {
  console.log("🛒 Migrating Purchase records...");

  try {
    let migrated = 0;
    let skipped = 0;
    let batchesProcessed = 0;
    let totalRecords = 0;

    // Process in batches for memory efficiency
    let batch;

    do {
      // Find records without familyId (always start from beginning since records get updated)
      batch = await Purchase.find({
        $or: [{ familyId: { $exists: false } }, { familyId: null }],
      }).limit(BATCH_SIZE);

      if (batch.length === 0) break;

      totalRecords = await Purchase.countDocuments({
        $or: [{ familyId: { $exists: false } }, { familyId: null }],
      });

      console.log(
        `📦 Processing Purchase batch: ${migrated + 1}-${
          migrated + batch.length
        } of ${totalRecords + migrated}`
      );

      // Update batch
      const batchIds = batch.map((record) => record._id);
      const updateResult = await Purchase.updateMany(
        { _id: { $in: batchIds } },
        {
          $set: {
            familyId: familyId,
            createdByUserId: defaultCreatedByUserId,
          },
        }
      );

      migrated += updateResult.modifiedCount;
      batchesProcessed++;
    } while (batch.length === BATCH_SIZE);

    console.log(
      `📊 Purchase migration complete: ${migrated} migrated, ${skipped} skipped, ${batchesProcessed} batches`
    );

    return { migrated, skipped, batchesProcessed };
  } catch (error) {
    console.error("❌ Error migrating Purchase records:", error);
    throw error;
  }
}

/**
 * Create required database indexes
 */
async function createIndexes() {
  console.log("📇 Creating database indexes...");

  const indexesToCreate = [
    // User indexes
    {
      collection: User,
      indexes: [
        { email: 1 }, // Unique email lookup
        { familyId: 1 }, // Family members lookup
        { emailVerificationToken: 1 }, // Email verification
        { passwordResetToken: 1 }, // Password reset
      ],
    },

    // Family indexes
    {
      collection: Family,
      indexes: [
        { inviteCode: 1 }, // Invite code lookup
        { ownerId: 1 }, // Family owner lookup
      ],
    },

    // Purchase indexes
    {
      collection: Purchase,
      indexes: [
        { familyId: 1 }, // Family purchases
        { createdByUserId: 1 }, // User purchases
        { familyId: 1, date: -1 }, // Family purchases by date
      ],
    },

    // FamilyIncome indexes
    {
      collection: FamilyIncome,
      indexes: [
        { familyId: 1 }, // Family income
        { userId: 1 }, // User income
        { familyId: 1, date: -1 }, // Family income by date
      ],
    },
  ];

  const created = [];
  const errors = [];

  for (const { collection, indexes } of indexesToCreate) {
    const collectionName = collection.collection.name;
    console.log(`📋 Creating indexes for ${collectionName}...`);

    for (const index of indexes) {
      try {
        await collection.collection.createIndex(index, {
          background: true,
          // Add unique constraint for email
          ...(index.email && { unique: true }),
        });

        const indexName = Object.keys(index).join("_");
        created.push(`${collectionName}.${indexName}`);
        console.log(`  ✅ Created index: ${indexName}`);
      } catch (error) {
        if (error.code === 11000 || error.message.includes("already exists")) {
          // Index already exists, that's fine
          console.log(
            `  ℹ️  Index already exists: ${Object.keys(index).join("_")}`
          );
        } else {
          const errorMsg = `Failed to create index ${Object.keys(index).join(
            "_"
          )} on ${collectionName}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
        }
      }
    }
  }

  console.log(
    `📊 Index creation complete: ${created.length} created, ${errors.length} errors`
  );

  return { created, errors };
}

/**
 * Verify data integrity after migration
 */
async function verifyDataIntegrity() {
  console.log("🔍 Verifying data integrity...");

  const errors = [];
  const validations = {};

  try {
    // Check 1: All users should have email
    const usersWithoutEmail = await User.countDocuments({
      email: { $exists: false },
    });
    validations.usersWithEmail = usersWithoutEmail === 0;
    if (usersWithoutEmail > 0) {
      errors.push(`Found users without email addresses`);
    }

    // Check 2: All users should have familyId
    const usersWithoutFamily = await User.countDocuments({
      familyId: { $exists: false },
    });
    validations.usersWithFamily = usersWithoutFamily === 0;
    if (usersWithoutFamily > 0) {
      errors.push(`Found users without familyId`);
    }

    // Check 3: All families should have owner
    const familiesWithoutOwner = await Family.countDocuments({
      ownerId: { $exists: false },
    });
    validations.familiesWithOwner = familiesWithoutOwner === 0;
    if (familiesWithoutOwner > 0) {
      errors.push(`Found families without owner`);
    }

    // Check 4: All FamilyIncome records should have familyId
    const familyIncomesWithoutFamily = await FamilyIncome.countDocuments({
      $or: [{ familyId: { $exists: false } }, { familyId: null }],
    });
    validations.familyIncomesLinked = familyIncomesWithoutFamily === 0;
    if (familyIncomesWithoutFamily > 0) {
      errors.push(`Found FamilyIncome records without familyId`);
    }

    // Check 5: All Purchase records should have familyId and createdByUserId
    const purchasesWithoutFamily = await Purchase.countDocuments({
      $or: [{ familyId: { $exists: false } }, { familyId: null }],
    });
    const purchasesWithoutCreator = await Purchase.countDocuments({
      $or: [{ createdByUserId: { $exists: false } }, { createdByUserId: null }],
    });
    validations.purchasesLinked =
      purchasesWithoutFamily === 0 && purchasesWithoutCreator === 0;
    if (purchasesWithoutFamily > 0) {
      errors.push(`Found Purchase records without familyId`);
    }
    if (purchasesWithoutCreator > 0) {
      errors.push(`Found Purchase records without createdByUserId`);
    }

    // Check 6: Verify indexes exist
    const userIndexes = await User.collection.indexes();
    const emailIndex = userIndexes.find((idx) => idx.key.email === 1);
    validations.indexesCreated = !!emailIndex;
    if (!emailIndex) {
      errors.push(`Email index not found on User collection`);
    }

    // Summary
    const isValid = errors.length === 0;

    if (isValid) {
      console.log("✅ Data integrity verification passed");
    } else {
      console.error(
        `❌ Data integrity verification failed with ${errors.length} errors`
      );
      errors.forEach((error) => console.error(`  - ${error}`));
    }

    return { isValid, errors, validations };
  } catch (error) {
    console.error("❌ Error verifying data integrity:", error);
    throw error;
  }
}

/**
 * Create checkpoint of current database state
 */
async function createCheckpoint() {
  console.log("💾 Creating database checkpoint...");

  try {
    // Ensure checkpoint directory exists
    await fs.mkdir(CHECKPOINT_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const checkpointData = {
      timestamp,
      collections: {},
    };

    // Save current state of all collections
    console.log("📦 Backing up collections...");

    checkpointData.collections.users = await User.find({}).lean();
    checkpointData.collections.families = await Family.find({}).lean();
    checkpointData.collections.currencies = await Currency.find({}).lean();
    checkpointData.collections.purchases = await Purchase.find({}).lean();
    checkpointData.collections.familyIncomes = await FamilyIncome.find(
      {}
    ).lean();

    console.log(`📊 Checkpoint created:`);
    console.log(`  - Users: ${checkpointData.collections.users.length}`);
    console.log(`  - Families: ${checkpointData.collections.families.length}`);
    console.log(
      `  - Currencies: ${checkpointData.collections.currencies.length}`
    );
    console.log(
      `  - Purchases: ${checkpointData.collections.purchases.length}`
    );
    console.log(
      `  - FamilyIncomes: ${checkpointData.collections.familyIncomes.length}`
    );

    // Save to file
    const checkpointFile = path.join(
      CHECKPOINT_DIR,
      `checkpoint-${timestamp}.json`
    );
    await fs.writeFile(checkpointFile, JSON.stringify(checkpointData, null, 2));

    console.log(`✅ Checkpoint saved to: ${checkpointFile}`);

    return checkpointData;
  } catch (error) {
    console.error("❌ Error creating checkpoint:", error);
    throw error;
  }
}

/**
 * Restore database from checkpoint
 */
async function restoreFromCheckpoint(checkpointData) {
  console.log("🔄 Restoring database from checkpoint...");

  try {
    const errors = [];

    // Clear current collections
    console.log("🗑️  Clearing current collections...");
    await User.deleteMany({});
    await Family.deleteMany({});
    await Currency.deleteMany({});
    await Purchase.deleteMany({});
    await FamilyIncome.deleteMany({});

    // Restore each collection
    console.log("📥 Restoring collections...");

    if (checkpointData.collections.users.length > 0) {
      await User.insertMany(checkpointData.collections.users);
      console.log(
        `✅ Restored ${checkpointData.collections.users.length} users`
      );
    }

    if (checkpointData.collections.families.length > 0) {
      await Family.insertMany(checkpointData.collections.families);
      console.log(
        `✅ Restored ${checkpointData.collections.families.length} families`
      );
    }

    if (checkpointData.collections.currencies.length > 0) {
      await Currency.insertMany(checkpointData.collections.currencies);
      console.log(
        `✅ Restored ${checkpointData.collections.currencies.length} currencies`
      );
    }

    if (checkpointData.collections.purchases.length > 0) {
      await Purchase.insertMany(checkpointData.collections.purchases);
      console.log(
        `✅ Restored ${checkpointData.collections.purchases.length} purchases`
      );
    }

    if (checkpointData.collections.familyIncomes.length > 0) {
      await FamilyIncome.insertMany(checkpointData.collections.familyIncomes);
      console.log(
        `✅ Restored ${checkpointData.collections.familyIncomes.length} family incomes`
      );
    }

    console.log("✅ Database restoration complete");

    return { restored: true, errors };
  } catch (error) {
    console.error("❌ Error restoring from checkpoint:", error);
    throw error;
  }
}

/**
 * Complete rollback of migration
 */
async function rollbackMigration(checkpointData) {
  console.log("⏪ Rolling back migration...");

  try {
    const errors = [];

    // Restore from checkpoint
    await restoreFromCheckpoint(checkpointData);

    // Drop any new indexes that were created
    try {
      await User.collection.dropIndex({ email: 1 });
      console.log("✅ Dropped email index");
    } catch (error) {
      if (!error.message.includes("index not found")) {
        errors.push(`Failed to drop email index: ${error.message}`);
      }
    }

    console.log("✅ Migration rollback complete");

    return { success: true, errors };
  } catch (error) {
    console.error("❌ Error rolling back migration:", error);
    return { success: false, errors: [error.message] };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log("🚀 Starting Authentication Migration...");
  console.log("====================================");

  let checkpoint;

  try {
    // Step 0: Create checkpoint
    console.log("\n📍 Step 0: Creating checkpoint...");
    checkpoint = await createCheckpoint();

    // Step 1: Create default currency
    console.log("\n📍 Step 1: Default Currency");
    const defaultCurrency = await createDefaultCurrency();

    // Step 2: Create legacy family
    console.log("\n📍 Step 2: Legacy Family");
    const legacyFamily = await createLegacyFamily(defaultCurrency._id);

    // Step 3: Migrate users
    console.log("\n📍 Step 3: User Migration");
    const userMigration = await migrateUsers(legacyFamily._id);

    if (userMigration.migrated === 0) {
      console.log("ℹ️  No users to migrate, migration complete!");
      return;
    }

    // Step 4: Migrate FamilyIncomes
    console.log("\n📍 Step 4: FamilyIncome Migration");
    await migrateFamilyIncomes(legacyFamily._id);

    // Step 5: Migrate Purchases
    console.log("\n📍 Step 5: Purchase Migration");
    await migratePurchases(legacyFamily._id, userMigration.ownerUserId);

    // Step 6: Create indexes
    console.log("\n📍 Step 6: Index Creation");
    await createIndexes();

    // Step 7: Verify integrity
    console.log("\n📍 Step 7: Data Integrity Verification");
    const integrity = await verifyDataIntegrity();

    if (!integrity.isValid) {
      console.error("❌ Data integrity check failed!");
      console.log("\n⏪ Rolling back migration...");
      await rollbackMigration(checkpoint);
      process.exit(1);
    }

    console.log("\n🎉 Authentication Migration Complete!");
    console.log("=====================================");
    console.log(`✅ Migration successful`);
    console.log(`📊 Users migrated: ${userMigration.migrated}`);
    console.log(`💰 Default currency: ${defaultCurrency.code}`);
    console.log(`👨‍👩‍👧‍👦 Legacy family created: ${legacyFamily.name}`);
    console.log("");
    console.log("⚠️  IMPORTANT: All users now have temporary passwords!");
    console.log("   Default password: 'temp123'");
    console.log("   Users will need to reset their passwords on first login.");
    console.log("");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);

    if (checkpoint) {
      console.log("\n⏪ Rolling back migration...");
      try {
        await rollbackMigration(checkpoint);
        console.log("✅ Rollback successful");
      } catch (rollbackError) {
        console.error("❌ Rollback failed:", rollbackError);
      }
    }

    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  createDefaultCurrency,
  createLegacyFamily,
  migrateUsers,
  migrateFamilyIncomes,
  migratePurchases,
  createIndexes,
  verifyDataIntegrity,
  createCheckpoint,
  restoreFromCheckpoint,
  rollbackMigration,
  runMigration,
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration process complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration process failed:", error);
      process.exit(1);
    });
}
