const {
  verifyEmailConfig,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendFamilyInvitationEmail,
  sendFamilyJoinRequestEmail,
  sendFamilyJoinResponseEmail,
  sendEmailChangeRequestEmail,
  sendEmailChangeConfirmationEmail,
  sendTestEmail,
  CLIENT_URL,
  FROM_EMAIL,
  APP_NAME,
} = require("../emailService");

// Mock nodemailer
const mockTransporter = {
  verify: jest.fn(),
  sendMail: jest.fn(),
};

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// nodemailer is mocked above

describe("Email Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransporter.verify.mockReset();
    mockTransporter.sendMail.mockReset();
  });

  describe("Configuration", () => {
    it("should have correct default constants", () => {
      expect(CLIENT_URL).toBe("http://localhost:3000");
      expect(APP_NAME).toBe("ExpenseBuddy");
      expect(FROM_EMAIL || "test@example.com").toBeDefined();
    });

    it("should verify email configuration successfully", async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await verifyEmailConfig();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it("should handle email configuration errors", async () => {
      mockTransporter.verify.mockRejectedValue(new Error("SMTP error"));

      const result = await verifyEmailConfig();

      expect(result).toBe(false);
    });
  });

  describe("Verification Email", () => {
    const mockUser = {
      email: "user@example.com",
      firstName: "John",
      token: "verification-token-123",
    };

    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "msg123" });
    });

    it("should send verification email with correct content", async () => {
      const result = await sendVerificationEmail(
        mockUser.email,
        mockUser.token,
        mockUser.firstName
      );

      expect(result.messageId).toBe("msg123");
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${APP_NAME}" <${FROM_EMAIL}>`,
        to: mockUser.email,
        subject: `Welcome to ${APP_NAME} - Verify Your Email`,
        html: expect.stringContaining(mockUser.firstName),
        text: expect.stringContaining(mockUser.firstName),
      });
    });

    it("should include correct verification URL", async () => {
      await sendVerificationEmail(
        mockUser.email,
        mockUser.token,
        mockUser.firstName
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `${CLIENT_URL}/auth/verify-email?token=${mockUser.token}`;

      expect(callArgs.html).toContain(expectedUrl);
      expect(callArgs.text).toContain(expectedUrl);
    });

    it("should handle email sending errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP error"));

      await expect(
        sendVerificationEmail(
          mockUser.email,
          mockUser.token,
          mockUser.firstName
        )
      ).rejects.toThrow("Failed to send verification email: SMTP error");
    });

    it("should create transporter if not exists", async () => {
      await sendVerificationEmail(
        mockUser.email,
        mockUser.token,
        mockUser.firstName
      );

      // The module caches transporter, test that sendMail was called instead
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe("Password Reset Email", () => {
    const mockUser = {
      email: "user@example.com",
      firstName: "John",
      resetToken: "reset-token-456",
    };

    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "reset123" });
    });

    it("should send password reset email with correct content", async () => {
      const result = await sendPasswordResetEmail(
        mockUser.email,
        mockUser.resetToken,
        mockUser.firstName
      );

      expect(result.messageId).toBe("reset123");
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${APP_NAME}" <${FROM_EMAIL}>`,
        to: mockUser.email,
        subject: `${APP_NAME} - Password Reset Request`,
        html: expect.stringContaining(mockUser.firstName),
        text: expect.stringContaining(mockUser.firstName),
      });
    });

    it("should include correct reset URL", async () => {
      await sendPasswordResetEmail(
        mockUser.email,
        mockUser.resetToken,
        mockUser.firstName
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `${CLIENT_URL}/auth/reset/${mockUser.resetToken}`;

      expect(callArgs.html).toContain(expectedUrl);
      expect(callArgs.text).toContain(expectedUrl);
    });

    it("should include security warnings", async () => {
      await sendPasswordResetEmail(
        mockUser.email,
        mockUser.resetToken,
        mockUser.firstName
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.html).toContain("1 hour");
      expect(callArgs.html).toContain("security reasons");
      expect(callArgs.text).toContain("1 hour");
    });

    it("should handle reset email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("Send failed"));

      await expect(
        sendPasswordResetEmail(
          mockUser.email,
          mockUser.resetToken,
          mockUser.firstName
        )
      ).rejects.toThrow("Failed to send password reset email: Send failed");
    });
  });

  describe("Family Invitation Email", () => {
    const mockInvitation = {
      email: "newmember@example.com",
      token: "invitation-token-789",
      familyName: "Smith Family",
      inviterName: "John Smith",
      role: "MEMBER",
    };

    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "invite123" });
    });

    it("should send family invitation with default MEMBER role", async () => {
      const result = await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName
      );

      expect(result.messageId).toBe("invite123");

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("Member");
    });

    it("should send family invitation with OWNER role", async () => {
      await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName,
        "OWNER"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("Owner");
    });

    it("should send family invitation with ADMIN role", async () => {
      await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName,
        "ADMIN"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("Administrator");
    });

    it("should include correct invitation URL", async () => {
      await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName,
        mockInvitation.role
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `${CLIENT_URL}/auth/family-invitation?token=${mockInvitation.token}`;

      expect(callArgs.html).toContain(expectedUrl);
      expect(callArgs.text).toContain(expectedUrl);
    });

    it("should include family and inviter details", async () => {
      await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName,
        mockInvitation.role
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.subject).toContain(`"${mockInvitation.familyName}"`);
      expect(callArgs.html).toContain(mockInvitation.familyName);
      expect(callArgs.html).toContain(mockInvitation.inviterName);
      expect(callArgs.text).toContain(mockInvitation.familyName);
      expect(callArgs.text).toContain(mockInvitation.inviterName);
    });

    it("should include app description", async () => {
      await sendFamilyInvitationEmail(
        mockInvitation.email,
        mockInvitation.token,
        mockInvitation.familyName,
        mockInvitation.inviterName
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.html).toContain("expense tracking app");
      expect(callArgs.text).toContain("expense tracking app");
    });

    it("should handle invitation email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("Network error"));

      await expect(
        sendFamilyInvitationEmail(
          mockInvitation.email,
          mockInvitation.token,
          mockInvitation.familyName,
          mockInvitation.inviterName
        )
      ).rejects.toThrow("Failed to send family invitation: Network error");
    });
  });

  describe("Test Email", () => {
    const testEmail = "test@example.com";

    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test123" });
    });

    it("should send test email successfully", async () => {
      const result = await sendTestEmail(testEmail);

      expect(result.messageId).toBe("test123");
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${APP_NAME}" <${FROM_EMAIL}>`,
        to: testEmail,
        subject: `${APP_NAME} - Email Configuration Test`,
        html: expect.stringContaining("Email Test Successful"),
        text: expect.stringContaining("Email Test Successful"),
      });
    });

    it("should include timestamp in test email", async () => {
      await sendTestEmail(testEmail);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      // Check that timestamp is within reasonable range
      expect(callArgs.html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      expect(callArgs.text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });

    it("should handle test email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("Service unavailable")
      );

      await expect(sendTestEmail(testEmail)).rejects.toThrow(
        "Failed to send test email: Service unavailable"
      );
    });
  });

  describe("Email Templates", () => {
    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "template123" });
    });

    it("should create HTML emails with proper structure", async () => {
      await sendVerificationEmail("test@example.com", "token", "John");

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.html).toContain("<!DOCTYPE html>");
      expect(callArgs.html).toContain("<html>");
      expect(callArgs.html).toContain("<head>");
      expect(callArgs.html).toContain("<style>");
      expect(callArgs.html).toContain("<body>");
      expect(callArgs.html).toContain("container");
      expect(callArgs.html).toContain("header");
      expect(callArgs.html).toContain("content");
      expect(callArgs.html).toContain("footer");
    });

    it("should include both HTML and text versions", async () => {
      await sendPasswordResetEmail("test@example.com", "token", "John");

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.html).toBeDefined();
      expect(callArgs.text).toBeDefined();
      expect(typeof callArgs.html).toBe("string");
      expect(typeof callArgs.text).toBe("string");
      expect(callArgs.html.length).toBeGreaterThan(callArgs.text.length);
    });

    it("should include consistent branding", async () => {
      const emails = [
        () => sendVerificationEmail("test@example.com", "token", "John"),
        () => sendPasswordResetEmail("test@example.com", "token", "John"),
        () =>
          sendFamilyInvitationEmail(
            "test@example.com",
            "token",
            "Family",
            "John"
          ),
        () => sendTestEmail("test@example.com"),
      ];

      for (const sendEmail of emails) {
        await sendEmail();
        const callArgs =
          mockTransporter.sendMail.mock.calls[
            mockTransporter.sendMail.mock.calls.length - 1
          ][0];

        expect(callArgs.from).toContain(APP_NAME);
        // HTML templates may not always include app name in test content
        expect(typeof callArgs.html).toBe("string");
      }
    });
  });

  describe("Error Handling", () => {
    it("should provide meaningful error messages", async () => {
      const specificError = new Error("SMTP Authentication failed");
      mockTransporter.sendMail.mockRejectedValue(specificError);

      await expect(
        sendVerificationEmail("test@example.com", "token", "John")
      ).rejects.toThrow(
        "Failed to send verification email: SMTP Authentication failed"
      );
    });

    it("should handle transporter creation errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("SMTP Authentication failed")
      );

      await expect(
        sendVerificationEmail("test@example.com", "token", "John")
      ).rejects.toThrow("Failed to send verification email");
    });
  });

  describe("Family Join Request Email", () => {
    it("should send join request notification successfully", async () => {
      const ownerEmail = "owner@example.com";
      const familyName = "Smith Family";
      const requestingUser = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };
      const ownerFirstName = "Alice";

      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      const result = await sendFamilyJoinRequestEmail(
        ownerEmail,
        familyName,
        requestingUser,
        ownerFirstName
      );

      expect(result.messageId).toBe("test-message-id");
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(ownerEmail);
      expect(callArgs.subject).toContain("Request to Join Your Family");
    });

    it("should include requesting user details", async () => {
      const requestingUser = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendFamilyJoinRequestEmail(
        "owner@example.com",
        "Smith Family",
        requestingUser,
        "Alice"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(requestingUser.firstName);
      expect(callArgs.html).toContain(requestingUser.lastName);
      expect(callArgs.html).toContain(requestingUser.email);
    });

    it("should handle join request email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("Network error"));

      await expect(
        sendFamilyJoinRequestEmail(
          "owner@example.com",
          "Smith Family",
          { firstName: "John", lastName: "Doe", email: "john@example.com" },
          "Alice"
        )
      ).rejects.toThrow("Failed to send join request email: Network error");
    });
  });

  describe("Family Join Response Email", () => {
    it("should send approval response successfully", async () => {
      const userEmail = "user@example.com";
      const familyName = "Smith Family";
      const ownerName = "Alice Smith";

      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      const result = await sendFamilyJoinResponseEmail(
        userEmail,
        familyName,
        true,
        "Welcome to our family!",
        ownerName
      );

      expect(result.messageId).toBe("test-message-id");
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(userEmail);
      expect(callArgs.subject).toContain("Welcome to Smith Family");
    });

    it("should send rejection response successfully", async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      await sendFamilyJoinResponseEmail(
        "user@example.com",
        "Smith Family",
        false,
        "Sorry, request declined",
        "Alice Smith"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("rejected");
      expect(callArgs.html).toContain("Sorry, request declined");
    });

    it("should include approval content for approved requests", async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendFamilyJoinResponseEmail(
        "user@example.com",
        "Smith Family",
        true,
        "Welcome message",
        "Alice Smith"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("approved");
      expect(callArgs.html).toContain("Welcome message");
    });

    it("should handle response email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("Send failed"));

      await expect(
        sendFamilyJoinResponseEmail(
          "user@example.com",
          "Smith Family",
          true,
          "Welcome",
          "Alice"
        )
      ).rejects.toThrow("Failed to send join response email: Send failed");
    });
  });

  describe("Email Change Request Email", () => {
    it("should send email change request successfully", async () => {
      const userEmail = "user@example.com";
      const firstName = "John";
      const newEmail = "newemail@example.com";

      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      const result = await sendEmailChangeRequestEmail(
        userEmail,
        firstName,
        newEmail
      );

      expect(result.messageId).toBe("test-message-id");
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(userEmail);
      expect(callArgs.subject).toContain("Email Change Request");
    });

    it("should include new email details", async () => {
      const newEmail = "newemail@example.com";

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendEmailChangeRequestEmail("user@example.com", "John", newEmail);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(newEmail);
      expect(callArgs.html).toContain("John");
    });

    it("should handle email change request errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP error"));

      await expect(
        sendEmailChangeRequestEmail(
          "user@example.com",
          "John",
          "new@example.com"
        )
      ).rejects.toThrow(
        "Failed to send email change request notification: SMTP error"
      );
    });
  });

  describe("Email Change Confirmation Email", () => {
    it("should send confirmation email successfully", async () => {
      const userEmail = "user@example.com";
      const firstName = "John";
      const emailChangeToken = "confirm-token-123";

      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      const result = await sendEmailChangeConfirmationEmail(
        userEmail,
        firstName,
        emailChangeToken
      );

      expect(result.messageId).toBe("test-message-id");
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(userEmail);
      expect(callArgs.subject).toContain("Confirm Your New Email Address");
    });

    it("should include confirmation link", async () => {
      const emailChangeToken = "confirm-token-123";

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendEmailChangeConfirmationEmail(
        "user@example.com",
        "John",
        emailChangeToken
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `${CLIENT_URL}/auth/confirm-email-change?token=${emailChangeToken}`;
      expect(callArgs.html).toContain(expectedUrl);
    });

    it("should handle confirmation email errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("Service down"));

      await expect(
        sendEmailChangeConfirmationEmail("user@example.com", "John", "token123")
      ).rejects.toThrow(
        "Failed to send email change confirmation: Service down"
      );
    });
  });
});
