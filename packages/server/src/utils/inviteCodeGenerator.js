/**
 * Generates a unique invite code for family invitations
 * Format: 6-character alphanumeric uppercase string
 */
function generateInviteCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

module.exports = {
  generateInviteCode,
};
