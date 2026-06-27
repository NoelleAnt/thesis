import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import CentersPage from './pages/CentersPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import RequestsPage from './pages/RequestsPage.jsx';
import LogsPage from './pages/LogsPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading Asap-Agap…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'ldrrmo' ? '/dashboard' : '/overview'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="centers" element={<CentersPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
