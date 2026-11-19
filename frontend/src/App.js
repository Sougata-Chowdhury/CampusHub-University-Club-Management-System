import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import RouteFallback from './components/RouteFallback';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

// Auth
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));

// Core experience
const Dashboard = lazy(() => import('./components/Dashboard'));
const BrowseClubs = lazy(() => import('./components/BrowseClubs'));
const BrowseEvents = lazy(() => import('./components/BrowseEvents'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Clubs
const CreateClub = lazy(() => import('./components/CreateClub'));
const MyClubs = lazy(() => import('./components/MyClubs'));
const ManageClub = lazy(() => import('./components/ManageClub'));
const ClubDetails = lazy(() => import('./components/ClubDetails'));
const ClubEvents = lazy(() => import('./components/ClubEvents'));

// Events
const MyEvents = lazy(() => import('./components/MyEvents'));
const CreateEvent = lazy(() => import('./components/CreateEvent'));
const EventDetails = lazy(() => import('./components/EventDetails'));
const EditEvent = lazy(() => import('./components/EditEvent'));

// Content
const Announcements = lazy(() => import('./components/Announcements'));
const CreateAnnouncement = lazy(() => import('./components/CreateAnnouncement'));

// Payments
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const PaymentHistory = lazy(() => import('./components/PaymentHistory'));
const ManagePayments = lazy(() => import('./components/ManagePayments'));

// Account
const UserProfile = lazy(() => import('./components/UserProfile'));
const UserSettings = lazy(() => import('./components/UserSettings'));
const NotificationPage = lazy(() => import('./components/NotificationPage'));
const FileManagement = lazy(() => import('./pages/FileManagement'));
const MyReports = lazy(() => import('./pages/MyReports'));

// Feedback
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const MyFeedback = lazy(() => import('./pages/MyFeedback'));

// Admin
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminUserManagement = lazy(() => import('./components/AdminUserManagement'));
const AdminClubManagement = lazy(() => import('./components/AdminClubManagement'));
const AdminPaymentManagement = lazy(() => import('./components/AdminPaymentManagement'));
const AdminAnnouncements = lazy(() => import('./components/AdminAnnouncements'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminFeedback = lazy(() => import('./components/feedback/AdminFeedback'));

const withShell = (element) => (
  <ProtectedRoute>
    <AppShell>{element}</AppShell>
  </ProtectedRoute>
);

const AdminRoute = ({ children }) => (
  <ProtectedRoute adminRequired>{children}</ProtectedRoute>
);

const withAdminShell = (element) => (
  <AdminRoute>
    <AppShell>{element}</AppShell>
  </AdminRoute>
);

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <RouteFallback />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

const AppRoutes = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLogin />} />

        {/* Core experience (new app shell) */}
        <Route path="/dashboard" element={withShell(<Dashboard />)} />
        <Route path="/browse-clubs" element={withShell(<BrowseClubs />)} />
        <Route path="/browse-events" element={withShell(<BrowseEvents />)} />

        {/* Clubs */}
        <Route path="/create-club" element={withShell(<CreateClub />)} />
        <Route path="/my-clubs" element={withShell(<MyClubs />)} />
        <Route path="/manage-club/:clubId" element={withShell(<ManageClub />)} />
        <Route path="/clubs/:id" element={withShell(<ClubDetails />)} />
        <Route path="/club-events/:clubId" element={withShell(<ClubEvents />)} />

        {/* Events */}
        <Route path="/my-events" element={withShell(<MyEvents />)} />
        <Route path="/create-event" element={withShell(<CreateEvent />)} />
        <Route path="/events/:id" element={withShell(<EventDetails />)} />
        <Route path="/events/:id/edit" element={withShell(<EditEvent />)} />

        {/* Announcements */}
        <Route path="/announcements" element={withShell(<Announcements />)} />
        <Route path="/create-announcement" element={withShell(<CreateAnnouncement />)} />

        {/* Payments */}
        <Route path="/payment/:eventId" element={withShell(<PaymentPage />)} />
        <Route path="/payment-history" element={withShell(<PaymentHistory />)} />
        <Route path="/clubs/:clubId/payment-history" element={withShell(<PaymentHistory />)} />
        <Route path="/clubs/:clubId/manage-payments" element={withShell(<ManagePayments />)} />

        {/* Account */}
        <Route path="/profile" element={withShell(<UserProfile />)} />
        <Route path="/settings" element={withShell(<UserSettings />)} />
        <Route path="/notifications" element={withShell(<NotificationPage />)} />
        <Route path="/my-reports" element={withShell(<MyReports />)} />
        <Route path="/files" element={withShell(<FileManagement />)} />

        {/* Feedback */}
        <Route path="/feedback" element={withShell(<FeedbackPage />)} />
        <Route path="/my-feedback" element={withShell(<MyFeedback />)} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={withAdminShell(<AdminDashboard />)} />
        <Route path="/admin/users" element={withAdminShell(<AdminUserManagement />)} />
        <Route path="/admin/clubs" element={withAdminShell(<AdminClubManagement />)} />
        <Route path="/admin/announcements" element={withAdminShell(<AdminAnnouncements />)} />
        <Route path="/admin/payments" element={withAdminShell(<AdminPaymentManagement />)} />
        <Route path="/admin/reports" element={withAdminShell(<AdminReports />)} />
        <Route path="/admin/feedback" element={withAdminShell(<AdminFeedback />)} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <Router>
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
