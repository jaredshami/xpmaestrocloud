const express = require('express');
const router = express.Router({ mergeParams: true });
const instanceUserController = require('../controllers/instanceUserController');
const authenticateToken = require('../middleware/auth');

// Instance user login (no auth needed)
router.post('/login', instanceUserController.loginInstanceUser);

// Set/reset password (public for first-time setup, but can be called by authenticated users too)
router.post('/:userId/set-password', instanceUserController.setInstanceUserPassword);

// Get all users in instance
router.get('/', authenticateToken, instanceUserController.getInstanceUsers);

// Add user to instance
router.post('/', authenticateToken, instanceUserController.addInstanceUser);

// Update user role/status
router.put('/:userId', authenticateToken, instanceUserController.updateInstanceUser);

// Remove user from instance
router.delete('/:userId', authenticateToken, instanceUserController.removeInstanceUser);

module.exports = router;
