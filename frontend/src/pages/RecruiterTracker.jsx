import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { getRecruiterStats }   from '../api/auth';
import { useAuth }             from '../context/AuthContext';

export default function RecruiterTracker() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      navigate('/dashboard'); return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getRecruiterStats();
      setStats(res.data);
    } catch {
      setMessage('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-violet-500
                        border-t-transparent rounded-full animate-spin
                        mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const breakdown = stats?.status_breakdown || {};

  // Pipeline data for the visual bar
  const pipeline = [
    { key: 'applied',      label: 'Applied',      color: 'bg-blue-400',    icon: '📋' },
    { key: 'under_review', label: 'Under Review', color: 'bg-yellow-400',  icon: '🔍' },
    { key: 'shortlisted',  label: 'Shortlisted',  color: 'bg-purple-500',  icon: '⭐' },
    { key: 'selected',     label: 'Selected',     color: 'bg-emerald-500', icon: '🎉' },
    { key: 'rejected',     label: 'Rejected',     color: 'bg-red-400',     icon: '❌' },
  ];

  const total = stats?.total_applicants || 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3
                      flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
          <span className="ml-2 text-xs bg-violet-100 text-violet-700
                           font-semibold px-2 py-0.5 rounded-full">
            Recruiter
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/jobs/manage')}
            className="text-sm text-violet-600 hover:underline font-medium">
            My Jobs
          </button>
          <button onClick={() => navigate('/students/browse')}
            className="text-sm text-violet-600 hover:underline font-medium">
            Browse Students
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
            Recruitment Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of all your placement activities
          </p>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50
                          text-red-700 border border-red-200">
            {message}
          </div>
        )}

        {/* ── Top Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Jobs',       value: stats?.total_jobs,       icon: '💼', color: 'text-slate-700'    },
            { label: 'Active Jobs',      value: stats?.active_jobs,      icon: '🟢', color: 'text-emerald-600'  },
            { label: 'Total Applicants', value: stats?.total_applicants, icon: '👥', color: 'text-blue-600'     },
            { label: 'Selected',         value: stats?.selected,         icon: '🎉', color: 'text-emerald-600'  },
          ].map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl shadow-sm border
                         border-slate-100 p-5 text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Pipeline Overview ── */}
        {total > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-6 mb-6">
            <h2 className="font-semibold text-slate-700 text-sm
                           uppercase tracking-wide mb-4">
              Applicant Pipeline
            </h2>

            {/* Progress bar */}
            <div className="flex rounded-full overflow-hidden h-4 mb-4">
              {pipeline.map(p => {
                const count = breakdown[p.key] || 0;
                const pct   = total > 0 ? (count / total) * 100 : 0;
                return pct > 0 ? (
                  <div key={p.key}
                    className={`${p.color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${p.label}: ${count}`}
                  />
                ) : null;
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {pipeline.map(p => (
                <div key={p.key}
                  className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full
                                   flex-shrink-0 ${p.color}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {breakdown[p.key] || 0}
                    </p>
                    <p className="text-xs text-slate-400">{p.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Per-Job Breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm border
                        border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-700 text-sm
                           uppercase tracking-wide">
              Per Job Breakdown
            </h2>
            <button onClick={() => navigate('/jobs/post')}
              className="text-xs bg-violet-600 hover:bg-violet-700
                         text-white px-3 py-1.5 rounded-lg font-semibold transition">
              + Post New Job
            </button>
          </div>

          {!stats?.job_breakdown?.length ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💼</div>
              <p className="text-slate-500 text-sm mb-4">
                No jobs posted yet
              </p>
              <button onClick={() => navigate('/jobs/post')}
                className="bg-violet-600 hover:bg-violet-700 text-white
                           px-5 py-2 rounded-xl text-sm font-semibold transition">
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.job_breakdown.map(job => {
                const jobTotal = job.total || 0;
                return (
                  <div key={job.job_id}
                    className="border border-slate-100 rounded-xl p-4
                               hover:border-violet-200 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">
                            {job.job_title}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-0.5
                                            rounded-full ${
                            job.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {job.is_active ? '🟢 Active' : '⚫ Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {jobTotal} total applicant{jobTotal !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/jobs/applicants/${job.job_id}`)
                        }
                        className="text-xs text-violet-600 hover:underline
                                   font-semibold flex-shrink-0">
                        Manage →
                      </button>
                    </div>

                    {/* Mini pipeline bar */}
                    {jobTotal > 0 ? (
                      <>
                        <div className="flex rounded-full overflow-hidden
                                        h-2 mb-2 bg-slate-100">
                          {[
                            { key: 'shortlisted', color: 'bg-purple-400' },
                            { key: 'selected',    color: 'bg-emerald-500' },
                            { key: 'rejected',    color: 'bg-red-300'    },
                          ].map(p => {
                            const cnt = job[p.key] || 0;
                            const pct = (cnt / jobTotal) * 100;
                            return pct > 0 ? (
                              <div key={p.key}
                                className={`${p.color}`}
                                style={{ width: `${pct}%` }} />
                            ) : null;
                          })}
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>
                            ⭐ Shortlisted: <strong>{job.shortlisted}</strong>
                          </span>
                          <span>
                            🎉 Selected: <strong>{job.selected}</strong>
                          </span>
                          <span>
                            ❌ Rejected: <strong>{job.rejected}</strong>
                          </span>
                          <span>
                            📋 Others: <strong>
                              {jobTotal - job.shortlisted
                                        - job.selected
                                        - job.rejected}
                            </strong>
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No applications yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}