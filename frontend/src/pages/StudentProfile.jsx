import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const BRANCHES = [
  { value: 'cs',          label: 'Computer Science' },
  { value: 'it',          label: 'Information Technology' },
  { value: 'entc',        label: 'Electronics & Telecom' },
  { value: 'mech',        label: 'Mechanical' },
  { value: 'civil',       label: 'Civil' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'other',       label: 'Other' },
];

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const photoRef  = useRef();
  const resumeRef = useRef();

  const [profile,  setProfile]  = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ type: '', text: '' });
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    phone: '', date_of_birth: '', gender: '',
    branch: '', year_of_passing: '', cgpa: '',
    skills: '', about: '', linkedin_url: '', github_url: '',
  });

  const [files, setFiles] = useState({ profile_photo: null, resume: null });
  const [previews, setPreviews] = useState({ photo: null });

  // Load profile on mount
  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      setProfile(res.data);
      setForm({
        phone:           res.data.phone           || '',
        date_of_birth:   res.data.date_of_birth   || '',
        gender:          res.data.gender          || '',
        branch:          res.data.branch          || '',
        year_of_passing: res.data.year_of_passing || '',
        cgpa:            res.data.cgpa            || '',
        skills:          res.data.skills          || '',
        about:           res.data.about           || '',
        linkedin_url:    res.data.linkedin_url    || '',
        github_url:      res.data.github_url      || '',
      });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files: f } = e.target;
    setFiles({ ...files, [name]: f[0] });
    if (name === 'profile_photo' && f[0]) {
      setPreviews({ ...previews, photo: URL.createObjectURL(f[0]) });
    }
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const existing = form.skills ? form.skills.split(',').map(s => s.trim()) : [];
      if (!existing.includes(skillInput.trim())) {
        setForm({ ...form, skills: [...existing, skillInput.trim()].join(',') });
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    const updated = form.skills.split(',').filter(s => s.trim() !== skillToRemove);
    setForm({ ...form, skills: updated.join(',') });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.resume)        formData.append('resume',        files.resume);

      const res = await updateMyProfile(formData);
      setProfile(res.data.profile);
      setEditing(false);
      setMessage({ type: 'success', text: '✅ Profile saved successfully!' });
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.cgpa?.[0] || d?.phone?.[0] || 'Failed to save profile.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const skills = form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const completionFields = ['phone','gender','branch','year_of_passing','cgpa','skills','about'];
  const filled = completionFields.filter(f => form[f]).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {user?.full_name}
          </span>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-indigo-600 hover:underline font-medium">
            Dashboard
          </button>
          <button onClick={handleLogout}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Flash Message ── */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL — Photo + Summary ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">

              {/* Photo */}
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-indigo-100 mx-auto ring-4 ring-indigo-50">
                  {(previews.photo || profile?.profile_photo) ? (
                    <img
                      src={previews.photo || `http://localhost:8000${profile.profile_photo}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-indigo-300">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {editing && (
                  <button onClick={() => photoRef.current.click()}
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center hover:bg-indigo-700 shadow">
                    📷
                  </button>
                )}
                <input ref={photoRef} type="file" name="profile_photo"
                  accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <h2 className="text-xl font-bold text-slate-800">{user?.full_name}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>

              {form.branch && (
                <span className="inline-block mt-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {BRANCHES.find(b => b.value === form.branch)?.label}
                </span>
              )}

              {form.cgpa && (
                <div className="mt-3 bg-slate-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-indigo-600">{form.cgpa}</p>
                  <p className="text-xs text-slate-400 font-medium">CGPA</p>
                </div>
              )}

              {/* Profile Completion Bar */}
              <div className="mt-4 text-left">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Profile Completion</span>
                  <span className="font-semibold text-indigo-600">{completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  ></div>
                </div>
                {completion < 100 && (
                  <p className="text-xs text-slate-400 mt-1">Complete your profile to attract recruiters</p>
                )}
              </div>
            </div>

            {/* Links Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Links</h3>
              {!editing ? (
                <div className="space-y-2">
                  {form.linkedin_url ? (
                    <a href={form.linkedin_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <span>🔗</span> LinkedIn
                    </a>
                  ) : <p className="text-xs text-slate-400">No LinkedIn added</p>}
                  {form.github_url ? (
                    <a href={form.github_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-700 hover:underline">
                      <span>💻</span> GitHub
                    </a>
                  ) : <p className="text-xs text-slate-400">No GitHub added</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="url" name="linkedin_url" value={form.linkedin_url}
                    onChange={handleChange} placeholder="LinkedIn URL"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <input type="url" name="github_url" value={form.github_url}
                    onChange={handleChange} placeholder="GitHub URL"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              )}
            </div>

            {/* Resume Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Resume</h3>
              {profile?.resume ? (
                <a href={`http://localhost:8000${profile.resume}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-600 font-medium hover:underline">
                  📄 View Current Resume
                </a>
              ) : (
                <p className="text-xs text-slate-400">No resume uploaded</p>
              )}
              {editing && (
                <button onClick={() => resumeRef.current.click()}
                  className="mt-3 w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition">
                  {files.resume ? `✅ ${files.resume.name}` : '+ Upload New Resume (PDF)'}
                </button>
              )}
              <input ref={resumeRef} type="file" name="resume"
                accept=".pdf" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* ── RIGHT PANEL — Details ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Header row */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setMessage({type:'',text:''}); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">

                <Field label="Phone Number" editing={editing}>
                  {editing
                    ? <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="10-digit mobile number"
                        className="input-style" />
                    : <Value>{form.phone || '—'}</Value>}
                </Field>

                <Field label="Date of Birth" editing={editing}>
                  {editing
                    ? <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                        className="input-style" />
                    : <Value>{form.date_of_birth || '—'}</Value>}
                </Field>

                <Field label="Gender" editing={editing}>
                  {editing
                    ? <select name="gender" value={form.gender} onChange={handleChange} className="input-style">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    : <Value className="capitalize">{form.gender || '—'}</Value>}
                </Field>

                <Field label="Branch" editing={editing}>
                  {editing
                    ? <select name="branch" value={form.branch} onChange={handleChange} className="input-style">
                        <option value="">Select Branch</option>
                        {BRANCHES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    : <Value>{BRANCHES.find(b => b.value === form.branch)?.label || '—'}</Value>}
                </Field>

                <Field label="Year of Passing" editing={editing}>
                  {editing
                    ? <input type="number" name="year_of_passing" value={form.year_of_passing}
                        onChange={handleChange} placeholder="e.g. 2025" min="2020" max="2030"
                        className="input-style" />
                    : <Value>{form.year_of_passing || '—'}</Value>}
                </Field>

                <Field label="CGPA (out of 10)" editing={editing}>
                  {editing
                    ? <input type="number" name="cgpa" value={form.cgpa} onChange={handleChange}
                        placeholder="e.g. 8.75" step="0.01" min="0" max="10"
                        className="input-style" />
                    : <Value>{form.cgpa || '—'}</Value>}
                </Field>
              </div>
            </div>

            {/* About Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">About Me</h3>
              {editing
                ? <textarea name="about" value={form.about} onChange={handleChange} rows={4}
                    placeholder="Write a short bio about yourself, your interests, and career goals..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                : <p className="text-slate-600 text-sm leading-relaxed">
                    {form.about || <span className="text-slate-400 italic">No bio added yet. Tell recruiters about yourself!</span>}
                  </p>}
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Skills</h3>

              {editing && (
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="Type a skill and press Enter (e.g. Python, React, MySQL)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
                />
              )}

              <div className="flex flex-wrap gap-2">
                {skills.length > 0
                  ? skills.map(skill => (
                      <span key={skill}
                        className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(skill)}
                            className="text-indigo-400 hover:text-red-500 font-bold leading-none">×</button>
                        )}
                      </span>
                    ))
                  : <p className="text-slate-400 text-sm italic">No skills added yet</p>
                }
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Inline styles as a style tag */}
      <style>{`
        .input-style {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .input-style:focus {
          box-shadow: 0 0 0 2px #a5b4fc;
        }
      `}</style>
    </div>
  );
}

// Helper components to reduce repetition
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Value({ children, className = '' }) {
  return <p className={`text-slate-700 text-sm font-medium ${className}`}>{children}</p>;
}