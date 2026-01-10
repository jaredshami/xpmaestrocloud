import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Instances from './components/Instances';
import InstancePortal from './components/InstancePortal';
import InstanceDashboard from './components/InstanceDashboard';
import './styles/index.css';

// Instance routes - completely separate from admin
function InstanceRoutes() {
  return (
    <Routes>
      <Route path="/instance/:subdomain" element={<InstancePortal />} />
      <Route path="/instance/:subdomain/dashboard" element={<InstanceDashboard />} />
    </Routes>
  );
}

// Admin routes - require authentication
function AdminRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'clients' && <Clients />}
        {currentPage === 'instances' && <Instances />}
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const hostname = window.location.hostname;
  
  // Check if on instance subdomain by hostname pattern (e.g., c777351-i824650-prod.xpmaestrocloud.com)
  // Instance subdomains have the pattern: customerId-instanceId-environment.xpmaestrocloud.com
  const isInstanceSubdomain = hostname.includes('-') && !hostname.startsWith('www') && hostname.includes('xpmaestrocloud.com');
  
  // Also support /instance/ path-based routing for development
  if (isInstanceSubdomain || location.pathname.startsWith('/instance/')) {
    return <InstanceRoutes />;
  }

  // Otherwise show admin dashboard
  return <AdminRoutes />;
}

// Main entry point with Router
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
