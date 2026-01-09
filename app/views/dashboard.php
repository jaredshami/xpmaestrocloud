<?php
/**
 * Admin Dashboard View
 */
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XP Maestro Cloud - Admin Dashboard</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="dashboard-container">
        <header>
            <h1>XP Maestro Cloud Admin Dashboard</h1>
            <nav>
                <ul>
                    <li><a href="/index.php">Dashboard</a></li>
                    <li><a href="/clients.php">Manage Clients</a></li>
                    <li><a href="/instances.php">Manage Instances</a></li>
                    <li><a href="/logout.php">Logout</a></li>
                </ul>
            </nav>
        </header>
        
        <main>
            <section class="quick-actions">
                <h2>Quick Actions</h2>
                <button onclick="openCreateClientModal()" class="btn btn-primary">Create New Client</button>
                <button onclick="openCreateInstanceModal()" class="btn btn-primary">Create New Instance</button>
            </section>
            
            <section class="dashboard-stats">
                <h2>Dashboard Statistics</h2>
                <!-- Statistics will be populated by JavaScript/PHP -->
            </section>
        </main>
    </div>
    
    <script src="/js/dashboard.js"></script>
</body>
</html>
