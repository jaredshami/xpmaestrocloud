const express = require('express');
const router = express.Router();
const instanceController = require('../controllers/instanceController');

/**
 * POST /api/instances
 * Create new instance
 */
router.post('/', instanceController.createInstance);

/**
 * GET /api/instances
 * Get all instances
 */
router.get('/', instanceController.getAllInstances);

/**
 * GET /api/instances/client/:clientId
 * Get instances for a specific client
 */
router.get('/client/:clientId', instanceController.getClientInstances);

/**
 * GET /api/instances/:id
 * Get instance by ID
 */
router.get('/:id', instanceController.getInstanceById);

/**
 * DELETE /api/instances/:id
 * Delete instance
 */
router.delete('/:id', instanceController.deleteInstance);

module.exports = router;
