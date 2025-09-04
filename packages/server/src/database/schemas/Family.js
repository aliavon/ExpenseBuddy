const mongoose = require("mongoose");
const crypto = require("crypto");
const modelNames = require("../modelNames");

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Owner of the family
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Default currency for the family
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
    },

    // Timezone for family operations
    timezone: {
      type: String,
      default: "UTC",
    },

    // Simple invite code for joining family (alternative to JWT tokens)
    inviteCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
    },
    inviteCodeExpires: {
      type: Date,
      default: null,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
familySchema.index({ ownerId: 1 });
familySchema.index({ inviteCode: 1 });
familySchema.index({ isActive: 1, createdAt: -1 });

// Generate unique invite code
familySchema.methods.generateInviteCode = function () {
  this.inviteCode = crypto.randomBytes(8).toString("hex").toUpperCase();
  this.inviteCodeExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return this.inviteCode;
};

// Check if invite code is valid
familySchema.methods.isInviteCodeValid = function () {
  return (
    this.inviteCode &&
    this.inviteCodeExpires &&
    this.inviteCodeExpires > new Date() &&
    this.isActive
  );
};

module.exports = mongoose.model(modelNames.Family, familySchema);
