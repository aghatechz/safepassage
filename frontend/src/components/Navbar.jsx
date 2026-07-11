import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Map, AlertTriangle, User, LogOut, Settings, Search } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-teal-700'
        : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Safe<span className="text-teal-600">Passage</span>
              </span>
              <span className="hidden text-[10px] text-slate-400 font-medium tracking-wide uppercase sm:block">
                Scam Guard
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={`flex items-center gap-1.5 ${navLinkClass('/dashboard')}`}>
              <Search className="h-4 w-4" />
              Dashboard
            </Link>
            <Link to="/map" className={`flex items-center gap-1.5 ${navLinkClass('/map')}`}>
              <Map className="h-4 w-4" />
              Scam Heatmap
            </Link>
            <Link to="/report" className={`flex items-center gap-1.5 ${navLinkClass('/report')}`}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Report a Scam
            </Link>
            {user && user.role === 'admin' && (
              <Link to="/admin" className={`flex items-center gap-1.5 ${navLinkClass('/admin')}`}>
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* User Section / Auth buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden flex-col items-end sm:flex">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
                  <User className="h-4 w-4" />
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex md:hidden h-10 items-center justify-center gap-4 border-t border-slate-100 pb-2">
          <Link to="/dashboard" className={`text-xs font-semibold ${isActive('/dashboard') ? 'text-teal-600' : 'text-slate-400'}`}>
            Dashboard
          </Link>
          <Link to="/map" className={`text-xs font-semibold ${isActive('/map') ? 'text-teal-600' : 'text-slate-400'}`}>
            Heatmap
          </Link>
          <Link to="/report" className={`text-xs font-semibold ${isActive('/report') ? 'text-teal-600' : 'text-slate-400'}`}>
            Report
          </Link>
          {user && user.role === 'admin' && (
            <Link to="/admin" className={`text-xs font-semibold ${isActive('/admin') ? 'text-teal-600' : 'text-slate-400'}`}>
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
