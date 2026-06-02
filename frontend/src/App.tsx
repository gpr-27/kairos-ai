import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/app-layout';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { GuestSessionManager } from '@/components/auth/guest-session-manager';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { PublicOnlyRoute } from '@/components/auth/public-only-route';

const LandingPage = lazy(() => import('@/routes/landing'));
const SignInPage = lazy(() => import('@/routes/auth/sign-in'));
const SignUpPage = lazy(() => import('@/routes/auth/sign-up'));
const OnboardingPage = lazy(() => import('@/routes/onboarding'));
const DashboardPage = lazy(() => import('@/routes/dashboard'));
const ProblemsPage = lazy(() => import('@/routes/problems'));
const ProblemDetailPage = lazy(() => import('@/routes/problem-detail'));
const ProfilePage = lazy(() => import('@/routes/profile'));
const SettingsPage = lazy(() => import('@/routes/settings'));
const PlaygroundPage = lazy(() => import('@/routes/playground'));
const ChatPage = lazy(() => import('@/routes/chat'));
const NotFoundPage = lazy(() => import('@/routes/not-found'));

export default function App(): JSX.Element {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GuestSessionManager />
      <Routes>
        {/* Public landing */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute redirectTo="/dashboard">
              <LandingPage />
            </PublicOnlyRoute>
          }
        />

        {/* Auth pages */}
        <Route
          path="/sign-in/*"
          element={
            <PublicOnlyRoute redirectTo="/dashboard">
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <PublicOnlyRoute redirectTo="/dashboard">
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />

        {/* Onboarding (protected, no app shell) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected app shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problem/:slug" element={<ProblemDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
