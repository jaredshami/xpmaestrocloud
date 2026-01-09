const { NodeSSH } = require('node-ssh');
const { logger } = require('./logger');

class VPSManager {
  constructor() {
    this.ssh = new NodeSSH();
    this.connected = false;
  }

  /**
   * Connect to VPS via SSH
   */
  async connect() {
    try {
      await this.ssh.connect({
        host: process.env.VPS_HOST,
        username: process.env.VPS_USER,
        port: process.env.VPS_PORT || 22,
        privateKey: process.env.VPS_PRIVATE_KEY_PATH,
      });
      this.connected = true;
      logger.info('Connected to VPS');
    } catch (error) {
      logger.error('Failed to connect to VPS', error);
      throw error;
    }
  }

  /**
   * Execute command on VPS
   */
  async executeCommand(command) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.ssh.execCommand(command);
      if (result.code !== 0) {
        logger.error(`Command failed: ${command}\n${result.stderr}`);
        throw new Error(`SSH Command failed: ${result.stderr}`);
      }
      return result.stdout;
    } catch (error) {
      logger.error(`Error executing command: ${command}`, error);
      throw error;
    }
  }

  /**
   * Create folder on VPS
   */
  async createFolder(folderPath) {
    const command = `mkdir -p ${folderPath}`;
    return await this.executeCommand(command);
  }

  /**
   * Create or update Nginx configuration file
   */
  async updateNginxConfig(subdomain, configContent) {
    const configPath = `${process.env.NGINX_CONF_DIR}/${subdomain}.conf`;
    const command = `cat > ${configPath} << 'EOF'\n${configContent}\nEOF`;
    await this.executeCommand(command);
    logger.info(`Nginx config created for ${subdomain}`);
  }

  /**
   * Test Nginx configuration
   */
  async testNginxConfig() {
    const result = await this.executeCommand('nginx -t');
    return result;
  }

  /**
   * Reload Nginx
   */
  async reloadNginx() {
    await this.executeCommand('systemctl reload nginx');
    logger.info('Nginx reloaded');
  }

  /**
   * Delete Nginx configuration file
   */
  async deleteNginxConfig(subdomain) {
    const configPath = `${process.env.NGINX_CONF_DIR}/${subdomain}.conf`;
    await this.executeCommand(`rm -f ${configPath}`);
    logger.info(`Nginx config deleted for ${subdomain}`);
  }

  /**
   * Disconnect from VPS
   */
  async disconnect() {
    if (this.connected) {
      this.ssh.dispose();
      this.connected = false;
      logger.info('Disconnected from VPS');
    }
  }
}

module.exports = new VPSManager();
