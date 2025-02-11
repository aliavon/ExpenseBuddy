const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(modelNames.User, userSchema);
