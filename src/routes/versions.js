const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const authenticateToken = require('../middleware/auth');

// Public endpoints
router.get('/available', versionController.getAvailableVersions);
router.get('/core/:version/:filepath', versionController.getCoreFile);

// Protected endpoints - require authentication
router.get('/:instanceId', authenticateToken, versionController.getInstanceVersion);
router.put('/:instanceId', authenticateToken, versionController.updateInstanceVersion);
router.post('/:instanceId/rollback', authenticateToken, versionController.rollbackInstanceVersion);
router.get('/:instanceId/history', authenticateToken, versionController.getInstanceVersionHistory);

// Admin deployment endpoints
router.get('/deployment-status', authenticateToken, versionController.checkDeploymentStatus);
router.post('/deploy', authenticateToken, versionController.deployVersion);

module.exports = router;
