import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJob } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const BRANCHES = [
  { value: 'BCA',         label: 'Bachelor of Computer Application' },
  { value: 'cs',          label: 'Computer Science' },
  { value: 'it',          label: 'Information Technology' },
  { value: 'entc',        label: 'Electronics & Telecom' },
  { value: 'mech',        label: 'Mechanical' },
  { value: 'civil',       label: 'Civil' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'BBA',         label: 'Business Management' },
];

const CITIES = [
  'Agra','Ahmedabad','Ajmer','Aligarh','Allahabad','Amravati',
  'Amritsar','Aurangabad','Bangalore','Bareilly','Belgaum',
  'Bhilai','Bhopal','Bhubaneswar','Chandigarh','Chennai',
  'Coimbatore','Cuttack','Dehradun','Delhi','Dhanbad',
  'Faridabad','Ghaziabad','Goa','Gorakhpur','Gurgaon',
  'Guwahati','Gwalior','Hubli','Hyderabad','Indore',
  'Jabalpur','Jaipur','Jalandhar','Jammu','Jamshedpur',
  'Jodhpur','Kanpur','Kochi','Kolkata','Kota',
  'Kozhikode','Lucknow','Ludhiana','Madurai','Mangalore',
  'Meerut','Mumbai','Mysore','Nagpur','Nashik',
  'Navi Mumbai','Noida','Patna','Pune','Raipur',
  'Rajkot','Ranchi','Remote','Srinagar','Surat',
  'Thane','Thiruvananthapuram','Tiruchirappalli','Udaipur',
  'Vadodara','Varanasi','Vijayawada','Visakhapatnam','Warangal',
];

// ── CGPA Classification options ─────────────────────────────────────────────
const CGPA_CLASSES = [
  {
    value:    '',
    label:    'No Minimum (All students eligible)',
    min_cgpa: '0',
    color:    'border-slate-200 text-slate-600',
    active:   'bg-slate-700 border-slate-700 text-white',
    badge:    '',
  },
  {
    value:    'third_class',
    label:    'Third Class',
    min_cgpa: '7.0',
    desc:     'CGPA > 7.0',
    color:    'border-slate-200 text-slate-600',
    active:   'bg-slate-600 border-slate-600 text-white',
    badge:    'bg-slate-100 text-slate-600',
  },
  {
    value:    'second_class',
    label:    'Second Class',
    min_cgpa: '8.0',
    desc:     'CGPA > 8.0',
    color:    'border-blue-200 text-blue-700',
    active:   'bg-blue-600 border-blue-600 text-white',
    badge:    'bg-blue-50 text-blue-700',
  },
  {
    value:    'first_class',
    label:    'First Class',
    min_cgpa: '9.0',
    desc:     'CGPA > 9.0',
    color:    'border-emerald-200 text-emerald-700',
    active:   'bg-emerald-600 border-emerald-600 text-white',
    badge:    'bg-emerald-50 text-emerald-700',
  },
  {
    value:    'distinction',
    label:    'Distinction',
    min_cgpa: '9.5',
    desc:     'CGPA > 9.5',
    color:    'border-yellow-300 text-yellow-700',
    active:   'bg-yellow-500 border-yellow-500 text-white',
    badge:    'bg-yellow-50 text-yellow-700',
  },
];

// ── Location Autocomplete ────────────────────────────────────────────────────
function LocationInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showList,    setShowList]    = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    setHighlighted(-1);
    if (!val.trim()) { setSuggestions([]); setShowList(false); return; }
    const primary   = CITIES.filter(c => c.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8);
    const secondary = CITIES.filter(c =>
      !c.toLowerCase().startsWith(val.toLowerCase()) &&
      c.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 4);
    setSuggestions([...primary, ...secondary]);
    setShowList(true);
  };

  const handleSelect = (city) => {
    onChange(city); setSuggestions([]); setShowList(false); setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!showList || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(p => p < suggestions.length - 1 ? p + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(p => p > 0 ? p - 1 : suggestions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) handleSelect(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const highlight = (city, query) => {
    const idx = city.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return city;
    return (
      <>
        {city.slice(0, idx)}
        <span className="font-bold text-violet-700">
          {city.slice(idx, idx + query.length)}
        </span>
        {city.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input type="text" value={value} onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => value && suggestions.length > 0 && setShowList(true)}
        required autoComplete="off"
        placeholder="e.g. Pune / Remote / Bangalore"
        className="input-field"
      />
      {showList && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border
                       border-slate-200 rounded-xl shadow-lg overflow-hidden
                       max-h-56 overflow-y-auto">
          {suggestions.map((city, idx) => (
            <li key={city} onMouseDown={() => handleSelect(city)}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer
                          text-sm transition
                          ${highlighted === idx
                            ? 'bg-violet-50 text-violet-800'
                            : 'text-slate-700 hover:bg-slate-50'}`}>
              <span className="text-slate-400">📍</span>
              <span>{highlight(city, value)}</span>
            </li>
          ))}
        </ul>
      )}
      {showList && suggestions.length === 0 && value.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border
                        border-slate-200 rounded-xl shadow-lg px-4 py-3
                        text-sm text-slate-400">
          No matching city — you can still type a custom location.
        </div>
      )}
    </div>
  );
}

// ── Main PostJob ─────────────────────────────────────────────────────────────
export default function PostJob() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', responsibilities: '',
    requirements: '', job_type: 'full_time', location: '',
    package_lpa: '', min_cgpa: '0', vacancy_count: '1',
    last_date_to_apply: '', allowed_branches: [],
    allow_backlog: '',
  });

  // CGPA class selector — separate UI state, sets form.min_cgpa automatically
  const [cgpaClass, setCgpaClass] = useState('');

  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCgpaClassSelect = (cls) => {
    setCgpaClass(cls.value);
    setForm(prev => ({ ...prev, min_cgpa: cls.min_cgpa }));
  };

  const toggleBranch = (val) => {
    const cur = form.allowed_branches;
    setForm({
      ...form,
      allowed_branches: cur.includes(val)
        ? cur.filter(b => b !== val)
        : [...cur, val],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        ...form,
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

  const selectedClass = CGPA_CLASSES.find(c => c.value === cgpaClass);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex
                      justify-between items-center sticky top-0 z-10 shadow-sm">
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
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700
                       px-3 py-1.5 rounded-lg font-medium transition">
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

          {/* ── Basic Info ── */}
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-6 space-y-4">
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
                <LocationInput
                  value={form.location}
                  onChange={(val) => setForm({ ...form, location: val })}
                />
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

          {/* ── Compensation & Vacancies ── */}
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Compensation & Vacancies
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Package (LPA)</label>
                <input type="number" name="package_lpa" value={form.package_lpa}
                  onChange={handleChange} step="0.1" min="0"
                  placeholder="e.g. 6.5" className="input-field" />
              </div>
              <div>
                <label className="label">No. of Vacancies *</label>
                <input type="number" name="vacancy_count" value={form.vacancy_count}
                  onChange={handleChange} required min="1" className="input-field" />
              </div>
              <div>
                <label className="label">Last Date to Apply</label>
                <input type="date" name="last_date_to_apply"
                  value={form.last_date_to_apply} onChange={handleChange}
                  className="input-field" />
              </div>
            </div>
          </div>

          {/* ── Eligibility ── */}
          <div className="bg-white rounded-2xl shadow-sm border
                          border-slate-100 p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                Eligibility Criteria
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Only students meeting these criteria will see this job posting.
              </p>
            </div>

            {/* ── CGPA Classification Selector ── */}
            <div>
              <label className="label">CGPA Requirement</label>
              <p className="text-xs text-slate-400 mb-3">
                Select the minimum academic class required for this job.
              </p>

              {/* Classification cards */}
              <div className="grid grid-cols-1 gap-2">
                {CGPA_CLASSES.map(cls => (
                  <button key={cls.value} type="button"
                    onClick={() => handleCgpaClassSelect(cls)}
                    className={`flex items-center justify-between px-4 py-3
                                rounded-xl border-2 text-sm font-semibold
                                transition text-left
                                ${cgpaClass === cls.value
                                  ? cls.active
                                  : `bg-white ${cls.color} hover:shadow-sm`
                                }`}>
                    <div className="flex items-center gap-3">
                      {/* Selection dot */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center
                                       justify-center flex-shrink-0
                                       ${cgpaClass === cls.value
                                         ? 'border-white'
                                         : 'border-slate-300'}`}>
                        {cgpaClass === cls.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>

                      <div>
                        <span className="font-bold">
                          {cls.value === ''
                            ? '🔓 No Minimum'
                            : cls.value === 'third_class'  ? '🥉 Third Class'
                            : cls.value === 'second_class' ? '🥈 Second Class'
                            : cls.value === 'first_class'  ? '🥇 First Class'
                            : '🏅 Distinction'}
                        </span>
                        {cls.desc && (
                          <span className={`ml-2 text-xs font-normal
                                            ${cgpaClass === cls.value
                                              ? 'opacity-80'
                                              : 'text-slate-400'}`}>
                            ({cls.desc})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Min CGPA pill */}
                    {cls.value !== '' && (
                      <span className={`text-xs px-2.5 py-1 rounded-full
                                         font-semibold flex-shrink-0
                                         ${cgpaClass === cls.value
                                           ? 'bg-white/20'
                                           : cls.badge}`}>
                        Min CGPA: {cls.min_cgpa}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Live summary */}
              {selectedClass && selectedClass.value !== '' && (
                <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium
                                  flex items-center gap-2 border
                                  ${selectedClass.badge} border-current/20`}>
                  ✅ Only students with CGPA &gt; {selectedClass.min_cgpa}
                  ({selectedClass.label}) can apply to this job.
                </div>
              )}
              {selectedClass && selectedClass.value === '' && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm font-medium
                                bg-slate-50 text-slate-600 border border-slate-200">
                  🔓 All students are eligible regardless of CGPA.
                </div>
              )}

              {/* Manual override */}
              <div className="mt-3">
                <label className="label">Or enter exact Min CGPA manually</label>
                <input type="number" name="min_cgpa" value={form.min_cgpa}
                  onChange={e => {
                    handleChange(e);
                    setCgpaClass(''); // clear class selection when typing manually
                  }}
                  step="0.1" min="0" max="10"
                  placeholder="e.g. 7.5"
                  className="input-field" />
                <p className="text-xs text-slate-400 mt-1">
                  Manually entering a value will clear the class selection above.
                </p>
              </div>
            </div>

            {/* ── Active Backlog Policy ── */}
            <div>
              <label className="label">Allow Students with Active Backlog?</label>
              <p className="text-xs text-slate-400 mb-3">
                Choose whether students with an active backlog can apply.
              </p>
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => setForm({ ...form, allow_backlog: 'true' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold
                              border-2 transition flex items-center justify-center gap-2
                              ${form.allow_backlog === 'true'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                              }`}>
                  <span>⚠️</span> Yes, allowed
                </button>
                <button type="button"
                  onClick={() => setForm({ ...form, allow_backlog: 'false' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold
                              border-2 transition flex items-center justify-center gap-2
                              ${form.allow_backlog === 'false'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                              }`}>
                  <span>✅</span> No backlog only
                </button>
              </div>
              {form.allow_backlog === 'true' && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  ⚠️ Students with active backlogs can apply.
                </p>
              )}
              {form.allow_backlog === 'false' && (
                <p className="text-xs text-emerald-600 font-medium mt-2">
                  ✅ Only students with no active backlog can apply.
                </p>
              )}
            </div>

            {/* ── Branches ── */}
            <div>
              <label className="label">Allowed Branches</label>
              <p className="text-xs text-slate-400 mb-2">
                Leave all unchecked = all branches allowed.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {BRANCHES.map(b => (
                  <label key={b.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl
                                border cursor-pointer text-sm transition ${
                      form.allowed_branches.includes(b.value)
                        ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200'
                    }`}>
                    <input type="checkbox" className="hidden"
                      checked={form.allowed_branches.includes(b.value)}
                      onChange={() => toggleBranch(b.value)} />
                    <span className={`w-4 h-4 rounded border-2 flex items-center
                                      justify-center text-xs flex-shrink-0 ${
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

          {/* ── Submit ── */}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate('/jobs/manage')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium
                         bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-8 py-2.5 rounded-xl text-sm font-semibold
                         bg-violet-600 hover:bg-violet-700 text-white
                         shadow-sm transition disabled:opacity-60">
              {saving ? 'Posting...' : '🚀 Post Job'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .label {
          display: block; font-size: 0.75rem; font-weight: 600;
          color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 0.375rem;
        }
        .input-field {
          width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem;
          padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
          transition: box-shadow 0.15s; background: white;
        }
        .input-field:focus { box-shadow: 0 0 0 2px #c4b5fd; }
      `}</style>
    </div>
  );
}
