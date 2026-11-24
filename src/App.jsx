import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Admin from './pages/Admin';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/Appointments';
import AnalyticsPage from './pages/Analytics';
import PatientPage from './pages/Patients';
import PatientDetailsPage from './pages/PatientsDetails';
import PatientReportsPage from './pages/PatientsReports';
import OPPatientPage from './pages/OPPatients';
import CheckupPatientPage from './pages/CheckupPatients';
import BillingPage from './pages/Billing';
import DoctorPage from './pages/Doctors';
import AmbulancePage from './pages/Ambulance';
import SurgeryPage from './pages/Surgeries';
import ReportPage from './pages/Reports';
import BedsPage from './pages/Beds';
import MedicalCenterPage from './pages/MedicalCenter';
import LoginPage from './sorce/Login';
import SignupPage from './sorce/Signup';
import CallendarPage from './sorce/Callender';
import SettingsPage from './sorce/Settings';
import NotificationsPage from './sorce/Notification';
import SearchPage from './sorce/Searchconsole';
import Staff from './pages/Staff';
import ProfilePage from './sorce/Profile';
import './styles/index.css';

const pages = {
  dashboard: DashboardPage,
  patients: PatientPage,
  patientDetails: PatientDetailsPage,
  patientReports: PatientReportsPage,
  opPatients: OPPatientPage,
  checkupPatients: CheckupPatientPage,
  appointments: AppointmentsPage,
  analytics: AnalyticsPage,
  billing: BillingPage,
  report: ReportPage,
  doctors: DoctorPage,
  ambulance: AmbulancePage,
  surgeries: SurgeryPage,
  beds: BedsPage,
  medicalCenter: MedicalCenterPage,
  callendar: CallendarPage,
  settings: SettingsPage,
  notifications: NotificationsPage,
  search: SearchPage,
  staff: Staff,
  admin: Admin,
  profile: ProfilePage,
};

function AppContent() {
  const { user, profile } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [authView, setAuthView] = useState('login');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthView('signup')} />;
  }

  const PageComponent = pages[activePage] || DashboardPage;
  const userRole = profile?.role || 'Admin';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div
        className="flex flex-col flex-1 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '68px' : '240px' }}
      >
        <Header activePage={activePage} role={userRole} />
        <main className="flex-1 overflow-y-auto">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
