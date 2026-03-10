import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJob } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const BRANCHES = [
  { value: 'cs',          label: 'Computer Science' },
  { value: 'it',          label: 'Information Technology' },
  { value: 'entc',        label: 'Electronics & Telecom' },
  { value: 'mech',        label: 'Mechanical' },
  { value: 'civil',       label: 'Civil' },
  { value: 'electrical',  label: 'Electrical' },
];

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', responsibilities: '',
    requirements: '', job_type: 'full_time', location: '',
    package_lpa: '', min_cgpa: '0', vacancy_count: '1',
    last_date_to_apply: '', allowed_branches: [],
  });

  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleBranch = (val) => {
    const current = form.allowed_branches;
    setForm({
      ...form,
      allowed_branches: current.includes(val)
        ? current.filter(b => b !== val)
        : [...current, val],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        ...form,
        // Join selected branches as comma-separated string
        allowed_branches: form.allowed_branches.join(','),
      };
      await postJob(payload);
      setMessage({ type: 'success', text: '✅ Job posted successfully!' });
      setTimeout(() => navigate('/jobs/manage'), 1500);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.title?.[0] || d?.min_cgpa?.[0] ||
                  d?.vacancy_count?.[0] || d?.error || 'Failed to post job.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/jobs/manage')}
            className="text-sm text-violet-600 hover:underline font-medium">
            My Job Postings
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Post a New Job</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill in the details below. Students matching your criteria will see this job.
          </p>
        </div>

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Basic Information
            </h2>

            <div>
              <label className="label">Job Title *</label>
              <input type="text" name="title" value={form.title}
                onChange={handleChange} required
                placeholder="e.g. Software Engineer, Data Analyst"
                className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Job Type *</label>
                <select name="job_type" value={form.job_type}
                  onChange={handleChange} className="input-field">
                  <option value="full_time">Full Time</option>
                  <option value="internship">Internship</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="label">Location *</label>
                <input type="text" name="location" value={form.location}
                  onChange={handleChange} required
                  placeholder="e.g. Pune / Remote / Bangalore"
                  className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">Job Description *</label>
              <textarea name="description" value={form.description}
                onChange={handleChange} required rows={4}
                placeholder="Describe the role, the team, and what the candidate will be working on..."
                className="input-field resize-none" />
            </div>

            <div>
              <label className="label">Responsibilities</label>
              <textarea name="responsibilities" value={form.responsibilities}
                onChange={handleChange} rows={3}
                placeholder="List the key day-to-day responsibilities..."
                className="input-field resize-none" />
            </div>

            <div>
              <label className="label">Requirements</label>
              <textarea name="requirements" value={form.requirements}
                onChange={handleChange} rows={3}
                placeholder="List required skills, technologies, soft skills..."
                className="input-field resize-none" />
            </div>
          </div>

          {/* Compensation & Vacancies */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Compensation & Vacancies
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Package (LPA)</label>
                <input type="number" name="package_lpa" value={form.package_lpa}
                  onChange={handleChange} step="0.1" min="0"
                  placeholder="e.g. 6.5"
                  className="input-field" />
              </div>
              <div>
                <label className="label">No. of Vacancies *</label>
                <input type="number" name="vacancy_count" value={form.vacancy_count}
                  onChange={handleChange} required min="1"
                  className="input-field" />
              </div>
              <div>
                <label className="label">Last Date to Apply</label>
                <input type="date" name="last_date_to_apply"
                  value={form.last_date_to_apply} onChange={handleChange}
                  className="input-field" />
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Eligibility Criteria
            </h2>
            <p className="text-xs text-slate-400">
              Only students meeting these criteria will see this job posting.
            </p>

            <div>
              <label className="label">Minimum CGPA Required</label>
              <input type="number" name="min_cgpa" value={form.min_cgpa}
                onChange={handleChange} step="0.1" min="0" max="10"
                placeholder="0 = no minimum"
                className="input-field" />
              <p className="text-xs text-slate-400 mt-1">
                Set to 0 if there is no CGPA requirement.
              </p>
            </div>

            <div>
              <label className="label">Allowed Branches</label>
              <p className="text-xs text-slate-400 mb-2">
                Select which branches can apply. Leave all unchecked = all branches allowed.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {BRANCHES.map(b => (
                  <label key={b.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition ${
                      form.allowed_branches.includes(b.value)
                        ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200'
                    }`}>
                    <input type="checkbox" className="hidden"
                      checked={form.allowed_branches.includes(b.value)}
                      onChange={() => toggleBranch(b.value)} />
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                      form.allowed_branches.includes(b.value)
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-slate-300'
                    }`}>
                      {form.allowed_branches.includes(b.value) && '✓'}
                    </span>
                    {b.label}
                  </label>
                ))}
              </div>
              {form.allowed_branches.length === 0 && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  ✅ All branches are eligible
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate('/jobs/manage')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition disabled:opacity-60">
              {saving ? 'Posting...' : '🚀 Post Job'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600;
                 color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
                 margin-bottom: 0.375rem; }
        .input-field { width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem;
                       padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
                       transition: box-shadow 0.15s; background: white; }
        .input-field:focus { box-shadow: 0 0 0 2px #c4b5fd; }
      `}</style>
    </div>
  );
}