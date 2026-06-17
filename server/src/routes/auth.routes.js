const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const { authLimiter } = require('../middleware/rateLimit');

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);

module.exports = router;
