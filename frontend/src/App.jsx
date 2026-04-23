import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { logout as apiLogout } from './services/api';
import { setLogoutCallback } from './services/apiClient';

import LoginForm from './components/LoginForm';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Lazy load heavy components for better performance
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TransactionForm = React.lazy(() => import('./components/TransactionForm'));
const PriceList = React.lazy(() => import('./components/PriceList'));
const ApprovalInbox = React.lazy(() => import('./components/ApprovalInbox'));
const Settings = React.lazy(() => import('./components/Settings'));
const ReportView = React.lazy(() => import('./components/ReportView'));
const UserManagement = React.lazy(() => import('./components/UserManagement'));

// ─── Route Guards ────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner message="Memuat..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function OwnerRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner message="Memuat..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'owner') {
    return (
      <div className="not-auth card flex flex-col items-center justify-center py-16 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Akses Ditolak</h4>
        <p className="text-gray-500 dark:text-gray-400">Halaman ini hanya dapat diakses oleh Owner.</p>
      </div>
    );
  }
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner message="Memuat..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Main App Content (needs router context) ─────────────────────────────

function AppContent() {
  const { user, login, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  // Register auto-logout callback for 401 responses
  useEffect(() => {
    setLogoutCallback(() => {
      authLogout();
      navigate('/login', { replace: true });
    });
  }, [authLogout, navigate]);

  const handleLogin = (userObj) => {
    login(userObj);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Server logout failed, still clear local state
    }
    authLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      {user && <Navbar onLogout={handleLogout} />}
      <main className="main">
        <Routes>
          {/* Guest Route */}
          <Route path="/login" element={
            <GuestRoute>
              <LoginForm onLogin={handleLogin} />
            </GuestRoute>
          } />

          {/* Protected Routes — All Users */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/transactions" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner message="Loading transaction form..." />}>
                <TransactionForm />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/pricelist" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner message="Loading price list..." />}>
                <PriceList />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Owner-Only Routes */}
          <Route path="/reports" element={
            <OwnerRoute>
              <Suspense fallback={<LoadingSpinner message="Loading reports..." />}>
                <ReportView />
              </Suspense>
            </OwnerRoute>
          } />

          <Route path="/users" element={
            <OwnerRoute>
              <Suspense fallback={<LoadingSpinner message="Loading user management..." />}>
                <UserManagement />
              </Suspense>
            </OwnerRoute>
          } />

          <Route path="/approvals" element={
            <OwnerRoute>
              <Suspense fallback={<LoadingSpinner message="Loading approvals..." />}>
                <ApprovalInbox />
              </Suspense>
            </OwnerRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
