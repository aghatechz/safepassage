import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AgencyDetail from './pages/AgencyDetail';
import ReportScam from './pages/ReportScam';
import MapView from './pages/MapView';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { apiFetch } from './utils/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [servedBy, setServedBy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const data = await apiFetch('/hostname', {}, setServedBy);
        if (data && data.hostname) {
          setServedBy(data.hostname);
        }
      } catch (err) {
        console.error('Failed to contact API server:', err.message);
        setServedBy('offline');
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await apiFetch('/auth/me', {}, setServedBy);
          if (profile && profile.user) {
            setUser(profile.user);
            localStorage.setItem('user', JSON.stringify(profile.user));
          }
        } catch (err) {
          console.warn('Expired session. Logging out.', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const AdminRoute = ({ children }) => {
    if (loading) return <LoadingScreen />;
    return user && user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) return <LoadingScreen />;
    return user ? children : <Navigate to="/login" replace />;
  };

  const LoadingScreen = () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 shadow-lg shadow-teal-200">
          <Shield className="h-5.5 w-5.5 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          Safe<span className="text-teal-600">Passage</span>
        </span>
      </div>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600"></div>
      <p className="mt-4 text-sm font-medium text-slate-400">Loading secure console...</p>
    </div>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard setServedBy={setServedBy} />} />
            <Route path="/agency/:id" element={<AgencyDetail user={user} setServedBy={setServedBy} />} />
            <Route path="/map" element={<MapView setServedBy={setServedBy} />} />
            <Route 
              path="/report" 
              element={
                <ProtectedRoute>
                  <ReportScam setServedBy={setServedBy} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel setServedBy={setServedBy} />
                </AdminRoute>
              } 
            />
            <Route path="/login" element={<Login user={user} onLogin={handleLogin} setServedBy={setServedBy} />} />
            <Route path="/signup" element={<Signup user={user} onLogin={handleLogin} setServedBy={setServedBy} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer hostname={servedBy} />
      </div>
    </Router>
  );
}
