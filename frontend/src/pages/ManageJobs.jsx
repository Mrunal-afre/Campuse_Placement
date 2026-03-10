import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyJobs, deleteJob, updateJob } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const JOB_TYPE_LABELS = {
  full_time: 'Full Time', internship: 'Internship',
  part_time: 'Part Time', contract: 'Contract',
};

export default function ManageJobs() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || user.role !== 'recruiter') { navigate('/dashboard'); return; }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getMyJobs();
      setJobs(res.data.jobs);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load jobs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await updateJob(job.id, { is_active: !job.is_active });
      setJobs(jobs.map(j => j.id === job.id
        ? { ...j, is_active: !j.is_active } : j));
    } catch {
      setMessage({ type: 'error', text: 'Failed to update job status.' });
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      setMessage({ type: 'success', text: '✅ Job deleted.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete job.' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Loading jobs...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/jobs/post')}
            className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg font-medium transition">
            + Post New Job
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Job Postings</h1>
            <p className="text-slate-500 text-sm mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No jobs posted yet</h3>
            <p className="text-slate-400 text-sm mb-6">Post your first job to start receiving applications from students.</p>
            <button onClick={() => navigate('/jobs/post')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
              + Post First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        job.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {job.is_active ? '🟢 Active' : '⚫ Inactive'}
                      </span>
                      <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2.5 py-1 rounded-full">
                        {JOB_TYPE_LABELS[job.job_type]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                      <span>📍 {job.location}</span>
                      {job.package_lpa && <span>💰 {job.package_lpa} LPA</span>}
                      <span>👥 {job.vacancy_count} vacanc{job.vacancy_count > 1 ? 'ies' : 'y'}</span>
                      <span>🎓 Min CGPA: {job.min_cgpa}</span>
                      {job.last_date_to_apply && (
                        <span>📅 Deadline: {new Date(job.last_date_to_apply).toLocaleDateString()}</span>
                      )}
                    </div>

                    {job.allowed_branches && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.allowed_branches.split(',').map(b => (
                          <span key={b}
                            className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full uppercase">
                            {b.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(job)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                        job.is_active
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}>
                      {job.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                   <button
  onClick={() => navigate(`/jobs/applicants/${job.id}`)}
  className="text-xs font-medium px-3 py-1.5 rounded-lg
             bg-blue-50 hover:bg-blue-100 text-blue-700 transition">
  View Applicants
</button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}