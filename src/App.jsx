import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import ArenaList from './pages/arenas/ArenaList';
import ArenaDetail from './pages/arenas/ArenaDetail';
import ArenaForm from './pages/arenas/ArenaForm';
import Bookings from './pages/bookings/Bookings';
import TrainerRequests from './pages/bookings/TrainerRequests';
import Schedules from './pages/schedules/Schedules';
import Members from './pages/members/Members';
import Analytics from './pages/analytics/Analytics';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner text="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/arenas" element={<ArenaList />} />
        <Route path="/arenas/:id" element={<ArenaDetail />} />
        <Route
          path="/arenas/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Arena Manager']}>
              <ArenaForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arenas/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Arena Manager']}>
              <ArenaForm />
            </ProtectedRoute>
          }
        />
        <Route path="/bookings" element={<Bookings />} />
        <Route
          path="/trainer-requests"
          element={
            <ProtectedRoute allowedRoles={['Trainer']}>
              <TrainerRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Arena Manager', 'Trainer']}>
              <Schedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Members />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Arena Manager']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111827',
              color: '#fff',
              border: '1px solid #1a2340',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
