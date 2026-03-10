import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await logoutUser({ refresh });
    } catch (e) {
      // Even if API fails, clear local state
    }
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🎓 Campus Placement Portal</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm">Hello, {user.full_name}</span>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <div className="bg-white rounded-2xl shadow p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {user.full_name}! 👋
          </h2>

          <p className="text-gray-500 mb-6">
            You are logged in as{" "}
            <strong className="text-blue-600 capitalize">
              {user.role}
            </strong>
          </p>

          {/* ================= STUDENT DASHBOARD ================= */}
          {user.role === 'student' && (
            <div className="grid grid-cols-2 gap-4">

              {/* My Profile */}
              <div
                onClick={() => navigate('/profile')}
                className="bg-blue-50 rounded-xl p-5 border border-blue-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-semibold text-gray-800">My Profile</h3>
                <p className="text-sm text-gray-500">
                  Complete your student profile
                </p>
              </div>

              {/* Browse Jobs */}
              <div
                onClick={() => navigate('/jobs')}
                className="bg-green-50 rounded-xl p-5 border border-green-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">💼</div>
                <h3 className="font-semibold text-gray-800">Browse Jobs</h3>
                <p className="text-sm text-gray-500">
                  View campus job postings
                </p>
              </div>

              {/* My Applications */}
              <div
                onClick={() => navigate('/my-applications')}
                className="bg-yellow-50 rounded-xl p-5 border border-yellow-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">📋</div>
                <h3 className="font-semibold text-gray-800">My Applications</h3>
                <p className="text-sm text-gray-500">
                  Track your applications
                </p>
              </div>

            </div>
          )}

          {/* ================= RECRUITER DASHBOARD ================= */}
          {user.role === 'recruiter' && (
            <div className="grid grid-cols-2 gap-4">

              {/* Company Profile */}
              <div
                onClick={() => navigate('/recruiter/profile')}
                className="bg-blue-50 rounded-xl p-5 border border-blue-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-semibold text-gray-800">
                  Company Profile
                </h3>
                <p className="text-sm text-gray-500">
                  Set up your company info
                </p>
              </div>

              {/* Post a Job */}
              <div
                onClick={() => navigate('/jobs/post')}
                className="bg-purple-50 rounded-xl p-5 border border-purple-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-800">
                  Post a Job
                </h3>
                <p className="text-sm text-gray-500">
                  Create campus job openings
                </p>
              </div>

              {/* Browse Students */}
              <div
                onClick={() => navigate('/students/browse')}
                className="bg-green-50 rounded-xl p-5 border border-green-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-800">
                  Browse Students
                </h3>
                <p className="text-sm text-gray-500">
                  Find the right candidates
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}