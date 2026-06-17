const express = require('express');
const {
  scanUrl,
  scanEmail,
  getMyHistory,
  getMyStats,
} = require('../controllers/scan.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Protected scan endpoints
const { scansLimiter } = require('../middleware/rateLimit');

router.post('/url', requireAuth, scansLimiter, scanUrl);
router.post('/email', requireAuth, scansLimiter, scanEmail);

// Protected dashboard endpoints
router.get('/history', requireAuth, scansLimiter, getMyHistory);
router.get('/stats', requireAuth, scansLimiter, getMyStats);

module.exports = router;
