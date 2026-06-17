const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All report routes require authentication
router.use(requireAuth);

// Create a new report (for users)
router.post('/', adminController.createReport);

// Get user's own reports
router.get('/my-reports', adminController.getUserReports);

module.exports = router;
