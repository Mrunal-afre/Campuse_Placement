import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { getStudentStats, getAppTimeline, withdrawApplication } from '../api/auth';
import { useAuth }             from '../context/AuthContext';

const STATUS_CONFIG = {
  applied:      { label: 'Applied',      color: 'bg-blue-50 text-blue-700',      icon: '📋', dot: 'bg-blue-400'    },
  under_review: { label: 'Under Review', color: 'bg-yellow-50 text-yellow-700',  icon: '🔍', dot: 'bg-yellow-400'  },
  shortlisted:  { label: 'Shortlisted',  color: 'bg-purple-50 text-purple-700',  icon: '⭐', dot: 'bg-purple-500'  },
  selected:     { label: 'Selected',     color: 'bg-emerald-50 text-emerald-700',icon: '🎉', dot: 'bg-emerald-500' },
  rejected:     { label: 'Rejected',     color: 'bg-red-50 text-red-600',        icon: '❌', dot: 'bg-red-400'     },
  withdrawn:    { label: 'Withdrawn',    color: 'bg-slate-100 text-slate-500',   icon: '↩️', dot: 'bg-slate-300'   },
};

const PIPELINE_STEPS = [
  { key: 'applied',      label: 'Applied',      icon: '📋' },
  { key: 'under_review', label: 'Under Review', icon: '🔍' },
  { key: 'shortlisted',  label: 'Shortlisted',  icon: '⭐' },
  { key: 'selected',     label: 'Selected',     icon: '🎉' },
];

export default function ApplicationTracker() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [expanded, setExpanded] = useState(null); // which app is expanded
  const [timeline, setTimeline] = useState({});   // appId -> timeline data
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getStudentStats();
      setStats(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load tracking data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (appId) => {
    // Toggle: collapse if already open
    if (expanded === appId) { setExpanded(null); return; }

    setExpanded(appId);

    // Load timeline only if not already loaded
    if (!timeline[appId]) {
      try {
        const res = await getAppTimeline(appId);
        setTimeline(prev => ({ ...prev, [appId]: res.data }));
      } catch {
        setMessage({ type: 'error', text: 'Failed to load timeline.' });
      }
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await withdrawApplication(appId);
      setMessage({ type: 'success', text: '✅ Application withdrawn.' });
      fetchStats(); // reload
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Cannot withdraw.'
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500
                        border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading your tracker...</p>
      </div>
    </div>
  );

  const apps = stats?.recent_applications || [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3
                      flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/jobs')}
            className="text-sm text-indigo-600 hover:underline font-medium">
            Browse Jobs
          </button>
          <button onClick={() => navigate('/my-applications')}
            className="text-sm text-indigo-600 hover:underline font-medium">
            All Applications
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200
                       text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Application Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track every stage of your placement journey
          </p>
        </div>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Applied', value: stats.total_applied,
                color: 'text-slate-700',   bg: 'bg-white',         icon: '📋' },
              { label: 'Shortlisted',   value: stats.shortlisted,
                color: 'text-purple-600', bg: 'bg-purple-50',      icon: '⭐' },
              { label: 'Selected',      value: stats.selected,
                color: 'text-emerald-600',bg: 'bg-emerald-50',     icon: '🎉' },
              { label: 'Pending',       value: stats.pending,
                color: 'text-blue-600',   bg: 'bg-blue-50',        icon: '⏳' },
            ].map(s => (
              <div key={s.label}
                className={`${s.bg} rounded-2xl shadow-sm border
                            border-slate-100 p-5 text-center`}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Visual Pipeline Legend ── */}
        <div className="bg-white rounded-2xl shadow-sm border
                        border-slate-100 p-6 mb-6">
          <h2 className="font-semibold text-slate-700 text-sm
                         uppercase tracking-wide mb-4">
            Placement Pipeline
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-8 right-8 h-0.5
                            bg-slate-200 z-0" />
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center
                                            z-10 flex-1">
                <div className="w-10 h-10 rounded-full bg-slate-100
                                border-2 border-slate-200 flex items-center
                                justify-center text-lg mb-2">
                  {step.icon}
                </div>
                <p className="text-xs font-semibold text-slate-500 text-center">
                  {step.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            Each application moves through these stages.
            Click any application below to see its exact position.
          </p>
        </div>

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        {/* ── Application Cards with Timeline ── */}
        <h2 className="font-semibold text-slate-700 text-sm
                       uppercase tracking-wide mb-3">
          Your Applications
        </h2>

        {apps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No applications yet
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Apply to jobs to start tracking your placement journey!
            </p>
            <button onClick={() => navigate('/jobs')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white
                         px-6 py-2.5 rounded-xl text-sm font-semibold transition">
              Browse Jobs →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => {
              const sc        = STATUS_CONFIG[app.status] || STATUS_CONFIG['applied'];
              const isOpen    = expanded === app.id;
              const tl        = timeline[app.id];

              return (
                <div key={app.id}
                  className="bg-white rounded-2xl shadow-sm border
                             border-slate-100 overflow-hidden transition
                             hover:shadow-md">

                  {/* Card Header */}
                  <div className="p-5 flex items-center gap-4">

                    {/* Company logo */}
                    <div className="w-12 h-12 rounded-xl bg-indigo-50
                                    flex items-center justify-center
                                    flex-shrink-0 overflow-hidden">
                      {app.company_logo
                        ? <img src={app.company_logo} alt=""
                               className="w-full h-full object-contain p-1" />
                        : <span className="text-xl">🏢</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800">
                        {app.job_title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {app.company_name} · {app.location}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs font-semibold px-3 py-1.5
                                      rounded-full flex-shrink-0 ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>

                    {/* Expand button */}
                    <button
                      onClick={() => handleExpand(app.id)}
                      className="text-slate-400 hover:text-indigo-600
                                 transition font-bold text-lg flex-shrink-0
                                 w-8 h-8 flex items-center justify-center
                                 rounded-full hover:bg-indigo-50">
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* ── Expanded Timeline ── */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4
                                    bg-slate-50">
                      {!tl ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-indigo-500
                                          border-t-transparent rounded-full
                                          animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Pipeline Steps */}
                          <div className="flex items-start justify-between
                                          relative mb-6">
                            {/* Connector line */}
                            <div className="absolute top-4 left-6 right-6
                                            h-0.5 bg-slate-200 z-0" />

                            {tl.pipeline.map((step, idx) => (
                              <div key={step.step}
                                className="flex flex-col items-center
                                           z-10 flex-1">
                                {/* Circle */}
                                <div className={`w-8 h-8 rounded-full border-2
                                  flex items-center justify-center text-sm
                                  mb-2 transition-all
                                  ${step.state === 'completed'
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : step.state === 'current'
                                    ? 'bg-white border-indigo-500 ring-4 ring-indigo-100'
                                    : 'bg-white border-slate-200 text-slate-300'
                                  }`}>
                                  {step.state === 'completed'
                                    ? '✓'
                                    : step.state === 'current'
                                    ? PIPELINE_STEPS.find(
                                        p => p.key === step.step
                                      )?.icon
                                    : idx + 1}
                                </div>
                                <p className={`text-xs font-semibold
                                  text-center leading-tight
                                  ${step.state === 'completed'
                                    ? 'text-indigo-600'
                                    : step.state === 'current'
                                    ? 'text-slate-800'
                                    : 'text-slate-300'
                                  }`}>
                                  {step.label}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Rejected / Withdrawn banner */}
                          {tl.current_status === 'rejected' && (
                            <div className="bg-red-50 border border-red-200
                                            rounded-xl px-4 py-3 mb-4">
                              <p className="text-sm font-semibold text-red-700">
                                ❌ Your application was not selected this time.
                                Keep applying — the right opportunity is ahead!
                              </p>
                            </div>
                          )}

                          {tl.current_status === 'selected' && (
                            <div className="bg-emerald-50 border
                                            border-emerald-200 rounded-xl
                                            px-4 py-3 mb-4">
                              <p className="text-sm font-semibold
                                            text-emerald-700">
                                🎉 Congratulations! You have been selected.
                                The recruiter will contact you soon.
                              </p>
                            </div>
                          )}

                          {tl.current_status === 'shortlisted' && (
                            <div className="bg-purple-50 border
                                            border-purple-200 rounded-xl
                                            px-4 py-3 mb-4">
                              <p className="text-sm font-semibold
                                            text-purple-700">
                                ⭐ Great news! You have been shortlisted.
                                Prepare for the next round!
                              </p>
                            </div>
                          )}

                          {/* Timeline dates */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3 border
                                            border-slate-100">
                              <p className="text-xs text-slate-400 font-medium">
                                Applied On
                              </p>
                              <p className="text-sm font-semibold
                                            text-slate-700 mt-0.5">
                                {new Date(tl.applied_at)
                                  .toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short',
                                    year: 'numeric'
                                  })}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border
                                            border-slate-100">
                              <p className="text-xs text-slate-400 font-medium">
                                Last Updated
                              </p>
                              <p className="text-sm font-semibold
                                            text-slate-700 mt-0.5">
                                {new Date(tl.updated_at)
                                  .toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short',
                                    year: 'numeric'
                                  })}
                              </p>
                            </div>
                          </div>

                          {/* Cover letter */}
                          {tl.cover_letter && (
                            <div className="bg-white rounded-xl p-3 border
                                            border-slate-100 mb-4">
                              <p className="text-xs text-slate-400
                                            font-medium mb-1">
                                Your Cover Letter
                              </p>
                              <p className="text-sm text-slate-600 italic
                                            leading-relaxed">
                                "{tl.cover_letter}"
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => navigate(`/jobs/${app.job}`)}
                              className="text-xs text-indigo-600
                                         hover:underline font-medium">
                              View Job →
                            </button>
                            {!['selected','rejected','withdrawn']
                              .includes(app.status) && (
                              <button
                                onClick={() => handleWithdraw(app.id)}
                                className="text-xs text-slate-400
                                           hover:text-red-500 transition ml-4">
                                Withdraw Application
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* View All link */}
            {stats?.total_applied > 5 && (
              <div className="text-center pt-2">
                <button onClick={() => navigate('/my-applications')}
                  className="text-sm text-indigo-600 hover:underline font-medium">
                  View all {stats.total_applied} applications →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}