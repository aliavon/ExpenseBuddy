const mongoose = require("mongoose");

const familyJoinRequestSchema = new mongoose.Schema(
  {
    // User who sent the join request
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Family they want to join
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },

    // Family owner who will approve/reject
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Request status
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },

    // Optional message from requester
    message: {
      type: String,
      default: "",
    },

    // When the request was sent
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // When the request was responded to (approved/rejected)
    respondedAt: {
      type: Date,
      default: null,
    },

    // Response message from owner (optional)
    responseMessage: {
      type: String,
      default: "",
    },

    // Whether the request is active
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
familyJoinRequestSchema.index({ userId: 1, status: 1 });
familyJoinRequestSchema.index({ familyId: 1, status: 1 });
familyJoinRequestSchema.index({ ownerId: 1, status: 1 });

// Compound index to prevent duplicate pending requests
familyJoinRequestSchema.index(
  { userId: 1, familyId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);

const FamilyJoinRequest = mongoose.model(
  "FamilyJoinRequest",
  familyJoinRequestSchema
);

module.exports = FamilyJoinRequest;
