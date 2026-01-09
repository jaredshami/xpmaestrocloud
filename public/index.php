<?php
/**
 * XP Maestro Cloud - Main Entry Point
 */

require_once '../config/config.php';
require_once '../config/database.php';

// Check if user is authenticated
$isAuthenticated = isset($_SESSION['admin_user_id']);

if (!$isAuthenticated) {
    // Redirect to login
    header('Location: /login.php');
    exit;
}

// Include admin dashboard
include '../app/views/dashboard.php';
?>
