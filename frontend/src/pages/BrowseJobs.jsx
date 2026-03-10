import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableJobs } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const JOB_TYPE_COLORS = {
  full_time:  'bg-blue-50 text-blue-700',
  internship: 'bg-amber-50 text-amber-700',
  part_time:  'bg-purple-50 text-purple-700',
  contract:   'bg-pink-50 text-pink-700',
};

const JOB_TYPE_LABELS = {
  full_time: 'Full Time', internship: 'Internship',
  part_time: 'Part Time', contract: 'Contract',
};

export default function BrowseJobs() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [jobs,      setJobs]      = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [typeFilter,setTypeFilter]= useState('');
  const [message,   setMessage]   = useState('');

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return; }
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = jobs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company_name?.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter(j => j.job_type === typeFilter);
    setFiltered(result);
  }, [search, typeFilter, jobs]);

  const fetchJobs = async () => {
    try {
      const res = await getAvailableJobs();
      setJobs(res.data.jobs);
      setFiltered(res.data.jobs);
    } catch {
      setMessage('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Finding jobs for you...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/profile')}
            className="text-sm text-indigo-600 hover:underline font-medium">My Profile</button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Available Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Showing <strong className="text-indigo-600">{filtered.length}</strong> job{filtered.length !== 1 ? 's' : ''} matching your profile
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by title, company, location..."
            className="flex-1 min-w-64 border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="internship">Internship</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
          </select>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No jobs found</h3>
            <p className="text-slate-400 text-sm">
              {jobs.length === 0
                ? 'No jobs are available right now. Check back soon!'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => (
              <div key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md hover:border-indigo-100 transition cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}>

                <div className="flex items-start gap-4">
                  {/* Company logo or placeholder */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    {job.company_logo
                      ? <img src={job.company_logo} alt="logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-2xl">🏢</span>}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {job.company_name || 'Company'} · {job.location}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_TYPE_COLORS[job.job_type]}`}>
                        {JOB_TYPE_LABELS[job.job_type]}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                      {job.package_lpa && (
                        <span className="font-semibold text-emerald-600">💰 {job.package_lpa} LPA</span>
                      )}
                      <span>👥 {job.vacancy_count} vacanc{job.vacancy_count > 1 ? 'ies' : 'y'}</span>
                      <span>🎓 CGPA ≥ {job.min_cgpa}</span>
                      {job.last_date_to_apply && (
                        <span className="text-red-500">
                          ⏰ Apply by {new Date(job.last_date_to_apply).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}