<?php
/**
 * Admin Login Page
 */

require_once '../config/config.php';
require_once '../config/database.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // TODO: Implement secure admin authentication
    // This is a placeholder - will be fully implemented
    
    if ($username && $password) {
        $_SESSION['admin_user_id'] = 1; // Placeholder
        header('Location: /index.php');
        exit;
    } else {
        $error = 'Invalid credentials';
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XP Maestro Cloud - Admin Login</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="login-container">
        <h1>XP Maestro Cloud</h1>
        <h2>Admin Login</h2>
        
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
    </div>
</body>
</html>
