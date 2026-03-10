import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { getAllStudents }                     from '../api/auth';
import { useAuth }                           from '../context/AuthContext';

const BRANCHES = [
  { value: '',           label: 'All Branches' },
  { value: 'cs',         label: 'Computer Science' },
  { value: 'it',         label: 'Information Technology' },
  { value: 'entc',       label: 'Electronics & Telecom' },
  { value: 'mech',       label: 'Mechanical' },
  { value: 'civil',      label: 'Civil' },
  { value: 'electrical', label: 'Electrical' },
];

const BRANCH_LABELS = {
  cs: 'CS', it: 'IT', entc: 'ENTC',
  mech: 'Mech', civil: 'Civil', electrical: 'Electrical',
};

export default function BrowseStudents() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState('');

  // Filter state
  const [search,    setSearch]    = useState('');
  const [branch,    setBranch]    = useState('');
  const [minCgpa,   setMinCgpa]   = useState('');
  const [maxCgpa,   setMaxCgpa]   = useState('');
  const [skill,     setSkill]     = useState('');
  const [year,      setYear]      = useState('');

  // Selected student for side panel
  const [selected,  setSelected]  = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      navigate('/dashboard');
      return;
    }
    fetchStudents();
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search)  params.append('search',         search);
    if (branch)  params.append('branch',         branch);
    if (minCgpa) params.append('min_cgpa',       minCgpa);
    if (maxCgpa) params.append('max_cgpa',       maxCgpa);
    if (skill)   params.append('skill',          skill);
    if (year)    params.append('year_of_passing', year);
    const q = params.toString();
    return q ? `?${q}` : '';
  };

  const fetchStudents = async (query = '') => {
    setLoading(true);
    try {
      const res = await getAllStudents(query);
      setStudents(res.data.students);
    } catch {
      setMessage('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => fetchStudents(buildQuery());

  const handleReset = () => {
    setSearch(''); setBranch(''); setMinCgpa('');
    setMaxCgpa(''); setSkill(''); setYear('');
    fetchStudents('');
  };

  // Skills as chips
  const parseSkills = (skills) =>
    skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3
                      flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
          <span className="ml-2 text-xs bg-violet-100 text-violet-700
                           font-semibold px-2 py-0.5 rounded-full">Recruiter</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/jobs/manage')}
            className="text-sm text-violet-600 hover:underline font-medium">
            My Jobs
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm bg-slate-100 hover:bg-slate-200
                       text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Browse Students</h1>
          <p className="text-slate-500 text-sm mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* ── Filter Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

            <div className="lg:col-span-2">
              <label className="flabel">Search by Name</label>
              <input type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                placeholder="e.g. Rahul"
                className="finput" />
            </div>

            <div>
              <label className="flabel">Branch</label>
              <select value={branch} onChange={e => setBranch(e.target.value)}
                className="finput">
                {BRANCHES.map(b =>
                  <option key={b.value} value={b.value}>{b.label}</option>
                )}
              </select>
            </div>

            <div>
              <label className="flabel">Min CGPA</label>
              <input type="number" value={minCgpa}
                onChange={e => setMinCgpa(e.target.value)}
                placeholder="e.g. 7.0" step="0.1" min="0" max="10"
                className="finput" />
            </div>

            <div>
              <label className="flabel">Max CGPA</label>
              <input type="number" value={maxCgpa}
                onChange={e => setMaxCgpa(e.target.value)}
                placeholder="e.g. 10.0" step="0.1" min="0" max="10"
                className="finput" />
            </div>

            <div>
              <label className="flabel">Skill</label>
              <input type="text" value={skill}
                onChange={e => setSkill(e.target.value)}
                placeholder="e.g. Python"
                className="finput" />
            </div>

            <div>
              <label className="flabel">Passing Year</label>
              <input type="number" value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="e.g. 2025"
                className="finput" />
            </div>

          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={handleReset}
              className="px-4 py-2 rounded-xl text-sm font-medium
                         bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              ✕ Reset
            </button>
            <button onClick={handleFilter}
              className="px-5 py-2 rounded-xl text-sm font-semibold
                         bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm">
              🔍 Search
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm
                          bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        {/* ── Main Layout: Card Grid + Side Panel ── */}
        <div className={`grid gap-6 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>

          {/* Student Grid */}
          <div className={selected ? 'col-span-2' : 'col-span-1'}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-violet-500
                                  border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Loading students...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border
                              border-slate-100 p-16 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No students found
                </h3>
                <p className="text-slate-400 text-sm">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isSelected={selected?.id === student.id}
                    onClick={() =>
                      setSelected(selected?.id === student.id ? null : student)
                    }
                    parseSkills={parseSkills}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Side Detail Panel ── */}
          {selected && (
            <div className="col-span-1">
              <StudentDetailPanel
                student={selected}
                onClose={() => setSelected(null)}
                parseSkills={parseSkills}
                navigate={navigate}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .flabel {
          display: block; font-size: 0.7rem; font-weight: 600;
          color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 0.25rem;
        }
        .finput {
          width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem;
          padding: 0.45rem 0.75rem; font-size: 0.8rem; outline: none;
          background: white; transition: box-shadow 0.15s;
        }
        .finput:focus { box-shadow: 0 0 0 2px #c4b5fd; }
      `}</style>
    </div>
  );
}

/* ── Student Card Component ── */
function StudentCard({ student, isSelected, onClick, parseSkills }) {
  const skills = parseSkills(student.skills).slice(0, 3);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border p-5 cursor-pointer
                  transition hover:shadow-md
                  ${isSelected
                    ? 'border-violet-400 shadow-md ring-2 ring-violet-100'
                    : 'border-slate-100 hover:border-violet-200'}`}>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-violet-50
                        flex items-center justify-center flex-shrink-0 overflow-hidden">
          {student.profile_photo_url
            ? <img src={student.profile_photo_url} alt=""
                   className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-violet-400">
                {student.full_name?.[0]?.toUpperCase()}
              </span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 truncate">
            {student.full_name}
          </h3>
          <p className="text-xs text-slate-500 truncate">{student.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {student.branch && (
              <span className="text-xs bg-violet-50 text-violet-700
                               font-semibold px-2 py-0.5 rounded-full uppercase">
                {student.branch}
              </span>
            )}
            {student.cgpa && (
              <span className="text-xs bg-emerald-50 text-emerald-700
                               font-semibold px-2 py-0.5 rounded-full">
                CGPA {student.cgpa}
              </span>
            )}
            {student.year_of_passing && (
              <span className="text-xs text-slate-400">
                Batch {student.year_of_passing}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills preview */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {skills.map(s => (
            <span key={s}
              className="text-xs bg-slate-100 text-slate-600
                         px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
          {parseSkills(student.skills).length > 3 && (
            <span className="text-xs text-slate-400">
              +{parseSkills(student.skills).length - 3} more
            </span>
          )}
        </div>
      )}

      <p className="text-right text-xs text-violet-500 font-medium mt-2">
        {isSelected ? 'Hide details ↑' : 'View details →'}
      </p>
    </div>
  );
}

/* ── Student Detail Side Panel ── */
function StudentDetailPanel({ student, onClose, parseSkills, navigate }) {
  const skills = parseSkills(student.skills);

  return (
    <div className="bg-white rounded-2xl border border-slate-100
                    shadow-sm sticky top-24 overflow-y-auto max-h-screen pb-8">

      {/* Panel header */}
      <div className="flex justify-between items-center p-5
                      border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Student Profile</h3>
        <button onClick={onClose}
          className="text-slate-400 hover:text-slate-600
                     text-lg font-bold leading-none">
          ×
        </button>
      </div>

      {/* Photo + name */}
      <div className="p-5 text-center border-b border-slate-100">
        <div className="w-20 h-20 rounded-full bg-violet-50
                        mx-auto mb-3 overflow-hidden flex items-center justify-center">
          {student.profile_photo_url
            ? <img src={student.profile_photo_url} alt=""
                   className="w-full h-full object-cover" />
            : <span className="text-3xl font-bold text-violet-300">
                {student.full_name?.[0]?.toUpperCase()}
              </span>
          }
        </div>
        <h3 className="font-bold text-slate-800 text-lg">{student.full_name}</h3>
        <p className="text-sm text-slate-500">{student.email}</p>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-lg font-bold text-violet-600">{student.cgpa || '—'}</p>
            <p className="text-xs text-slate-400">CGPA</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-lg font-bold text-slate-700 uppercase">
              {student.branch || '—'}
            </p>
            <p className="text-xs text-slate-400">Branch</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-lg font-bold text-slate-700">
              {student.year_of_passing || '—'}
            </p>
            <p className="text-xs text-slate-400">Batch</p>
          </div>
        </div>
      </div>

      {/* About */}
      {student.about && (
        <div className="p-5 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400
                         uppercase tracking-wide mb-2">About</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {student.about}
          </p>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="p-5 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400
                         uppercase tracking-wide mb-2">Skills</h4>
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

      {/* Contact & Links */}
      <div className="p-5 border-b border-slate-100 space-y-2">
        <h4 className="text-xs font-semibold text-slate-400
                       uppercase tracking-wide mb-2">Contact & Links</h4>
        {student.phone && (
          <p className="text-sm text-slate-600 flex items-center gap-2">
            📞 {student.phone}
          </p>
        )}
        {student.linkedin_url && (
          <a href={student.linkedin_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            🔗 LinkedIn Profile
          </a>
        )}
        {student.github_url && (
          <a href={student.github_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-sm text-slate-700 hover:underline">
            💻 GitHub Profile
          </a>
        )}
      </div>

      {/* Resume */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-slate-400
                       uppercase tracking-wide mb-3">Resume</h4>
        {student.resume_url ? (
          <a href={student.resume_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100
                       text-emerald-700 font-semibold text-sm px-4 py-2.5
                       rounded-xl transition w-full justify-center">
            📄 View Resume (PDF)
          </a>
        ) : (
          <p className="text-xs text-slate-400 italic text-center">
            No resume uploaded
          </p>
        )}
      </div>
    </div>
  );
}