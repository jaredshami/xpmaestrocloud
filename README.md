# XP Maestro Cloud

Enterprise Website Management Platform

## Overview

XP Maestro Cloud is a PHP application that enables administrators to quickly spin up and manage enterprise client websites on separate subdomains.

### Key Features

- **Admin Control Panel**: Only administrators can access the main domain (xpmaestrocloud.com)
- **Client Management**: Create and manage enterprise clients
- **Instance Management**: Spin up new website instances with auto-generated subdomains
- **Automatic Nginx Configuration**: Auto-generates and deploys Nginx configs to VPS
- **Subdomain Format**: `c{customerID}-i{instanceID}-{environment}.xpmaestrocloud.com`

## Project Structure

```
xpmaestrocloud/
├── public/              # Web root
│   ├── index.php       # Main dashboard
│   ├── login.php       # Admin login
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── uploads/        # File uploads
├── app/
│   ├── controllers/    # Business logic
│   ├── models/         # Data models
│   ├── views/          # HTML templates
│   └── helpers/        # Utility functions
├── config/             # Configuration files
├── nginx_templates/    # Nginx config templates
├── scripts/            # CLI scripts
└── README.md
```

## Configuration

1. Update `config/config.php` with your:
   - Database credentials
   - VPS host and user
   - Domain settings

2. Create database and required tables (will be created with migrations)

## Installation

1. Copy files to `/var/www/xpmaestrocloud` on your VPS
2. Configure PHP-FPM and Nginx
3. Update database credentials in `config/config.php`
4. Set proper file permissions

## Next Steps

- [ ] Database schema and migrations
- [ ] Admin authentication system
- [ ] Client management API
- [ ] Instance creation API
- [ ] SSH integration for VPS commands
- [ ] SSL/TLS certificate automation
- [ ] Client instance template files
- [ ] Frontend website builder

## Technologies

- PHP 7.4+
- MySQL/MariaDB
- Nginx
- Linux (Alma Linux 2)

## Security Notes

- Always use HTTPS in production
- Validate and sanitize all user inputs
- Use parameterized SQL queries
- Implement rate limiting
- Keep dependencies updated
