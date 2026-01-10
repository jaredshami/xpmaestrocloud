import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Instances from './components/Instances';
import InstancePortal from './components/InstancePortal';
import InstanceDashboard from './components/InstanceDashboard';
import './styles/index.css';

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Check if we're in an instance portal
  const isInstancePortal = location.pathname.includes('/instance/');

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  // Show instance portal without admin auth
  if (isInstancePortal) {
    return (
      <Routes>
        <Route path="/instance/:subdomain" element={<InstancePortal />} />
        <Route path="/instance/:subdomain/dashboard" element={<InstanceDashboard />} />
      </Routes>
    );
  }

  // Show admin login if not logged in
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
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
