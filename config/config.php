<?php
/**
 * XP Maestro Cloud - Configuration File
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'xpmaestrocloud');

// Domain Configuration
define('MAIN_DOMAIN', 'xpmaestrocloud.com');
define('SUBDOMAIN_FORMAT', 'c{customer_id}-i{instance_id}-{environment}.xpmaestrocloud.com');

// Server Configuration
define('VPS_USER', 'root');
define('VPS_HOST', 'your-vps-ip');
define('WWW_ROOT', '/var/www/xpmaestrocloud');
define('NGINX_CONF_DIR', '/etc/nginx/sites-available');

// Environment
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_DEBUG', APP_ENV === 'development');

// Session Configuration
session_start();
?>
