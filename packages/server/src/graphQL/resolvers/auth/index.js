const register = require("./register");
const login = require("./login");
const logout = require("./logout");
const refreshToken = require("./refreshToken");
const verifyEmail = require("./verifyEmail");
const sendVerificationEmail = require("./sendVerificationEmail");
const requestPasswordReset = require("./requestPasswordReset");
const resetPassword = require("./resetPassword");
const changePassword = require("./changePassword");

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
};
