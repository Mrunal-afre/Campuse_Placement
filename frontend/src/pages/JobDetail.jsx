import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetail, applyToJob, checkApplication, withdrawApplication } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const JOB_TYPE_LABELS = {
  full_time: 'Full Time', internship: 'Internship',
  part_time: 'Part Time', contract: 'Contract',
};

const STATUS_COLORS = {
  applied:      'bg-blue-50 text-blue-700',
  under_review: 'bg-yellow-50 text-yellow-700',
  shortlisted:  'bg-purple-50 text-purple-700',
  selected:     'bg-emerald-50 text-emerald-700',
  rejected:     'bg-red-50 text-red-700',
  withdrawn:    'bg-slate-100 text-slate-500',
};

export default function JobDetail() {
  const { job_id }    = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [job,         setJob]         = useState(null);
  const [appStatus,   setAppStatus]   = useState(null);   // null = not applied
  const [appId,       setAppId]       = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [applying,    setApplying]    = useState(false);
  const [message,     setMessage]     = useState({ type: '', text: '' });

  useEffect(() => {
    fetchJob();
    if (user?.role === 'student') checkIfApplied();
  }, [job_id]);

  const fetchJob = async () => {
    try {
      const res = await getJobDetail(job_id);
      setJob(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Job not found.' });
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const res = await checkApplication(job_id);
      if (res.data.applied) {
        setAppStatus(res.data.application.status);
        setAppId(res.data.application.id);
      }
    } catch {}
  };

  const handleApply = async () => {
    setApplying(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await applyToJob({ job: job_id, cover_letter: coverLetter });
      setAppStatus('applied');
      setAppId(res.data.application.id);
      setShowForm(false);
      setMessage({ type: 'success', text: '✅ Application submitted successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to apply.'
      });
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw your application? This cannot be undone.')) return;
    try {
      await withdrawApplication(appId);
      setAppStatus(null);
      setAppId(null);
      setMessage({ type: 'success', text: '✅ Application withdrawn.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Cannot withdraw.'
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-slate-600">Job not found.</p>
        <button onClick={() => navigate('/jobs')} className="mt-3 text-indigo-600 hover:underline text-sm">
          ← Back to Jobs
        </button>
      </div>
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
        <button onClick={() => navigate(user?.role === 'student' ? '/jobs' : '/jobs/manage')}
          className="text-sm text-indigo-600 hover:underline font-medium">
          ← Back to Jobs
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        {/* Job Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5">
          <div className="flex items-start gap-5">

            {/* Company logo */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0">
              {job.company_logo
                ? <img src={job.company_logo} alt="logo" className="w-full h-full object-contain p-1" />
                : <span className="text-3xl">🏢</span>}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
                  <p className="text-slate-500 font-medium mt-0.5">
                    {job.company_name} · {job.location}
                  </p>
                </div>

                {/* Apply / Status button — only for students */}
                {user?.role === 'student' && (
                  <div>
                    {appStatus ? (
                      <div className="text-right">
                        <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-xl ${STATUS_COLORS[appStatus]}`}>
                          {appStatus === 'applied'      && '📋 Applied'}
                          {appStatus === 'under_review' && '🔍 Under Review'}
                          {appStatus === 'shortlisted'  && '⭐ Shortlisted'}
                          {appStatus === 'selected'     && '🎉 Selected!'}
                          {appStatus === 'rejected'     && '❌ Rejected'}
                        </span>
                        {!['selected', 'rejected'].includes(appStatus) && (
                          <button onClick={handleWithdraw}
                            className="block mt-2 text-xs text-slate-400 hover:text-red-500 transition underline ml-auto">
                            Withdraw Application
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
                        Apply Now →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Job meta badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {JOB_TYPE_LABELS[job.job_type]}
                </span>
                {job.package_lpa && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    💰 {job.package_lpa} LPA
                  </span>
                )}
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
                  👥 {job.vacancy_count} vacanc{job.vacancy_count > 1 ? 'ies' : 'y'}
                </span>
                <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  🎓 CGPA ≥ {job.min_cgpa}
                </span>
                {job.last_date_to_apply && (
                  <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                    ⏰ Deadline: {new Date(job.last_date_to_apply).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Allowed branches */}
              {job.allowed_branches && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Branches:</span>
                  {job.allowed_branches.split(',').map(b => (
                    <span key={b}
                      className="text-xs bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-full uppercase">
                      {b.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Form — appears when student clicks Apply Now */}
        {showForm && !appStatus && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
            <h3 className="font-semibold text-slate-700 mb-3">
              ✍️ Apply for <span className="text-indigo-600">{job.title}</span>
            </h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Cover Letter <span className="text-slate-300 font-normal">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="Tell the recruiter why you're a great fit for this role..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                Cancel
              </button>
              <button onClick={handleApply} disabled={applying}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60">
                {applying ? 'Submitting...' : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="grid grid-cols-1 gap-5">

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">
              About the Role
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">
                Responsibilities
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {job.responsibilities}
              </p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">
                Requirements
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {job.requirements}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}