import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AITools from './pages/AITools';
import LogAnalyzer from './pages/LogAnalyzer';
import Monitoring from './pages/Monitoring';
import OAuthCallback from './pages/OAuthCallback';
import ErrorBoundary from './components/ErrorBoundary';

const AppRoute = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const DeploymentsRedirect = () => <Navigate to="/projects" replace />;

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/dashboard" element={<AppRoute><Dashboard /></AppRoute>} />
          <Route path="/projects" element={<AppRoute><Projects /></AppRoute>} />
          <Route path="/projects/:id" element={<AppRoute><ProjectDetail /></AppRoute>} />
          <Route path="/deployments" element={<AppRoute><DeploymentsRedirect /></AppRoute>} />
          <Route path="/ai" element={<AppRoute><AITools /></AppRoute>} />
          <Route path="/ai/logs" element={<AppRoute><LogAnalyzer /></AppRoute>} />
          <Route path="/monitoring" element={<AppRoute><Monitoring /></AppRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
