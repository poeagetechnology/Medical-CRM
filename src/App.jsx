import React, { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { AccountBlocked, AccessDenied } from './components/AccessScreens';
import { Spinner, ToastProvider } from './components/ui';
import { useHashRoute } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { PAGES } from './config/navigation';
import { canViewPage, isActiveProfile } from './utils/roles';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import SearchPage from './pages/Search';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import PatientReports from './pages/PatientReports';
import OPQueue from './pages/OPQueue';
import Checkups from './pages/Checkups';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import SmartReports from './pages/SmartReports';
import Surgeries from './pages/Surgeries';
import Beds from './pages/Beds';
import Ambulance from './pages/Ambulance';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Staff from './pages/Staff';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import './styles/index.css';

// Keys match PAGE_ACCESS in utils/roles.js.
const SCREENS = {
  dashboard: Dashboard,
  callendar: Calendar,
  notifications: Notifications,
  search: SearchPage,
  patients: Patients,
  patientDetails: PatientProfile,
  patientReports: PatientReports,
  opPatients: OPQueue,
  checkupPatients: Checkups,
  appointments: Appointments,
  doctors: Doctors,
  report: SmartReports,
  surgeries: Surgeries,
  beds: Beds,
  ambulance: Ambulance,
  medicalCenter: Pharmacy,
  billing: Billing,
  analytics: Analytics,
  staff: Staff,
  admin: Admin,
  settings: Settings,
  profile: Profile,
};

function AppContent() {
  const { user, profile, profileError, signingUp } = useAuth();
  const { page, params, go } = useHashRoute();
  const [authView, setAuthView] = useState('login');

  // Still checking the session.
  if (user === undefined) return <Spinner full />;

  // Signed out - or mid sign-up (keep the form mounted so errors stay visible).
  if (!user || signingUp) {
    return authView === 'signup'
      ? <Signup onSwitchToLogin={() => setAuthView('login')} />
      : <Login onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // Signed in, role/status still loading.
  if (profile === undefined) return <Spinner full label="Loading your account…" />;

  // Signed in but not allowed in: pending approval, suspended, or no profile.
  if (profileError || !isActiveProfile(profile)) {
    return <AccountBlocked profile={profile} profileError={profileError} />;
  }

  const active = SCREENS[page] ? page : 'dashboard';
  const Screen = SCREENS[active];
  document.title = `${PAGES[active].label} · MedCRM`;

  return (
    <AppShell activePage={active} onNavigate={go}>
      {canViewPage(profile, active) ? (
        <ErrorBoundary key={active}>
          <Screen navigate={go} params={params} />
        </ErrorBoundary>
      ) : (
        <AccessDenied role={profile.role} onBack={() => go('dashboard')} />
      )}
    </AppShell>
  );
}

export default function App() {
  // Applies the saved theme (and follows the system theme when selected).
  useTheme();
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
