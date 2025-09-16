const nodemailer = require("nodemailer");

// Email configuration from environment
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;
const APP_NAME = process.env.APP_NAME || "ExpenseBuddy";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

let transporter = null;

/**
 * Initialize email transporter
 */
function createTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
  try {
    const transport = createTransporter();
    await transport.verify();
    console.log("Email service ready");
    return true;
  } catch (error) {
    console.error("Email service configuration error:", error);
    return false;
  }
}

/**
 * Send email verification message
 */
async function sendVerificationEmail(to, verificationToken, firstName) {
  const verificationUrl = `${CLIENT_URL}/auth/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Welcome to ${APP_NAME} - Verify Your Email`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Welcome ${firstName}!</h2>
            <p>Thanks for joining ${APP_NAME}. To complete your registration, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ${APP_NAME}!
      
      Hi ${firstName},
      
      Thanks for joining ${APP_NAME}. To complete your registration, please verify your email address.
      
      Click this link to verify: ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
    `,
  };

  try {
    const transport = createTransporter();
    const result = await transport.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
    return result;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(to, resetToken, firstName) {
  const resetUrl = `${CLIENT_URL}/auth/reset/${resetToken}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - Password Reset Request`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #FF9800; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
          .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password for your ${APP_NAME} account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't be changed until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${firstName},
      
      We received a request to reset your password for your ${APP_NAME} account.
      
      Click this link to reset your password: ${resetUrl}
      
      ⚠️ Important:
      - This link will expire in 1 hour for security reasons
      - If you didn't request this reset, please ignore this email
      - Your password won't be changed until you create a new one
    `,
  };

  try {
    const transport = createTransporter();
    const result = await transport.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

/**
 * Send family invitation email
 */
async function sendFamilyInvitationEmail(
  to,
  invitationToken,
  familyName,
  inviterName,
  role = "MEMBER"
) {
  const invitationUrl = `${CLIENT_URL}/auth/family-invitation?token=${invitationToken}`;

  const roleDisplayName =
    role === "OWNER" ? "Owner" : role === "ADMIN" ? "Administrator" : "Member";

  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - You're invited to join "${familyName}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #2196F3; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .family-info { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; }
          .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Family Invitation</h1>
          </div>
          <div class="content">
            <h2>You're Invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join their family on ${APP_NAME}.</p>
            
            <div class="family-info">
              <h3>Invitation Details:</h3>
              <p><strong>Family:</strong> ${familyName}</p>
              <p><strong>Your Role:</strong> ${roleDisplayName}</p>
              <p><strong>Invited by:</strong> ${inviterName}</p>
            </div>
            
            <p>Click the button below to accept this invitation:</p>
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${invitationUrl}">${invitationUrl}</a></p>
            
            <p><strong>What's ${APP_NAME}?</strong></p>
            <p>It's a family expense tracking app that helps you manage your household budget together!</p>
            
            <p><em>This invitation will expire in 24 hours.</em></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      You're invited to join "${familyName}" on ${APP_NAME}!
      
      ${inviterName} has invited you to join their family.
      
      Invitation Details:
      - Family: ${familyName}
      - Your Role: ${roleDisplayName}
      - Invited by: ${inviterName}
      
      Click this link to accept: ${invitationUrl}
      
      What's ${APP_NAME}? It's a family expense tracking app that helps you manage your household budget together!
      
      This invitation will expire in 24 hours.
    `,
  };

  try {
    const transport = createTransporter();
    const result = await transport.sendMail(mailOptions);
    console.log(`Family invitation sent to ${to} for family "${familyName}"`);
    return result;
  } catch (error) {
    console.error("Error sending family invitation email:", error);
    throw new Error(`Failed to send family invitation: ${error.message}`);
  }
}

/**
 * Test email configuration by sending a test email
 */
async function sendTestEmail(to) {
  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - Email Configuration Test`,
    html: `
      <h1>Email Test Successful! ✅</h1>
      <p>Your email configuration is working correctly.</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
    text: `Email Test Successful! Your email configuration is working correctly. Time: ${new Date().toISOString()}`,
  };

  try {
    const transport = createTransporter();
    const result = await transport.sendMail(mailOptions);
    console.log(`Test email sent to ${to}`);
    return result;
  } catch (error) {
    console.error("Error sending test email:", error);
    throw new Error(`Failed to send test email: ${error.message}`);
  }
}

/**
 * Send family join request email to family owner
 */
async function sendFamilyJoinRequestEmail(
  to,
  familyName,
  requestingUser,
  ownerFirstName
) {
  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - Request to Join Your Family`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #2196F3; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
          }
          .info-box { 
            background-color: #E3F2FD; 
            border-left: 4px solid #2196F3; 
            padding: 15px; 
            margin: 15px 0; 
          }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Family Join Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${ownerFirstName},</h2>
            <p>Someone would like to join your family on ${APP_NAME}!</p>
            
            <div class="info-box">
              <strong>Requesting User:</strong><br>
              Name: ${requestingUser.firstName} ${requestingUser.lastName}<br>
              Email: ${requestingUser.email}<br>
              <br>
              <strong>Your Family:</strong> ${familyName}
            </div>

            <p>If you know this person and would like to add them to your family, please log in to ${APP_NAME} and send them a family invitation.</p>

            <a href="${CLIENT_URL}/auth/login" class="button">Go to ${APP_NAME}</a>

            <p><strong>Note:</strong> This is just a notification. The person cannot join your family until you send them an official invitation.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transporter = createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log(`Family join request sent to ${to} for family "${familyName}"`);
    return result;
  } catch (error) {
    console.error("Error sending family join request email:", error);
    throw new Error(`Failed to send join request email: ${error.message}`);
  }
}

/**
 * Send email notification to user about family join request response
 */
async function sendFamilyJoinResponseEmail(
  to,
  familyName,
  isApproved,
  responseMessage,
  ownerName
) {
  const subject = isApproved
    ? `${APP_NAME} - Welcome to ${familyName}!`
    : `${APP_NAME} - Update on Your Family Request`;

  const statusText = isApproved ? "approved" : "rejected";
  const statusIcon = isApproved ? "✅" : "❌";
  const statusColor = isApproved ? "#4CAF50" : "#f44336";

  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
          .status-box {
            background-color: ${isApproved ? "#E8F5E8" : "#FFEBEE"};
            border-left: 4px solid ${statusColor};
            padding: 15px;
            margin: 15px 0;
          }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusIcon} Request ${
      isApproved ? "Approved" : "Rejected"
    }</h1>
          </div>
          <div class="content">
            <h2>Hi there!</h2>
            <p>We have an update on your request to join "${familyName}".</p>

            <div class="status-box">
              <strong>Status:</strong> Your request has been <strong>${statusText}</strong> by ${ownerName}.
            </div>

            ${
              responseMessage
                ? `
              <div class="status-box">
                <strong>Message from Family Owner:</strong><br>
                "${responseMessage}"
              </div>
            `
                : ""
            }

            ${
              isApproved
                ? `
              <p>🎉 Congratulations! You are now a member of "${familyName}". You can start tracking expenses with your family right away.</p>
              
              <a href="${CLIENT_URL}/auth/login" class="button">Login to ${APP_NAME}</a>
            `
                : `
              <p>Unfortunately, your request to join "${familyName}" was not approved at this time. You can try looking for other families or create your own.</p>
              
              <a href="${CLIENT_URL}/family-setup" class="button">Find Another Family</a>
            `
            }
            
          </div>
          <div class="footer">
            <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transporter = createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log(`Family join response email sent to ${to} (${statusText})`);
    return result;
  } catch (error) {
    console.error("Error sending family join response email:", error);
    throw new Error(`Failed to send join response email: ${error.message}`);
  }
}

/**
 * Send email change request notification to current email
 */
async function sendEmailChangeRequestEmail(to, firstName, newEmail) {
  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - Email Change Request`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Email Change Request</h2>
            <p>Hi ${firstName},</p>
            <p>You have requested to change your email address from <strong>${to}</strong> to <strong>${newEmail}</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you did not request this email change, please contact support immediately and change your password.
            </div>

            <p>To complete the email change, you need to:</p>
            <ol>
              <li>Check your new email address (<strong>${newEmail}</strong>) for a verification link</li>
              <li>Click the verification link to confirm the change</li>
            </ol>

            <p>This request will expire in 1 hour for security reasons.</p>
            
            <p>Best regards,<br>The ${APP_NAME} Team</p>
          </div>
          <div class="footer">
            <p>If you need help, contact us at support@expensebuddy.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transporter = createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email change request notification sent to ${to}`);
    return result;
  } catch (error) {
    console.error("Error sending email change request notification:", error);
    throw new Error(
      `Failed to send email change request notification: ${error.message}`
    );
  }
}

/**
 * Send email change confirmation to new email address
 */
async function sendEmailChangeConfirmationEmail(
  to,
  firstName,
  emailChangeToken
) {
  const confirmationUrl = `${CLIENT_URL}/auth/confirm-email-change?token=${emailChangeToken}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `${APP_NAME} - Confirm Your New Email Address`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Confirm Your New Email Address</h2>
            <p>Hi ${firstName},</p>
            <p>Please confirm that you want to change your ${APP_NAME} account email to this address.</p>
            
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Email Change</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
            
            <p><strong>This link will expire in 1 hour</strong> for security reasons.</p>
            
            <p>If you didn't request this change, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The ${APP_NAME} Team</p>
          </div>
          <div class="footer">
            <p>If you need help, contact us at support@expensebuddy.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transporter = createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email change confirmation sent to ${to}`);
    return result;
  } catch (error) {
    console.error("Error sending email change confirmation:", error);
    throw new Error(
      `Failed to send email change confirmation: ${error.message}`
    );
  }
}

module.exports = {
  verifyEmailConfig,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendFamilyInvitationEmail,
  sendFamilyJoinRequestEmail,
  sendFamilyJoinResponseEmail,
  sendEmailChangeRequestEmail,
  sendEmailChangeConfirmationEmail,
  sendTestEmail,

  // Constants for testing
  CLIENT_URL,
  FROM_EMAIL,
  APP_NAME,
};
