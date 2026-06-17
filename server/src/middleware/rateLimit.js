const rateLimit = require('express-rate-limit');

// Simple, beginner-friendly rate limit configuration.
// Adjust thresholds based on your needs.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // max 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

const scansLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  scansLimiter,
};

