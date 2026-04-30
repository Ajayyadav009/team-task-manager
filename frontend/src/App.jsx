import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-100">
      {user && <Navbar />}
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/projects"
          element={<PrivateRoute><Projects /></PrivateRoute>}
        />
        <Route
          path="/projects/:id/tasks"
          element={<PrivateRoute><Tasks /></PrivateRoute>}
        />
        <Route
          path="/dashboard/:projectId"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
