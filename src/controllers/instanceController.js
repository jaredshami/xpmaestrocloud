const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { generateInstanceId, generateSubdomain, generateFolderPath } = require('../utils/subdomainGenerator');
const vpsManager = require('../utils/vpsCommands');
const nginxService = require('../services/nginxService');

const prisma = new PrismaClient();

exports.createInstance = async (req, res, next) => {
  try {
    const { clientId, environment = 'prod' } = req.body;

    if (!clientId) {
      throw new ValidationError('Client ID is required');
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const instanceId = generateInstanceId();
    const subdomain = generateSubdomain(client.customerId, instanceId, environment);
    const folderPath = generateFolderPath(client.customerId, instanceId, environment);

    let vpsSetupSuccess = false;
    try {
      // Create folder on VPS
      await vpsManager.connect();
      const fullPath = `${process.env.WWW_ROOT}/${folderPath}`;
      await vpsManager.createFolder(fullPath);

      // Generate and upload Nginx configuration
      const nginxConfig = nginxService.generateConfig(subdomain, folderPath);
      await vpsManager.updateNginxConfig(subdomain, nginxConfig);

      // Test and reload Nginx
      await vpsManager.testNginxConfig();
      await vpsManager.reloadNginx();

      await vpsManager.disconnect();
      vpsSetupSuccess = true;
    } catch (vpsError) {
      // Log the error but allow instance creation to continue
      console.warn(`VPS setup skipped for instance: ${vpsError.message}`);
      // Instance will still be created in database
    }

    // Save instance to database
    const instance = await prisma.instance.create({
      data: {
        clientId: parseInt(clientId),
        customerId: client.customerId,
        instanceId,
        subdomain,
        folderPath,
        environment,
        status: 'active',
        // Create first admin user for this instance
        users: {
          create: {
            email: client.email,
            name: client.name,
            passwordHash: await bcrypt.hash(`${subdomain}-setup-${Date.now()}`, 10),
            role: 'admin',
            status: 'pending', // Needs to set password on first login
          },
        },
      },
      include: {
        users: true,
      },
    });

    res.status(201).json({
      ...instance,
      setupDetails: {
        message: 'Instance created successfully',
        firstAdminEmail: client.email,
        adminStatus: 'pending_password_setup',
        subdomain: instance.subdomain,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllInstances = async (req, res, next) => {
  try {
    const instances = await prisma.instance.findMany({
      include: {
        client: true,
      },
    });

    res.json(instances);
  } catch (error) {
    next(error);
  }
};

exports.getClientInstances = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const instances = await prisma.instance.findMany({
      where: { clientId: parseInt(clientId) },
    });

    res.json(instances);
  } catch (error) {
    next(error);
  }
};

exports.getInstanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
      },
    });

    if (!instance) {
      throw new NotFoundError('Instance not found');
    }

    res.json(instance);
  } catch (error) {
    next(error);
  }
};

exports.deleteInstance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(id) },
    });

    if (!instance) {
      throw new NotFoundError('Instance not found');
    }

    try {
      // Remove from VPS
      await vpsManager.connect();
      await vpsManager.deleteNginxConfig(instance.subdomain);
      await vpsManager.reloadNginx();
      await vpsManager.disconnect();
    } catch (vpsError) {
      console.error('Error cleaning up VPS:', vpsError.message);
      // Continue with database deletion even if VPS cleanup fails
    }

    // Delete from database
    await prisma.instance.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    next(error);
  }
};
