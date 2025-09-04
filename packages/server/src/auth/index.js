/**
 * Authentication and Authorization utilities
 *
 * This module provides:
 * - JWT token generation, verification, and management
 * - Redis-based token blacklisting with TTL auto-cleanup
 * - Email services for registration, password reset, invitations
 * - GraphQL context enhancers for authentication and authorization
 */

// JWT utilities
const jwtUtils = require("./jwtUtils");

// Redis client for token blacklisting
const redisClient = require("./redisClient");

// Email services
const emailService = require("./emailService");

// Authentication context for GraphQL
const authContext = require("./authContext");

module.exports = {
  // JWT utilities
  ...jwtUtils,

  // Redis utilities
  ...redisClient,

  // Email utilities
  ...emailService,

  // Auth context utilities
  ...authContext,

  // Grouped exports for convenience
  jwt: jwtUtils,
  redis: redisClient,
  email: emailService,
  context: authContext,
};
