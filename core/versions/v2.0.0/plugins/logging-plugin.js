// Logging plugin v2.0
class LoggingPlugin {
  info(msg) { console.log('[INFO]', msg); }
  warn(msg) { console.warn('[WARN]', msg); }
  error(msg) { console.error('[ERROR]', msg); }
}
module.exports = LoggingPlugin;
