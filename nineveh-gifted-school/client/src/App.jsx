import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LoadingScreen from './components/ui/LoadingScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assignments = lazy(() => import('./pages/Assignments'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const Messages = lazy(() => import('./pages/Messages'));
const Conversation = lazy(() => import('./pages/Conversation'));
const Exams = lazy(() => import('./pages/Exams'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminClasses = lazy(() => import('./pages/admin/AdminClasses'));
const Notifications = lazy(() => import('./pages/Notifications'));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  return children;
}

function LazyPage({ children }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
        <Route path="/assignments" element={<LazyPage><Assignments /></LazyPage>} />
        <Route path="/assignments/:id" element={<LazyPage><AssignmentDetail /></LazyPage>} />
        <Route path="/messages" element={<LazyPage><Messages /></LazyPage>} />
        <Route path="/messages/:userId" element={<LazyPage><Conversation /></LazyPage>} />
        <Route path="/exams" element={<LazyPage><Exams /></LazyPage>} />
        <Route path="/schedule" element={<LazyPage><Schedule /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
        <Route path="/admin" element={<LazyPage><Dashboard /></LazyPage>} />
        <Route path="/admin/users" element={<LazyPage><AdminUsers /></LazyPage>} />
        <Route path="/admin/classes" element={<LazyPage><AdminClasses /></LazyPage>} />
        <Route path="/notifications" element={<LazyPage><Notifications /></LazyPage>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
