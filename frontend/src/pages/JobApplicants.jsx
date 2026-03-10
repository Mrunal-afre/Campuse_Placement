import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getJobApplicants,
  updateAppStatus,
  bulkUpdateStatus
} from '../api/auth';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'applied',      label: 'Applied',       color: 'bg-blue-50   text-blue-700'   },
  { value: 'under_review', label: 'Under Review',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'shortlisted',  label: 'Shortlisted',   color: 'bg-purple-50 text-purple-700' },
  { value: 'selected',     label: 'Selected',      color: 'bg-emerald-50 text-emerald-700'},
  { value: 'rejected',     label: 'Rejected',      color: 'bg-red-50    text-red-600'    },
];

export default function JobApplicants() {
  const { job_id }  = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [applicants,   setApplicants]   = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [jobTitle,     setJobTitle]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected,     setSelected]     = useState([]);  // selected app IDs
  const [bulkStatus,   setBulkStatus]   = useState('shortlisted');
  const [message,      setMessage]      = useState({ type: '', text: '' });
  const [updating,     setUpdating]     = useState(null); // ID being updated

  useEffect(() => {
    if (!user || user.role !== 'recruiter') { navigate('/dashboard'); return; }
    fetchApplicants();
  }, [job_id]);

  useEffect(() => {
    if (statusFilter) {
      setFiltered(applicants.filter(a => a.status === statusFilter));
    } else {
      setFiltered(applicants);
    }
    setSelected([]); // clear selection when filter changes
  }, [statusFilter, applicants]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await getJobApplicants(job_id);
      setApplicants(res.data.applicants);
      setFiltered(res.data.applicants);
      setJobTitle(res.data.job_title);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load applicants.' });
    } finally {
      setLoading(false);
    }
  };

  // Single status update
  const handleStatusChange = async (appId, newStatus) => {
    setUpdating(appId);
    try {
      await updateAppStatus(appId, { status: newStatus });
      setApplicants(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      );
      setMessage({ type: 'success', text: `✅ Status updated to "${newStatus}".` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update status.' });
    } finally {
      setUpdating(null);
    }
  };

  // Bulk status update
  const handleBulkUpdate = async () => {
    if (selected.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one applicant.' });
      return;
    }
    if (!window.confirm(
      `Update ${selected.length} applicant(s) to "${bulkStatus}"?`
    )) return;

    try {
      await bulkUpdateStatus({ application_ids: selected, status: bulkStatus });
      setApplicants(prev =>
        prev.map(a => selected.includes(a.id) ? { ...a, status: bulkStatus } : a)
      );
      setSelected([]);
      setMessage({
        type: 'success',
        text: `✅ ${selected.length} applicant(s) updated to "${bulkStatus}".`
      });
    } catch {
      setMessage({ type: 'error', text: 'Bulk update failed.' });
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(a => a.id));
    }
  };

  // Stats
  const stats = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = applicants.filter(a => a.status === s.value).length;
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-violet-500
                        border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading applicants...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3
                      flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <button onClick={() => navigate('/jobs/manage')}
          className="text-sm text-violet-600 hover:underline font-medium">
          ← My Jobs
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-0.5">Applicants for</p>
          <h1 className="text-2xl font-bold text-slate-800">{jobTitle}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {applicants.length} total applicant{applicants.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {STATUS_OPTIONS.map(s => (
            <button key={s.value}
              onClick={() => setStatusFilter(
                statusFilter === s.value ? '' : s.value
              )}
              className={`rounded-2xl p-3 text-center border transition
                ${statusFilter === s.value
                  ? 'ring-2 ring-violet-400 border-violet-300'
                  : 'border-slate-100 bg-white hover:border-violet-200'}`}>
              <p className="text-xl font-bold text-slate-700">
                {stats[s.value] || 0}
              </p>
              <p className={`text-xs font-semibold mt-0.5 px-2 py-0.5
                             rounded-full ${s.color}`}>
                {s.label}
              </p>
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        {/* Bulk Action Bar */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100
                          shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm
                               font-medium text-slate-600">
              <input type="checkbox"
                checked={selected.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-violet-600" />
              Select All ({filtered.length})
            </label>

            {selected.length > 0 && (
              <>
                <span className="text-xs bg-violet-100 text-violet-700
                                 font-semibold px-3 py-1 rounded-full">
                  {selected.length} selected
                </span>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">
                    Move to:
                  </span>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {STATUS_OPTIONS.slice(1).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={handleBulkUpdate}
                    className="bg-violet-600 hover:bg-violet-700 text-white
                               px-4 py-1.5 rounded-lg text-sm font-semibold transition">
                    Apply to {selected.length}
                  </button>
                </div>
              </>
            )}

            {/* Status filter tabs */}
            <div className="flex gap-2 ml-auto flex-wrap">
              {['', ...STATUS_OPTIONS.map(s => s.value)].map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-semibold px-3 py-1.5
                               rounded-full transition ${
                    statusFilter === s
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {s === '' ? 'All' : STATUS_OPTIONS.find(o => o.value === s)?.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Applicants Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No applicants found
            </h3>
            <p className="text-slate-400 text-sm">
              {statusFilter
                ? `No applicants with "${statusFilter}" status.`
                : 'No one has applied to this job yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <ApplicantRow
                key={app.id}
                app={app}
                isSelected={selected.includes(app.id)}
                onToggle={() => toggleSelect(app.id)}
                onStatusChange={handleStatusChange}
                isUpdating={updating === app.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Single Applicant Row ── */
function ApplicantRow({ app, isSelected, onToggle, onStatusChange, isUpdating }) {

  const [expanded,    setExpanded]    = useState(false);
  const [notes,       setNotes]       = useState(app.recruiter_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const { updateAppStatus } = { updateAppStatus: require('../api/auth').updateAppStatus };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateAppStatus(app.id, {
        status: app.status,
        recruiter_notes: notes
      });
    } catch {}
    finally { setSavingNotes(false); }
  };

  const skills = app.skills
    ? app.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const statusConfig = {
    applied:      { color: 'bg-blue-50 text-blue-700',     label: 'Applied'       },
    under_review: { color: 'bg-yellow-50 text-yellow-700', label: 'Under Review'  },
    shortlisted:  { color: 'bg-purple-50 text-purple-700', label: 'Shortlisted'   },
    selected:     { color: 'bg-emerald-50 text-emerald-700',label: 'Selected'     },
    rejected:     { color: 'bg-red-50 text-red-600',       label: 'Rejected'      },
  };
  const sc = statusConfig[app.status] || statusConfig['applied'];

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition
      ${isSelected ? 'border-violet-300 ring-1 ring-violet-100' : 'border-slate-100'}`}>

      {/* Main row */}
      <div className="flex items-center gap-4 p-4">

        {/* Checkbox */}
        <input type="checkbox" checked={isSelected} onChange={onToggle}
          className="w-4 h-4 accent-violet-600 flex-shrink-0" />

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-violet-50 flex items-center
                        justify-center flex-shrink-0 overflow-hidden">
          {app.student_photo
            ? <img src={app.student_photo} alt=""
                   className="w-full h-full object-cover" />
            : <span className="font-bold text-violet-400 text-lg">
                {app.student_name?.[0]?.toUpperCase()}
              </span>}
        </div>

        {/* Student info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800">{app.student_name}</h4>
          <p className="text-xs text-slate-500">{app.student_email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {app.branch && (
              <span className="text-xs bg-slate-100 text-slate-600
                               font-medium px-2 py-0.5 rounded-full uppercase">
                {app.branch}
              </span>
            )}
            {app.cgpa && (
              <span className="text-xs bg-emerald-50 text-emerald-700
                               font-semibold px-2 py-0.5 rounded-full">
                CGPA {app.cgpa}
              </span>
            )}
            <span className="text-xs text-slate-400">
              Applied {new Date(app.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Skills preview */}
        <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
          {skills.slice(0, 3).map(s => (
            <span key={s}
              className="text-xs bg-indigo-50 text-indigo-600
                         px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-xs text-slate-400">+{skills.length - 3}</span>
          )}
        </div>

        {/* Status dropdown */}
        <div className="flex-shrink-0">
          {isUpdating ? (
            <div className="w-6 h-6 border-2 border-violet-500
                            border-t-transparent rounded-full animate-spin" />
          ) : (
            <select
              value={app.status}
              onChange={e => onStatusChange(app.id, e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full
                          border-0 cursor-pointer outline-none ${sc.color}`}>
              {[
                { value: 'applied',      label: 'Applied'       },
                { value: 'under_review', label: 'Under Review'  },
                { value: 'shortlisted',  label: 'Shortlisted'   },
                { value: 'selected',     label: 'Selected'      },
                { value: 'rejected',     label: 'Rejected'      },
              ].map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Resume + Expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {app.resume && (
            <a href={app.resume} target="_blank" rel="noreferrer"
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700
                         font-semibold px-3 py-1.5 rounded-lg transition">
              📄 Resume
            </a>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-400 hover:text-slate-600
                       font-medium transition px-2 py-1.5">
            {expanded ? '▲ Less' : '▼ More'}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-16 pb-5 pt-1 border-t border-slate-100 space-y-4">

          {/* Cover letter */}
          {app.cover_letter && (
            <div>
              <p className="text-xs font-semibold text-slate-400
                            uppercase tracking-wide mb-1">Cover Letter</p>
              <p className="text-sm text-slate-600 bg-slate-50
                            rounded-xl p-3 leading-relaxed italic">
                "{app.cover_letter}"
              </p>
            </div>
          )}

          {/* All skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400
                            uppercase tracking-wide mb-2">All Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s}
                    className="text-xs bg-violet-50 text-violet-700
                               font-medium px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recruiter notes */}
          <div>
            <p className="text-xs font-semibold text-slate-400
                          uppercase tracking-wide mb-1">
              Private Notes (only you can see this)
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add notes about this candidate..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-violet-300 resize-none"
            />
            <button onClick={handleSaveNotes} disabled={savingNotes}
              className="mt-1 text-xs text-violet-600 hover:text-violet-800
                         font-semibold disabled:opacity-50">
              {savingNotes ? 'Saving...' : '💾 Save Notes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}