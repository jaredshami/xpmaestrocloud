const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/register
 * Register new admin
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/logout
 * Logout
 */
router.post('/logout', authController.logout);

module.exports = router;
