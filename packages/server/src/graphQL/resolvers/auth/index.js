const register = require("./register");
const login = require("./login");
const logout = require("./logout");
const refreshToken = require("./refreshToken");
const verifyEmail = require("./verifyEmail");
const sendVerificationEmail = require("./sendVerificationEmail");
const requestPasswordReset = require("./requestPasswordReset");
const resetPassword = require("./resetPassword");
const changePassword = require("./changePassword");
const createFamily = require("./createFamily");
const updateFamily = require("./updateFamily");
const joinFamilyByCode = require("./joinFamilyByCode");
const leaveFamilyIfNotOwner = require("./leaveFamily"); // Use schema name
const inviteToFamily = require("./inviteToFamily");
const removeFamilyMember = require("./removeFamilyMember");
const updateMemberRole = require("./updateMemberRole");

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  sendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  createFamily,
  updateFamily,
  joinFamilyByCode,
  leaveFamilyIfNotOwner, // Schema uses this name
  inviteToFamily,
  removeFamilyMember,
  updateMemberRole,
};
