import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders, useAuth } from './store';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Workspace from './pages/Workspace';
import Performance from './pages/Performance';
import Margin from './pages/Margin';
import Flux from './pages/Flux';
import Close from './pages/Close';
import Recons from './pages/Recons';
import Settings from './pages/Settings';
import Notebook from './pages/Notebook';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/variance/performance" replace /> : <Login />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Navigate to="/variance/performance" replace />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/variance" element={<Navigate to="/variance/performance" replace />} />
        <Route path="/variance/performance" element={<Performance />} />
        <Route path="/variance/margin" element={<Margin />} />
        <Route path="/variance/flux" element={<Flux />} />
        <Route path="/close" element={<Close />} />
        <Route path="/reconciliations" element={<Recons />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="*" element={<Navigate to="/variance/performance" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
