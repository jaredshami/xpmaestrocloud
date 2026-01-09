const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

/**
 * POST /api/clients
 * Create new client
 */
router.post('/', clientController.createClient);

/**
 * GET /api/clients
 * Get all clients
 */
router.get('/', clientController.getAllClients);

/**
 * GET /api/clients/:id
 * Get client by ID
 */
router.get('/:id', clientController.getClientById);

/**
 * PUT /api/clients/:id
 * Update client
 */
router.put('/:id', clientController.updateClient);

/**
 * DELETE /api/clients/:id
 * Delete client
 */
router.delete('/:id', clientController.deleteClient);

module.exports = router;
