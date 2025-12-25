import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import IntelligentDashboard from './pages/IntelligentDashboard';
import OnboardingPage from './pages/OnboardingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
// Layout
import Layout from './components/Layout';

// Pages with Layout
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileProvider } from './context/ProfileContext';
import DailyLogPage from './pages/DailyLogPage';
import Dashboard from './pages/Dashboard';
import EditProfilePage from './pages/EditProfilePage';
import InventoryDetailPage from './pages/InventoryDetailPage';
import InventoryPage from './pages/InventoryPage';
import NeighbourhoodPage from './pages/NeighbourhoodPage';
import ProfilePage from './pages/ProfilePage';
import { ResourcesPage } from './pages/ResourcesPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              <SignedIn>
                <OnboardingPage />
              </SignedIn>
            }
          />
          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <SignedIn>
                <Layout />
              </SignedIn>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="daily-log" element={<DailyLogPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route
              path="inventory/:inventoryId"
              element={<InventoryDetailPage />}
            />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="neighbourhood" element={<NeighbourhoodPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="intelligence" element={<IntelligentDashboard />} />
          </Route>{' '}
          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <SignedIn>
                <AdminDashboard />
              </SignedIn>
            }
          />
          {/* Redirect to sign in when signed out */}
          <Route
            path="*"
            element={
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            }
          />
        </Routes>
      </ProfileProvider>
    </QueryClientProvider>
  );
}
