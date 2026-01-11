const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { ValidationError, NotFoundError } = require('../utils/errors');

const prisma = new PrismaClient();
const CORE_DIR = path.join(__dirname, '../../core');

exports.getAvailableVersions = async (req, res, next) => {
  try {
    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    res.json({
      latest: manifest.latest,
      versions: manifest.versions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInstanceVersion = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    
    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(instanceId) },
      select: {
        id: true,
        coreVersion: true,
        subdomain: true,
      },
    });

    if (!instance) {
      throw new NotFoundError('Instance not found');
    }

    res.json({
      instanceId: instance.id,
      currentVersion: instance.coreVersion,
      subdomain: instance.subdomain,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInstanceVersion = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const { targetVersion } = req.body;
    const instanceUserId = req.instanceUser?.id;

    if (!targetVersion) {
      throw new ValidationError('targetVersion is required');
    }

    // Check if user is instance admin
    if (!instanceUserId) {
      throw new ValidationError('User not authenticated');
    }

    const instanceUser = await prisma.instanceUser.findUnique({
      where: { id: instanceUserId },
    });

    if (!instanceUser || instanceUser.role !== 'admin') {
      throw new ValidationError('Only instance admins can update versions');
    }

    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(instanceId) },
    });

    if (!instance) {
      throw new NotFoundError('Instance not found');
    }

    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    const versionExists = manifest.versions.some(v => v.version === targetVersion);
    if (!versionExists) {
      throw new ValidationError(`Version ${targetVersion} does not exist`);
    }

    const fromVersion = instance.coreVersion;

    // Create version history record
    const history = await prisma.versionHistory.create({
      data: {
        instanceId: parseInt(instanceId),
        fromVersion,
        toVersion: targetVersion,
        status: 'pending',
      },
    });

    // Update instance version
    const updated = await prisma.instance.update({
      where: { id: parseInt(instanceId) },
      data: { coreVersion: targetVersion },
      select: {
        id: true,
        coreVersion: true,
        subdomain: true,
      },
    });

    // Mark history as completed
    await prisma.versionHistory.update({
      where: { id: history.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Updated from ${fromVersion} to ${targetVersion}`,
      instance: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.rollbackInstanceVersion = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const instanceUserId = req.instanceUser?.id;

    // Check if user is instance admin
    if (!instanceUserId) {
      throw new ValidationError('User not authenticated');
    }

    const instanceUser = await prisma.instanceUser.findUnique({
      where: { id: instanceUserId },
    });

    if (!instanceUser || instanceUser.role !== 'admin') {
      throw new ValidationError('Only instance admins can rollback versions');
    }

    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(instanceId) },
    });

    if (!instance) {
      throw new NotFoundError('Instance not found');
    }

    // Get previous version from history
    const previousUpdate = await prisma.versionHistory.findFirst({
      where: {
        instanceId: parseInt(instanceId),
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      skip: 1,
    });

    if (!previousUpdate) {
      throw new ValidationError('No previous version to rollback to');
    }

    const rollbackVersion = previousUpdate.fromVersion;

    // Create new history record for rollback
    const history = await prisma.versionHistory.create({
      data: {
        instanceId: parseInt(instanceId),
        fromVersion: instance.coreVersion,
        toVersion: rollbackVersion,
        status: 'pending',
        notes: 'Rollback initiated',
      },
    });

    // Update instance version
    const updated = await prisma.instance.update({
      where: { id: parseInt(instanceId) },
      data: { coreVersion: rollbackVersion },
      select: {
        id: true,
        coreVersion: true,
        subdomain: true,
      },
    });

    // Mark history as completed
    await prisma.versionHistory.update({
      where: { id: history.id },
      data: {
        status: 'rolled_back',
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Rolled back to ${rollbackVersion}`,
      instance: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInstanceVersionHistory = async (req, res, next) => {
  try {
    const { instanceId } = req.params;

    const history = await prisma.versionHistory.findMany({
      where: { instanceId: parseInt(instanceId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
};

exports.getCoreFile = async (req, res, next) => {
  try {
    const { version, filepath } = req.params;
    const filePath = path.join(CORE_DIR, 'versions', version, filepath);
    
    // Security: prevent directory traversal
    const realPath = path.resolve(filePath);
    const versionPath = path.resolve(path.join(CORE_DIR, 'versions', version));
    
    if (!realPath.startsWith(versionPath)) {
      throw new ValidationError('Invalid file path');
    }

    if (!fs.existsSync(realPath)) {
      throw new NotFoundError('File not found');
    }

    const content = fs.readFileSync(realPath, 'utf-8');
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(content);
  } catch (error) {
    next(error);
  }
};
