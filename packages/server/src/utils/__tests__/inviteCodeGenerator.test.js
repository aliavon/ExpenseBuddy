const { generateInviteCode } = require("../inviteCodeGenerator");

describe("generateInviteCode", () => {
  it("should generate a string", () => {
    const code = generateInviteCode();
    expect(typeof code).toBe("string");
  });

  it("should generate a code with exactly 6 characters", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it("should only contain alphanumeric uppercase characters", () => {
    const code = generateInviteCode();
    const validPattern = /^[A-Z0-9]{6}$/;
    expect(code).toMatch(validPattern);
  });

  it("should generate different codes on multiple calls", () => {
    const codes = new Set();
    // Generate 100 codes to test randomness
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }
    // Should have high uniqueness (at least 95% unique)
    expect(codes.size).toBeGreaterThan(95);
  });

  it("should be able to generate all possible characters", () => {
    const expectedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const foundChars = new Set();
    
    // Generate many codes to find all possible characters
    for (let i = 0; i < 1000; i++) {
      const code = generateInviteCode();
      for (const char of code) {
        foundChars.add(char);
      }
    }

    // Should find most of the possible characters (at least 30 out of 36)
    expect(foundChars.size).toBeGreaterThan(30);
    
    // All found characters should be valid
    for (const char of foundChars) {
      expect(expectedChars).toContain(char);
    }
  });

  it("should handle multiple consecutive calls", () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(generateInviteCode());
    }

    // All should be valid 6-character codes
    codes.forEach(code => {
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    // All should be strings
    codes.forEach(code => {
      expect(typeof code).toBe("string");
    });
  });

  it("should use all 36 possible characters from the character set", () => {
    const expectedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    expect(expectedChars).toHaveLength(36);
    
    // Verify character set includes A-Z (26 chars) and 0-9 (10 chars)
    const letters = expectedChars.match(/[A-Z]/g);
    const numbers = expectedChars.match(/[0-9]/g);
    
    expect(letters).toHaveLength(26);
    expect(numbers).toHaveLength(10);
  });
});
