import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './core/context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROLES, ROUTES } from './core/config';
import createLogger from './utils/logger';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Only import components that are actually used
const Home = React.lazy(() => import('./components/pages/Home'));
const Register = React.lazy(() => import('./components/auth/Register'));
const Dashboard = React.lazy(() => import('./components/features/user/Dashboard'));
const PendingVerification = React.lazy(() => import('./components/auth/PendingVerification'));
const NotFound = React.lazy(() => import('./components/pages/NotFound'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const UserVerification = React.lazy(() => import('./components/inspector/UserVerification'));
const LandVerification = React.lazy(() => import('./components/inspector/LandVerification'));
const DisputeResolution = React.lazy(() => import('./components/inspector/DisputeResolution'));
const MyLands = React.lazy(() => import('./components/features/lands/MyLands'));
const LandMarket = React.lazy(() => import('./components/features/lands/LandMarket'));
const LandRequests = React.lazy(() => import('./components/features/transactions/LandRequests'));
const InspectorDashboard = React.lazy(() => import('./components/inspector/InspectorDashboard'));
const AddLandModal = React.lazy(() => import('./components/features/lands/AddLandModal'));
const WithdrawFunds = React.lazy(() => import('./components/features/transactions/WithdrawFunds'));

const App = () => {
  const logger = createLogger('App');

  useEffect(() => {
    logger.info('App initialization');
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.REGISTER} element={<Register />} />
                <Route path={ROUTES.PENDING} element={<PendingVerification />} />

                {/* User Routes */}
                <Route path={ROUTES.DASHBOARD} element={
                  <ProtectedRoute requiredRole={ROLES.VERIFIED_USER_ROLE}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.MY_LANDS} element={
                  <ProtectedRoute requiredRole={ROLES.VERIFIED_USER_ROLE}>
                    <MyLands />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.LAND_MARKET} element={
                  <ProtectedRoute requiredRole={ROLES.VERIFIED_USER_ROLE}>
                    <LandMarket />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.LAND_REQUESTS} element={
                  <ProtectedRoute requiredRole={ROLES.VERIFIED_USER_ROLE}>
                    <LandRequests />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.WITHDRAWALS} element={
                  <ProtectedRoute requiredRole={ROLES.VERIFIED_USER_ROLE}>
                    <WithdrawFunds />
                  </ProtectedRoute>
                } />

                {/* Inspector Routes */}
                <Route path={ROUTES.INSPECTOR} element={
                  <ProtectedRoute requiredRole={ROLES.INSPECTOR_ROLE}>
                    <InspectorDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.INSPECTOR_VERIFY_USERS} element={
                  <ProtectedRoute requiredRole={ROLES.INSPECTOR_ROLE}>
                    <UserVerification />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.INSPECTOR_VERIFY_LANDS} element={
                  <ProtectedRoute requiredRole={ROLES.INSPECTOR_ROLE}>
                    <LandVerification />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.INSPECTOR_RESOLVE_DISPUTES} element={
                  <ProtectedRoute requiredRole={ROLES.INSPECTOR_ROLE}>
                    <DisputeResolution />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path={ROUTES.ADMIN} element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN_ROLE}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.ADMIN_USERS} element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN_ROLE}>
                    <AdminDashboard section="users" />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.ADMIN_REPORTS} element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN_ROLE}>
                    <AdminDashboard section="reports" />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick={true}
              pauseOnFocusLoss={true}
              draggable={true}
              pauseOnHover={true}
              theme="light"
            />
          </Layout>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;

