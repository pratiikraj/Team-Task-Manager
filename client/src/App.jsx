import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import Navbar from './components/Navbar.jsx';

function ProtectedShell({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function FullScreenLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="mono" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 12 }}>
        Loading…
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/dashboard" element={<ProtectedShell><DashboardPage /></ProtectedShell>} />
      <Route path="/projects" element={<ProtectedShell><ProjectsPage /></ProtectedShell>} />
      <Route path="/projects/:id" element={<ProtectedShell><ProjectDetailPage /></ProtectedShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
