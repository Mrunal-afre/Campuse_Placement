import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  getAdminStats, getPendingUsers, getAdminUsers,
  updateUserAdmin, getAdminJobs, deleteJobAdmin
} from '../api/auth';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'overview',  label: '📊 Overview'          },
  { key: 'pending',   label: '⏳ Pending Approvals'  },
  { key: 'students',  label: '🎓 Students'           },
  { key: 'recruiters',label: '🏢 Recruiters'         },
  { key: 'jobs',      label: '💼 Jobs'               },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats,     setStats]     = useState(null);
  const [pending,   setPending]   = useState([]);
  const [students,  setStudents]  = useState([]);
  const [recruiters,setRecruiters]= useState([]);
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState({ type: '', text: '' });
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard'); return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        getAdminStats(),
        getPendingUsers(),
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data.pending);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load admin data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await getAdminUsers('?role=student');
      setStudents(res.data.users);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load students.' });
    }
  };

  const loadRecruiters = async () => {
    try {
      const res = await getAdminUsers('?role=recruiter');
      setRecruiters(res.data.users);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load recruiters.' });
    }
  };

  const loadJobs = async () => {
    try {
      const res = await getAdminJobs();
      setJobs(res.data.jobs);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load jobs.' });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage({ type: '', text: '' });
    setSearch('');
    if (tab === 'students'   && !students.length)   loadStudents();
    if (tab === 'recruiters' && !recruiters.length) loadRecruiters();
    if (tab === 'jobs'       && !jobs.length)       loadJobs();
  };

  const handleApprove = async (userId, approve) => {
    try {
      await updateUserAdmin(userId, { is_approved: approve });
      const msg = approve ? '✅ User approved.' : '✅ User unapproved.';
      setMessage({ type: 'success', text: msg });
      // Refresh pending list
      const res = await getPendingUsers();
      setPending(res.data.pending);
      // Refresh stats
      const statsRes = await getAdminStats();
      setStats(statsRes.data);
      // Also refresh students/recruiters if loaded
      if (students.length)   loadStudents();
      if (recruiters.length) loadRecruiters();
    } catch {
      setMessage({ type: 'error', text: 'Action failed.' });
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    if (!window.confirm(
      currentActive
        ? 'Deactivate this account? User will not be able to login.'
        : 'Reactivate this account?'
    )) return;
    try {
      await updateUserAdmin(userId, { is_active: !currentActive });
      setMessage({
        type: 'success',
        text: currentActive ? '✅ Account deactivated.' : '✅ Account reactivated.'
      });
      if (students.length)   loadStudents();
      if (recruiters.length) loadRecruiters();
    } catch {
      setMessage({ type: 'error', text: 'Action failed.' });
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Permanently delete this job and all its applications?'))
      return;
    try {
      await deleteJobAdmin(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      setMessage({ type: 'success', text: '✅ Job deleted.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete job.' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-rose-500
                        border-t-transparent rounded-full animate-spin
                        mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading admin panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3
                      flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
            <span className="ml-2 text-xs bg-rose-100 text-rose-700
                             font-semibold px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.full_name}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-sm bg-slate-100 hover:bg-slate-200
                       text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage the entire Campus Placement Platform
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm
                        border border-slate-100 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 min-w-max px-4 py-2 rounded-xl text-sm
                          font-semibold transition whitespace-nowrap
                          ${activeTab === tab.key
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'}`}>
              {tab.label}
              {tab.key === 'pending' && pending.length > 0 && (
                <span className="ml-1.5 bg-white text-rose-600
                                 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Flash Message ── */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        {/* ── TAB: Overview ── */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students',   value: stats.users.total_students,
                  icon: '🎓', color: 'text-blue-600',    bg: 'bg-blue-50'    },
                { label: 'Total Recruiters', value: stats.users.total_recruiters,
                  icon: '🏢', color: 'text-violet-600',  bg: 'bg-violet-50'  },
                { label: 'Active Jobs',      value: stats.jobs.active,
                  icon: '💼', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Total Apps',       value: stats.applications.total,
                  icon: '📋', color: 'text-orange-600',  bg: 'bg-orange-50'  },
              ].map(s => (
                <div key={s.label}
                  className={`${s.bg} rounded-2xl border border-slate-100
                               p-5 text-center shadow-sm`}>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pending Approval', value: stats.users.pending_approval,
                  icon: '⏳', color: 'text-amber-600' },
                { label: 'Total Jobs',       value: stats.jobs.total,
                  icon: '📝', color: 'text-slate-700' },
                { label: 'Shortlisted',      value: stats.applications.shortlisted,
                  icon: '⭐', color: 'text-purple-600' },
                { label: 'Selected',         value: stats.applications.selected,
                  icon: '🎉', color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label}
                  className="bg-white rounded-2xl border border-slate-100
                             p-5 text-center shadow-sm">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Pending alert */}
            {stats.users.pending_approval > 0 && (
              <div
                onClick={() => handleTabChange('pending')}
                className="bg-amber-50 border border-amber-200 rounded-2xl
                           p-4 flex items-center gap-4 cursor-pointer
                           hover:bg-amber-100 transition">
                <span className="text-3xl">⏳</span>
                <div>
                  <p className="font-semibold text-amber-800">
                    {stats.users.pending_approval} account
                    {stats.users.pending_approval > 1 ? 's' : ''} waiting
                    for your approval
                  </p>
                  <p className="text-sm text-amber-600">
                    Click here to review and approve →
                  </p>
                </div>
              </div>
            )}

            {/* Recent signups */}
            <div className="bg-white rounded-2xl shadow-sm border
                            border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 text-sm
                             uppercase tracking-wide mb-4">
                Recent Signups
              </h3>
              <div className="space-y-3">
                {stats.recent_signups.map(u => (
                  <div key={u.id}
                    className="flex items-center justify-between
                               py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center
                                       justify-center text-sm font-bold
                                       ${u.role === 'student'
                                         ? 'bg-blue-100 text-blue-600'
                                         : 'bg-violet-100 text-violet-600'}`}>
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5
                                        rounded-full capitalize
                                        ${u.role === 'student'
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'bg-violet-50 text-violet-700'}`}>
                        {u.role}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5
                                        rounded-full
                                        ${u.is_approved
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'}`}>
                        {u.is_approved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Pending Approvals ── */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-700">
                Pending Approvals
                <span className="ml-2 bg-amber-100 text-amber-700
                                 text-sm px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              </h2>
            </div>

            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border
                              border-slate-100 p-16 text-center">
                <div className="text-6xl mb-3">✅</div>
                <h3 className="text-lg font-semibold text-slate-700">
                  All caught up!
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  No accounts waiting for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(u => (
                  <div key={u.id}
                    className="bg-white rounded-2xl shadow-sm border
                               border-amber-100 p-5 flex items-center
                               justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center
                                       justify-center text-xl font-bold
                                       ${u.role === 'student'
                                         ? 'bg-blue-100 text-blue-600'
                                         : 'bg-violet-100 text-violet-600'}`}>
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">
                            {u.full_name}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-0.5
                                            rounded-full capitalize
                                            ${u.role === 'student'
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'bg-violet-50 text-violet-700'}`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{u.email}</p>
                        {u.company_name && (
                          <p className="text-xs text-slate-400">
                            🏢 {u.company_name}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          Registered: {new Date(u.created_at)
                            .toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(u.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700
                                   text-white px-5 py-2 rounded-xl text-sm
                                   font-semibold transition shadow-sm">
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleToggleActive(u.id, true)}
                        className="bg-red-50 hover:bg-red-100 text-red-600
                                   px-5 py-2 rounded-xl text-sm font-semibold
                                   transition">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Students ── */}
        {activeTab === 'students' && (
          <UserTab
            users={students}
            role="student"
            search={search}
            setSearch={setSearch}
            onApprove={handleApprove}
            onToggleActive={handleToggleActive}
          />
        )}

        {/* ── TAB: Recruiters ── */}
        {activeTab === 'recruiters' && (
          <UserTab
            users={recruiters}
            role="recruiter"
            search={search}
            setSearch={setSearch}
            onApprove={handleApprove}
            onToggleActive={handleToggleActive}
          />
        )}

        {/* ── TAB: Jobs ── */}
        {activeTab === 'jobs' && (
          <JobsTab
            jobs={jobs}
            search={search}
            setSearch={setSearch}
            onDelete={handleDeleteJob}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────────
   Reusable: Users Table (Students + Recruiters)
──────────────────────────────────────────────── */
function UserTab({ users, role, search, setSearch, onApprove, onToggleActive }) {
  const filtered = search
    ? users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3">
        <h2 className="font-semibold text-slate-700 capitalize">
          {role === 'student' ? '🎓' : '🏢'} All {role}s
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({filtered.length})
          </span>
        </h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${role}s...`}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-rose-300
                     bg-white w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border
                        border-slate-100 p-12 text-center">
          <p className="text-slate-400">No {role}s found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border
                        border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">
                  User
                </th>
                {role === 'student' && (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold
                                   text-slate-500 uppercase tracking-wide">
                      Branch
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold
                                   text-slate-500 uppercase tracking-wide">
                      CGPA
                    </th>
                  </>
                )}
                {role === 'recruiter' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold
                                 text-slate-500 uppercase tracking-wide">
                    Company
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center
                                       justify-center text-xs font-bold
                                       ${role === 'student'
                                         ? 'bg-blue-100 text-blue-600'
                                         : 'bg-violet-100 text-violet-600'}`}>
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {role === 'student' && (
                    <>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600
                                         px-2 py-0.5 rounded-full uppercase
                                         font-medium">
                          {u.branch || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold
                                     text-emerald-600">
                        {u.cgpa || '—'}
                      </td>
                    </>
                  )}
                  {role === 'recruiter' && (
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {u.company_name || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5
                                        rounded-full w-fit
                                        ${u.is_approved
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'}`}>
                        {u.is_approved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5
                                        rounded-full w-fit
                                        ${u.is_active
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'bg-red-50 text-red-600'}`}>
                        {u.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {!u.is_approved ? (
                        <button
                          onClick={() => onApprove(u.id, true)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700
                                     text-white px-3 py-1.5 rounded-lg
                                     font-semibold transition">
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => onApprove(u.id, false)}
                          className="text-xs bg-amber-50 hover:bg-amber-100
                                     text-amber-700 px-3 py-1.5 rounded-lg
                                     font-semibold transition">
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => onToggleActive(u.id, u.is_active)}
                        className={`text-xs px-3 py-1.5 rounded-lg
                                    font-semibold transition
                                    ${u.is_active
                                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────
   Reusable: Jobs Table
──────────────────────────────────────────────── */
function JobsTab({ jobs, search, setSearch, onDelete, navigate }) {
  const filtered = search
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company_name.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  const JOB_TYPE_LABELS = {
    full_time: 'Full Time', internship: 'Internship',
    part_time: 'Part Time', contract:   'Contract',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3">
        <h2 className="font-semibold text-slate-700">
          💼 All Job Postings
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({filtered.length})
          </span>
        </h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or company..."
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-rose-300
                     bg-white w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border
                        border-slate-100 p-12 text-center">
          <p className="text-slate-400">No jobs found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id}
              className="bg-white rounded-2xl shadow-sm border
                         border-slate-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">{job.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5
                                      rounded-full
                                      ${job.is_active
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'}`}>
                      {job.is_active ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                    <span className="text-xs bg-violet-50 text-violet-700
                                     font-semibold px-2 py-0.5 rounded-full">
                      {JOB_TYPE_LABELS[job.job_type]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    🏢 {job.company_name} · {job.recruiter_name}
                    · {job.location}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1
                                  text-xs text-slate-500">
                    {job.package_lpa && (
                      <span>💰 {job.package_lpa} LPA</span>
                    )}
                    <span>🎓 Min CGPA: {job.min_cgpa}</span>
                    <span>👥 {job.vacancy_count} vacancies</span>
                    <span className="font-semibold text-blue-600">
                      📋 {job.total_applications} applications
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      navigate(`/jobs/applicants/${job.id}`)
                    }
                    className="text-xs bg-blue-50 hover:bg-blue-100
                               text-blue-700 font-semibold px-3 py-1.5
                               rounded-lg transition">
                    View Apps
                  </button>
                  <button
                    onClick={() => onDelete(job.id)}
                    className="text-xs bg-red-50 hover:bg-red-100
                               text-red-600 font-semibold px-3 py-1.5
                               rounded-lg transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}