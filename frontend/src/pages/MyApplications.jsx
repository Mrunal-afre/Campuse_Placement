import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyApplications, withdrawApplication } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  applied:      { label: 'Applied',       color: 'bg-blue-50 text-blue-700',    icon: '📋' },
  under_review: { label: 'Under Review',  color: 'bg-yellow-50 text-yellow-700',icon: '🔍' },
  shortlisted:  { label: 'Shortlisted',   color: 'bg-purple-50 text-purple-700',icon: '⭐' },
  selected:     { label: 'Selected',      color: 'bg-emerald-50 text-emerald-700',icon: '🎉' },
  rejected:     { label: 'Rejected',      color: 'bg-red-50 text-red-600',      icon: '❌' },
  withdrawn:    { label: 'Withdrawn',     color: 'bg-slate-100 text-slate-500', icon: '↩️' },
};

const JOB_TYPE_LABELS = {
  full_time: 'Full Time',
  internship: 'Internship',
  part_time: 'Part Time',
  contract: 'Contract',
};

export default function MyApplications() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/dashboard');
      return;
    }
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await getMyApplications();
      setApps(res.data.applications);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load applications.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    try {
      await withdrawApplication(appId);
      setApps(apps.filter(a => a.id !== appId));
      setMessage({ type: 'success', text: '✅ Application withdrawn.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Cannot withdraw this application.'
      });
    }
  };

  const filtered = filter ? apps.filter(a => a.status === filter) : apps;

  const stats = {
    total: apps.length,
    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
    selected: apps.filter(a => a.status === 'selected').length,
    pending: apps.filter(a => ['applied', 'under_review'].includes(a.status)).length,
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>

        <div className="flex gap-4 items-center">

          <button
            onClick={() => navigate('/jobs')}
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Browse Jobs
          </button>

          {/* ✅ NEW TRACKER BUTTON */}
          <button
            onClick={() => navigate('/tracker')}
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Tracker
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
          >
            Dashboard
          </button>

        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          My Applications
        </h1>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Applied', value: stats.total, color: 'text-slate-700' },
            { label: 'Pending', value: stats.pending, color: 'text-blue-600' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-purple-600' },
            { label: 'Selected', value: stats.selected, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Status Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {['', 'applied', 'under_review', 'shortlisted', 'selected', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {s === '' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No applications yet
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Browse jobs and apply to get started!
            </p>

            <button
              onClick={() => navigate('/jobs')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Browse Jobs →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => {
              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['applied'];

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800">{app.job_title}</h3>
                      <p className="text-sm text-slate-500">
                        {app.company_name} · {app.location}
                      </p>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}