// ============================================================
// OneFlesh — App Router
// ============================================================

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.js';
import { useSocket } from './hooks/useSocket.js';
import { ErrorBoundary } from './components/error/ErrorBoundary.js';
import type { UserPublic } from '@oneflesh/shared';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/Home/HomePage.js'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage.js'));
const RegisterChurchPage = lazy(() => import('./pages/Church/RegisterChurchPage.js'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage.js'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage.js'));
const MFAPage = lazy(() => import('./pages/Auth/MFAPage.js'));
const ProfilesPage = lazy(() => import('./pages/Profiles/ProfilesPage.js'));
const AddProfilePage = lazy(() => import('./pages/Profiles/AddProfilePage.js'));
const ProfileDetailPage = lazy(() => import('./pages/Profiles/ProfileDetailPage.js'));
const AlliancesPage = lazy(() => import('./pages/Alliances/AlliancesPage.js'));
const AllianceDetailPage = lazy(() => import('./pages/Alliances/AllianceDetailPage.js'));
const CounsellingPage = lazy(() => import('./pages/Counselling/CounsellingPage.js'));
const VendorsPage = lazy(() => import('./pages/Vendors/VendorsPage.js'));
const AddVendorPage = lazy(() => import('./pages/Vendors/AddVendorPage.js'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage.js'));
const AdminDashboardPage = lazy(() => import('./pages/Dashboard/AdminDashboardPage.js'));

// ─── Protected route wrapper ──────────────────────────────────
function ProtectedRoute({ children, refreshing }: { children: React.ReactNode; refreshing: boolean }) {
  const { isAuthenticated } = useAuthStore();
  if (refreshing) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── Loading fallback ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf9f7' }}>
      <div className="text-center">
        <div className="font-display text-[28px] mb-4" style={{ color: '#2C0F12' }}>
          One<em className="font-light italic">Flesh</em>
        </div>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gold rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000';

export default function App() {
  useSocket();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [refreshing, setRefreshing] = useState(!isAuthenticated && !!user);

  // Silent token refresh on page reload — user in store but token lost
  useEffect(() => {
    if (isAuthenticated || !user) {
      setRefreshing(false);
      return;
    }
    let cancelled = false;
    fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((body: { data?: { accessToken?: string; user?: UserPublic } }) => {
        if (!cancelled && body?.data?.accessToken && body?.data?.user) {
          setAuth(body.data.user, body.data.accessToken);
        }
      })
      .catch(() => { /* refresh failed — user will be sent to login */ })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const P = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute refreshing={refreshing}>{children}</ProtectedRoute>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
          <Route path="/mfa" element={<ErrorBoundary><MFAPage /></ErrorBoundary>} />
          <Route path="/forgot-password" element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>} />
          <Route path="/reset-password" element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>} />
          <Route path="/register-church" element={<ErrorBoundary><RegisterChurchPage /></ErrorBoundary>} />
          <Route path="/vendors" element={<ErrorBoundary><VendorsPage /></ErrorBoundary>} />

          {/* Protected */}
          <Route path="/profiles"      element={<P><ErrorBoundary><ProfilesPage /></ErrorBoundary></P>} />
          <Route path="/profiles/add"  element={<P><ErrorBoundary><AddProfilePage /></ErrorBoundary></P>} />
          <Route path="/profiles/:id"  element={<P><ErrorBoundary><ProfileDetailPage /></ErrorBoundary></P>} />
          <Route path="/alliances"     element={<P><ErrorBoundary><AlliancesPage /></ErrorBoundary></P>} />
          <Route path="/alliances/:id" element={<P><ErrorBoundary><AllianceDetailPage /></ErrorBoundary></P>} />
          <Route path="/counselling"   element={<P><ErrorBoundary><CounsellingPage /></ErrorBoundary></P>} />
          <Route path="/vendors/add"   element={<P><ErrorBoundary><AddVendorPage /></ErrorBoundary></P>} />
          <Route path="/dashboard"     element={<P><ErrorBoundary><DashboardPage /></ErrorBoundary></P>} />
          <Route path="/admin"         element={<P><ErrorBoundary><AdminDashboardPage /></ErrorBoundary></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
