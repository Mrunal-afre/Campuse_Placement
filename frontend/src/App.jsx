import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import StudentProfile   from './pages/StudentProfile';
import RecruiterProfile from './pages/RecruiterProfile';
import PostJob          from './pages/PostJob';
import ManageJobs       from './pages/ManageJobs';
import BrowseJobs       from './pages/BrowseJobs';
import JobDetail        from './pages/JobDetail';
import MyApplications   from './pages/MyApplications';
import BrowseStudents   from './pages/BrowseStudents';
import JobApplicants    from './pages/JobApplicants';
import ApplicationTracker from './pages/ApplicationTracker';
import RecruiterTracker   from './pages/RecruiterTracker';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500
                        border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public ── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Shared ── */}
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* ── Student ── */}
          <Route path="/profile" element={
            <PrivateRoute><StudentProfile /></PrivateRoute>} />

          <Route path="/jobs" element={
            <PrivateRoute><BrowseJobs /></PrivateRoute>} />

          <Route path="/jobs/:job_id" element={
            <PrivateRoute><JobDetail /></PrivateRoute>} />

          <Route path="/my-applications" element={
            <PrivateRoute><MyApplications /></PrivateRoute>} />

          {/* ── Recruiter ── */}
          <Route path="/recruiter/profile" element={
            <PrivateRoute><RecruiterProfile /></PrivateRoute>} />

          <Route path="/jobs/post" element={
            <PrivateRoute><PostJob /></PrivateRoute>} />

          <Route path="/jobs/manage" element={
            <PrivateRoute><ManageJobs /></PrivateRoute>} />

          <Route path="/jobs/applicants/:job_id" element={
            <PrivateRoute><JobApplicants /></PrivateRoute>} />

          <Route path="/students/browse" element={
            <PrivateRoute><BrowseStudents /></PrivateRoute>} />

          <Route path="/admin" element={
  <PrivateRoute><AdminDashboard /></PrivateRoute>
} />

          <Route path="/tracker" element={
  <PrivateRoute><ApplicationTracker /></PrivateRoute>
} />

<Route path="/recruiter/tracker" element={
  <PrivateRoute><RecruiterTracker /></PrivateRoute>
} />

          {/* ── Default ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;