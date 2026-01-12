const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const authenticateToken = require('../middleware/auth');

// Public endpoints
router.get('/available', versionController.getAvailableVersions);
router.get('/core/:version/:filepath', versionController.getCoreFile);

// Admin deployment endpoints (must come BEFORE /:instanceId routes)
router.get('/deployment-status', authenticateToken, versionController.checkDeploymentStatus);
router.post('/deploy', authenticateToken, versionController.deployVersion);

// Protected endpoints - require authentication (generic :id routes go LAST)
router.get('/:instanceId', authenticateToken, versionController.getInstanceVersion);
router.put('/:instanceId', authenticateToken, versionController.updateInstanceVersion);
router.post('/:instanceId/rollback', authenticateToken, versionController.rollbackInstanceVersion);
router.get('/:instanceId/history', authenticateToken, versionController.getInstanceVersionHistory);
router.put('/:version/latest', authenticateToken, versionController.markVersionAsLatest);
router.delete('/:version', authenticateToken, versionController.deleteVersion);

module.exports = router;
