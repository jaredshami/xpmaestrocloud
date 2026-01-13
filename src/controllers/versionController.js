const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const { ValidationError, NotFoundError } = require('../utils/errors');

const execAsync = promisify(exec);

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

// Helper function to fetch manifest from GitHub
const fetchGitHubManifest = () => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    // Use GitHub API instead of raw.githubusercontent.com to avoid aggressive caching
    const options = {
      hostname: 'api.github.com',
      path: `/repos/jaredshami/xpmaestrocloud/contents/core/manifests.json?t=${timestamp}&r=${random}`,
      method: 'GET',
      headers: {
        'User-Agent': 'xpmaestrocloud-server',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/vnd.github.v3.raw',
      },
    };

    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const manifest = JSON.parse(data);
            resolve(manifest);
          } catch (e) {
            reject(new Error('Failed to parse GitHub manifest: ' + e.message));
          }
        } else {
          reject(new Error(`GitHub returned status ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
};

exports.checkDeploymentStatus = async (req, res, next) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Fetch GitHub manifest
    let gitHubManifest;
    try {
      gitHubManifest = await fetchGitHubManifest();
      console.log('[Deployment] Successfully fetched manifest from GitHub');
      console.log('[Deployment] Latest version from GitHub:', gitHubManifest.latest);
    } catch (githubError) {
      console.error('[Deployment] GitHub fetch failed:', githubError.message);
      throw githubError;
    }

    // Fetch VPS manifest
    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    if (!fs.existsSync(manifestPath)) {
      throw new NotFoundError('VPS manifest not found');
    }
    
    const vpsManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('[Deployment] VPS latest version:', vpsManifest.latest);

    // Compare: is there a new version in GitHub not on VPS?
    const gitHubLatestVersion = gitHubManifest.latest;
    const vpsLatestVersion = vpsManifest.latest;
    
    const hasNewVersion = gitHubLatestVersion !== vpsLatestVersion;
    console.log('[Deployment] New version available?', hasNewVersion, `(GitHub: ${gitHubLatestVersion}, VPS: ${vpsLatestVersion})`);

    // Find the new version info in GitHub manifest
    let newVersionInfo = null;
    if (hasNewVersion) {
      newVersionInfo = gitHubManifest.versions.find(v => v.version === gitHubLatestVersion);
    }

    res.json({
      hasNewVersion,
      gitHubLatest: gitHubLatestVersion,
      vpsLatest: vpsLatestVersion,
      newVersionInfo: newVersionInfo, // Contains version, description, etc if new version exists
      allVersionsOnGitHub: gitHubManifest.versions,
    });
  } catch (error) {
    next(error);
  }
};

exports.deployVersion = async (req, res, next) => {
  try {
    const { versionNumber, description } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ValidationError('User not authenticated');
    }

    if (!versionNumber || !description) {
      throw new ValidationError('versionNumber and description are required');
    }

    // Validate version format (e.g., 1.0.0, v1.0.0)
    if (!/^v?\d+\.\d+\.\d+$/.test(versionNumber)) {
      throw new ValidationError('Version must be in format X.Y.Z or vX.Y.Z (e.g., 1.0.0 or v1.0.0)');
    }

    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if version already exists
    if (manifest.versions.some(v => v.version === versionNumber)) {
      throw new ValidationError(`Version ${versionNumber} already exists`);
    }

    res.json({
      status: 'deploying',
      message: 'Starting deployment...',
      steps: [
        { step: 1, name: 'Pulling core files from GitHub', status: 'in-progress' },
        { step: 2, name: 'Comparing manifests', status: 'pending' },
        { step: 3, name: 'Creating version folder', status: 'pending' },
        { step: 4, name: 'Updating version registry', status: 'pending' },
      ],
    });

    // Process deployment asynchronously
    deploymentWorker(versionNumber, description, adminId);

  } catch (error) {
    next(error);
  }
};

// Worker function to handle deployment in background
async function deploymentWorker(versionNumber, description, adminId) {
  try {
    const gitDir = path.join(__dirname, '../..');
    
    // Normalize versionNumber to always include 'v' prefix
    const normalizedVersion = versionNumber.startsWith('v') ? versionNumber : `v${versionNumber}`;
    const versionDir = path.join(CORE_DIR, 'versions', normalizedVersion);

    // Step 1: Pull core files from GitHub
    console.log(`[Deployment] Starting git pull from: ${gitDir}`);
    console.log(`[Deployment] Pulling core files for version ${versionNumber}`);
    try {
      const pullResult = await execAsync(`cd "${gitDir}" && git pull origin master`, {
        maxBuffer: 50 * 1024 * 1024,
      });
      console.log(`[Deployment] Git pull output:`, pullResult.stdout);
    } catch (pullError) {
      console.error(`[Deployment] Git pull error:`, pullError.message);
      console.error(`[Deployment] Git pull stderr:`, pullError.stderr);
      throw new Error(`Failed to pull from GitHub: ${pullError.message}`);
    }

    // Step 2: Create version directory
    console.log(`[Deployment] Creating version directory: ${versionDir}`);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    // Step 3: Copy core files to version folder
    const srcCoreDir = path.join(gitDir, 'core');
    const srcVersionDir = path.join(srcCoreDir, 'versions', normalizedVersion);
    
    console.log(`[Deployment] Source core dir: ${srcCoreDir}`);
    console.log(`[Deployment] Source version dir: ${srcVersionDir}`);
    console.log(`[Deployment] Checking if source version exists...`);
    
    // Copy all files from the source version folder
    if (fs.existsSync(srcVersionDir)) {
      console.log(`[Deployment] Source version folder found! Contents:`, fs.readdirSync(srcVersionDir));
      console.log(`[Deployment] Copying files from ${srcVersionDir} to ${versionDir}`);
      copyDirRecursive(srcVersionDir, versionDir);
      console.log(`[Deployment] Copy complete. Destination contents:`, fs.readdirSync(versionDir));
    } else {
      console.error(`[Deployment] Source version folder not found: ${srcVersionDir}`);
      console.error(`[Deployment] Checking if core/versions exists:`, fs.existsSync(path.join(srcCoreDir, 'versions')));
      if (fs.existsSync(path.join(srcCoreDir, 'versions'))) {
        console.error(`[Deployment] Contents of core/versions:`, fs.readdirSync(path.join(srcCoreDir, 'versions')));
      }
      throw new Error(`Version folder not found in GitHub: ${normalizedVersion}`);
    }

    // Manifest is already updated in the GitHub repo and pulled via git pull
    console.log(`[Deployment] Version ${normalizedVersion} deployed successfully`);
  } catch (error) {
    console.error(`[Deployment] Error deploying version:`, error.message);
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function getFileManifest(dir) {
  const files = {};
  
  function walk(currentPath, relativePath = '') {
    const entries = fs.readdirSync(currentPath);
    
    entries.forEach(entry => {
      const fullPath = path.join(currentPath, entry);
      const relPath = path.join(relativePath, entry);
      
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath, relPath);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        files[relPath] = {
          hash,
          size: fs.statSync(fullPath).size,
        };
      }
    });
  }

  walk(dir);
  return files;
}

function getDirSize(dir) {
  let size = 0;
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath);
    
    entries.forEach(entry => {
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        size += stat.size;
      }
    });
  }

  walk(dir);
  return size;
}

exports.markVersionAsLatest = async (req, res, next) => {
  try {
    const { version } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ValidationError('User not authenticated');
    }

    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if version exists
    const versionExists = manifest.versions.some(v => v.version === version);
    if (!versionExists) {
      throw new NotFoundError(`Version ${version} not found`);
    }

    // Check if it's already the latest
    if (manifest.latest === version) {
      return res.json({
        success: true,
        message: `Version ${version} is already the latest`,
      });
    }

    // Update manifest to mark this version as latest
    const updatedManifest = {
      ...manifest,
      latest: version,
      versions: manifest.versions.map(v => ({
        ...v,
        status: v.version === version ? 'latest' : (v.status === 'latest' ? 'stable' : v.status),
      })),
    };

    fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2));

    res.json({
      success: true,
      message: `Version ${version} marked as latest`,
      latestVersion: version,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVersion = async (req, res, next) => {
  try {
    const { version } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ValidationError('User not authenticated');
    }

    const manifestPath = path.join(CORE_DIR, 'manifests.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if version exists
    const versionExists = manifest.versions.some(v => v.version === version);
    if (!versionExists) {
      throw new NotFoundError(`Version ${version} not found`);
    }

    // Prevent deleting the latest version
    if (manifest.latest === version) {
      throw new ValidationError('Cannot delete the latest version. Mark another version as latest first.');
    }

    // Check if any instances are using this version
    const instancesUsingVersion = await prisma.instance.count({
      where: { coreVersion: version },
    });

    if (instancesUsingVersion > 0) {
      throw new ValidationError(`Cannot delete version ${version}. ${instancesUsingVersion} instance(s) are using it. Migrate instances to another version first.`);
    }

    // Remove version folder
    const versionDir = path.join(CORE_DIR, 'versions', `v${version}`);
    if (fs.existsSync(versionDir)) {
      fs.rmSync(versionDir, { recursive: true, force: true });
    }

    // Update manifest
    const updatedManifest = {
      ...manifest,
      versions: manifest.versions.filter(v => v.version !== version),
    };

    fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2));

    res.json({
      success: true,
      message: `Version ${version} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
