const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error ? `\n${error.stack}` : '';
    const logMessage = `[${timestamp}] ERROR: ${message}${errorMessage}\n`;
    console.error(logMessage);
    fs.appendFileSync(path.join(logsDir, 'error.log'), logMessage);
  },

  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    console.warn(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  },
};

module.exports = { logger };
