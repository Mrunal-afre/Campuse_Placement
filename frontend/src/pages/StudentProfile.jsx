import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const BRANCHES = [
  { value: 'BCA',         label: 'Bachelor of Computer Application' },
  { value: 'BBA',         label: 'Business Management' },
  { value: 'cs',          label: 'Computer Science' },
  { value: 'it',          label: 'Information Technology' },
  { value: 'entc',        label: 'Electronics & Telecom' },
  { value: 'mech',        label: 'Mechanical' },
  { value: 'civil',       label: 'Civil' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'other',       label: 'Other' },
];

// CGPA classification helper
const getCgpaClass = (cgpa) => {
  const v = parseFloat(cgpa);
  if (!cgpa || isNaN(v)) return null;
  if (v > 9.5) return { label: 'Distinction',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  if (v > 9.0) return { label: 'First Class',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (v > 8.0) return { label: 'Second Class',  color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (v > 7.0) return { label: 'Third Class',   color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return { label: 'Pass',  color: 'bg-slate-100 text-slate-500 border-slate-200' };
};

// Empty experience entry
const emptyExp = () => ({
  id:          Date.now(),
  exp_type:    'internship',   // 'internship' | 'job'
  company:     '',
  role:        '',
  start_date:  '',
  end_date:    '',
  currently:   false,
  description: '',
});

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const photoRef  = useRef();
  const resumeRef = useRef();

  const [profile,    setProfile]    = useState(null);
  const [editing,    setEditing]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState({ type: '', text: '' });
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    phone: '', date_of_birth: '', gender: '',
    branch: '', year_of_passing: '', cgpa: '',
    skills: '', about: '', linkedin_url: '', github_url: '',
    active_backlog: '',
  });

  // Experience stored as JSON string in backend field
  const [experiences, setExperiences] = useState([]);

  const [files,    setFiles]    = useState({ profile_photo: null, resume: null });
  const [previews, setPreviews] = useState({ photo: null });

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      const d   = res.data;
      setProfile(d);
      setForm({
        phone:           d.phone           || '',
        date_of_birth:   d.date_of_birth   || '',
        gender:          d.gender          || '',
        branch:          d.branch          || '',
        year_of_passing: d.year_of_passing || '',
        cgpa:            d.cgpa            || '',
        skills:          d.skills          || '',
        about:           d.about           || '',
        linkedin_url:    d.linkedin_url    || '',
        github_url:      d.github_url      || '',
        active_backlog:  d.active_backlog !== undefined
                           ? String(d.active_backlog) : '',
      });
      // Parse experiences from JSON string field
      try {
        setExperiences(d.experiences ? JSON.parse(d.experiences) : []);
      } catch {
        setExperiences([]);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const { name, files: f } = e.target;
    setFiles({ ...files, [name]: f[0] });
    if (name === 'profile_photo' && f[0])
      setPreviews({ ...previews, photo: URL.createObjectURL(f[0]) });
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const existing = form.skills ? form.skills.split(',').map(s => s.trim()) : [];
      if (!existing.includes(skillInput.trim()))
        setForm({ ...form, skills: [...existing, skillInput.trim()].join(',') });
      setSkillInput('');
    }
  };

  const removeSkill = (s) => {
    const updated = form.skills.split(',').filter(x => x.trim() !== s);
    setForm({ ...form, skills: updated.join(',') });
  };

  // ── Experience helpers ──────────────────────────────────────
  const addExperience = () =>
    setExperiences(prev => [...prev, emptyExp()]);

  const removeExperience = (id) =>
    setExperiences(prev => prev.filter(e => e.id !== id));

  const updateExp = (id, field, value) =>
    setExperiences(prev =>
      prev.map(e => e.id === id ? { ...e, [field]: value } : e)
    );

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') formData.append(k, v);
      });
      // Save experiences as JSON string
      formData.append('experiences', JSON.stringify(experiences));
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.resume)        formData.append('resume',        files.resume);

      const res = await updateMyProfile(formData);
      setProfile(res.data.profile);
      setEditing(false);
      setMessage({ type: 'success', text: '✅ Profile saved successfully!' });
    } catch (err) {
      const d   = err.response?.data;
      const msg = d?.cgpa?.[0] || d?.phone?.[0] || 'Failed to save profile.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const skills     = form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const cgpaClass  = getCgpaClass(form.cgpa);

  const completionFields = [
    'phone', 'gender', 'branch', 'year_of_passing',
    'cgpa', 'skills', 'about', 'active_backlog',
  ];
  const filled     = completionFields.filter(f => form[f]).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  const backlogLabel = (v) => {
    if (v === 'true'  || v === true)  return '⚠️ Yes';
    if (v === 'false' || v === false) return '✅ No';
    return '—';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500
                        border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex
                      justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.full_name}</span>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-indigo-600 hover:underline font-medium">
            Dashboard
          </button>
          <button onClick={handleLogout}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700
                       px-3 py-1.5 rounded-lg font-medium transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{message.text}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border
                            border-slate-100 p-6 text-center">

              {/* Photo */}
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden
                                bg-indigo-100 mx-auto ring-4 ring-indigo-50">
                  {(previews.photo || profile?.profile_photo_url || profile?.profile_photo) ? (
                    <img
                      src={
                        previews.photo ||
                        profile?.profile_photo_url ||
                        `http://localhost:8000${profile.profile_photo}`
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center
                                    text-4xl font-bold text-indigo-300">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {editing && (
                  <button onClick={() => photoRef.current.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600
                               text-white rounded-full flex items-center
                               justify-center text-sm shadow hover:bg-indigo-700">
                    📷
                  </button>
                )}
              </div>
              <input ref={photoRef} type="file" name="profile_photo"
                accept="image/*" onChange={handleFileChange} className="hidden" />

              <h2 className="font-bold text-slate-800 text-lg">{user?.full_name}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>

              {/* Badges */}
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {form.branch && (
                  <span className="bg-indigo-50 text-indigo-700 text-xs
                                   font-semibold px-3 py-1 rounded-full uppercase">
                    {form.branch}
                  </span>
                )}
                {form.cgpa && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs
                                   font-semibold px-3 py-1 rounded-full">
                    CGPA {form.cgpa}
                  </span>
                )}
              </div>

              {/* CGPA classification badge */}
              {cgpaClass && (
                <div className="mt-2">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full
                                    border inline-block ${cgpaClass.color}`}>
                    🏅 {cgpaClass.label}
                  </span>
                </div>
              )}

              {/* Active Backlog badge */}
              {form.active_backlog !== '' && (
                <div className="mt-2">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full
                                    inline-block border
                                    ${form.active_backlog === 'true'
                                      ? 'bg-red-50 text-red-600 border-red-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                    Active Backlog: {backlogLabel(form.active_backlog)}
                  </span>
                </div>
              )}

              {/* Completion bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Profile Completion</span>
                  <span className="font-semibold text-indigo-600">{completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>

            {/* Links Card */}
            <div className="bg-white rounded-2xl shadow-sm border
                            border-slate-100 p-5 space-y-3">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                Links
              </h3>
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400
                                      uppercase tracking-wide mb-1">LinkedIn URL</label>
                    <input type="url" name="linkedin_url" value={form.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourname"
                      className="input-style" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400
                                      uppercase tracking-wide mb-1">GitHub URL</label>
                    <input type="url" name="github_url" value={form.github_url}
                      onChange={handleChange}
                      placeholder="https://github.com/yourusername"
                      className="input-style" />
                  </div>
                </>
              ) : (
                <>
                  {form.linkedin_url
                    ? <a href={form.linkedin_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600
                                   hover:underline font-medium">
                        🔗 LinkedIn Profile
                      </a>
                    : <p className="text-xs text-slate-400">No LinkedIn added</p>}
                  {form.github_url
                    ? <a href={form.github_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-700
                                   hover:underline font-medium">
                        💻 GitHub Profile
                      </a>
                    : <p className="text-xs text-slate-400">No GitHub added</p>}
                </>
              )}
            </div>

            {/* Resume Card */}
            <div className="bg-white rounded-2xl shadow-sm border
                            border-slate-100 p-5 space-y-3">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                Resume
              </h3>
              {profile?.resume ? (
                <a href={profile?.resume_url || `http://localhost:8000${profile.resume}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-600
                             font-medium hover:underline">
                  📄 View Current Resume
                </a>
              ) : (
                <p className="text-xs text-slate-400">No resume uploaded</p>
              )}
              {editing && (
                <button onClick={() => resumeRef.current.click()}
                  className="mt-2 w-full border-2 border-dashed border-slate-200
                             rounded-xl py-3 text-sm text-slate-500
                             hover:border-indigo-300 hover:text-indigo-500 transition">
                  {files.resume ? `✅ ${files.resume.name}` : '+ Upload New Resume (PDF)'}
                </button>
              )}
              <input ref={resumeRef} type="file" name="resume"
                accept=".pdf" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2
                             rounded-xl text-sm font-semibold transition shadow-sm">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setMessage({ type:'',text:'' }); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2
                               rounded-xl text-sm font-medium transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2
                               rounded-xl text-sm font-semibold transition shadow-sm
                               disabled:opacity-60">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Personal Info ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">

                <Field label="Phone Number">
                  {editing
                    ? <input type="tel" name="phone" value={form.phone}
                        onChange={handleChange} placeholder="10-digit mobile number"
                        className="input-style" />
                    : <Value>{form.phone || '—'}</Value>}
                </Field>

                <Field label="Date of Birth">
                  {editing
                    ? <input type="date" name="date_of_birth" value={form.date_of_birth}
                        onChange={handleChange} className="input-style" />
                    : <Value>{form.date_of_birth || '—'}</Value>}
                </Field>

                <Field label="Gender">
                  {editing
                    ? <select name="gender" value={form.gender}
                        onChange={handleChange} className="input-style">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    : <Value className="capitalize">{form.gender || '—'}</Value>}
                </Field>

                <Field label="Branch">
                  {editing
                    ? <select name="branch" value={form.branch}
                        onChange={handleChange} className="input-style">
                        <option value="">Select Branch</option>
                        {BRANCHES.map(b =>
                          <option key={b.value} value={b.value}>{b.label}</option>
                        )}
                      </select>
                    : <Value>
                        {BRANCHES.find(b => b.value === form.branch)?.label || '—'}
                      </Value>}
                </Field>

                <Field label="Year of Passing">
                  {editing
                    ? <input type="number" name="year_of_passing"
                        value={form.year_of_passing} onChange={handleChange}
                        placeholder="e.g. 2025" min="2020" max="2030"
                        className="input-style" />
                    : <Value>{form.year_of_passing || '—'}</Value>}
                </Field>

                {/* CGPA with live classification */}
                <Field label="CGPA (out of 10)">
                  {editing ? (
                    <div>
                      <input type="number" name="cgpa" value={form.cgpa}
                        onChange={handleChange}
                        placeholder="e.g. 8.75" step="0.01" min="0" max="10"
                        className="input-style" />
                      {getCgpaClass(form.cgpa) && (
                        <span className={`inline-block mt-1.5 text-xs font-bold
                                          px-2.5 py-0.5 rounded-full border
                                          ${getCgpaClass(form.cgpa).color}`}>
                          🏅 {getCgpaClass(form.cgpa).label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Value>{form.cgpa || '—'}</Value>
                      {cgpaClass && (
                        <span className={`inline-block mt-1 text-xs font-bold
                                          px-2.5 py-0.5 rounded-full border
                                          ${cgpaClass.color}`}>
                          🏅 {cgpaClass.label}
                        </span>
                      )}
                    </div>
                  )}
                </Field>

                {/* Active Backlog */}
                <Field label="Active Backlog">
                  {editing ? (
                    <div className="flex gap-3 mt-1">
                      <button type="button"
                        onClick={() => setForm({ ...form, active_backlog: 'true' })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold
                                    border-2 transition
                                    ${form.active_backlog === 'true'
                                      ? 'bg-red-500 border-red-500 text-white'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                                    }`}>
                        ⚠️ Yes
                      </button>
                      <button type="button"
                        onClick={() => setForm({ ...form, active_backlog: 'false' })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold
                                    border-2 transition
                                    ${form.active_backlog === 'false'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                                    }`}>
                        ✅ No
                      </button>
                    </div>
                  ) : (
                    <span className={`inline-block text-sm font-semibold px-3 py-1
                                      rounded-full mt-0.5
                                      ${form.active_backlog === 'true'
                                        ? 'bg-red-50 text-red-600'
                                        : form.active_backlog === 'false'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-slate-400'
                                      }`}>
                      {backlogLabel(form.active_backlog)}
                    </span>
                  )}
                </Field>

              </div>
            </div>

            {/* ── About ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                About Me
              </h3>
              {editing
                ? <textarea name="about" value={form.about} onChange={handleChange} rows={4}
                    placeholder="Write a short bio about yourself, your interests, and career goals..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                : <p className="text-slate-600 text-sm leading-relaxed">
                    {form.about ||
                      <span className="text-slate-400 italic">
                        No bio added yet. Tell recruiters about yourself!
                      </span>}
                  </p>}
            </div>

            {/* ── Skills ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                Skills
              </h3>
              {editing && (
                <input type="text" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="Type a skill and press Enter (e.g. Python, React, MySQL)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3" />
              )}
              <div className="flex flex-wrap gap-2">
                {skills.length > 0
                  ? skills.map(skill => (
                      <span key={skill}
                        className="bg-indigo-50 text-indigo-700 text-xs font-semibold
                                   px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(skill)}
                            className="text-indigo-400 hover:text-red-500 font-bold leading-none">
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  : <p className="text-slate-400 text-sm italic">No skills added yet</p>}
              </div>
            </div>

            {/* ── PREVIOUS EXPERIENCE ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                  💼 Previous Experience
                </h3>
                {editing && (
                  <button type="button" onClick={addExperience}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white
                               px-3 py-1.5 rounded-lg font-semibold transition">
                    + Add Experience
                  </button>
                )}
              </div>

              {/* Empty state */}
              {experiences.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed
                                border-slate-200 rounded-xl">
                  <p className="text-3xl mb-2">💼</p>
                  <p className="text-slate-400 text-sm">
                    {editing
                      ? 'Click "+ Add Experience" to add your work history'
                      : 'No experience added yet'}
                  </p>
                </div>
              )}

              {/* Experience entries */}
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={exp.id}
                    className={`rounded-xl border p-4 transition
                                ${editing
                                  ? 'border-indigo-100 bg-indigo-50/30'
                                  : 'border-slate-100'}`}>

                    {editing ? (
                      /* ── Edit Mode ── */
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-600
                                           uppercase tracking-wide">
                            Experience #{idx + 1}
                          </span>
                          <button type="button" onClick={() => removeExperience(exp.id)}
                            className="text-xs text-red-400 hover:text-red-600
                                       font-semibold transition">
                            ✕ Remove
                          </button>
                        </div>

                        {/* Type toggle */}
                        <div className="flex gap-2">
                          {['internship', 'job'].map(t => (
                            <button key={t} type="button"
                              onClick={() => updateExp(exp.id, 'exp_type', t)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold
                                          border-2 transition capitalize
                                          ${exp.exp_type === t
                                            ? t === 'job'
                                              ? 'bg-blue-600 border-blue-600 text-white'
                                              : 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                          }`}>
                              {t === 'job' ? '💼 Job' : '🎓 Internship'}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="elabel">Company / Organisation *</label>
                            <input type="text" value={exp.company}
                              onChange={e => updateExp(exp.id, 'company', e.target.value)}
                              placeholder="e.g. Google, TCS"
                              className="input-style" />
                          </div>
                          <div>
                            <label className="elabel">Your Role / Designation *</label>
                            <input type="text" value={exp.role}
                              onChange={e => updateExp(exp.id, 'role', e.target.value)}
                              placeholder="e.g. Frontend Developer"
                              className="input-style" />
                          </div>
                          <div>
                            <label className="elabel">Start Date</label>
                            <input type="month" value={exp.start_date}
                              onChange={e => updateExp(exp.id, 'start_date', e.target.value)}
                              className="input-style" />
                          </div>
                          <div>
                            <label className="elabel">End Date</label>
                            <input type="month" value={exp.end_date}
                              disabled={exp.currently}
                              onChange={e => updateExp(exp.id, 'end_date', e.target.value)}
                              className="input-style disabled:opacity-40" />
                            <label className="flex items-center gap-1.5 mt-1
                                              text-xs text-slate-500 cursor-pointer">
                              <input type="checkbox" checked={exp.currently}
                                onChange={e => {
                                  updateExp(exp.id, 'currently', e.target.checked);
                                  if (e.target.checked)
                                    updateExp(exp.id, 'end_date', '');
                                }}
                                className="accent-indigo-600" />
                              Currently working here
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="elabel">Description (optional)</label>
                          <textarea value={exp.description} rows={2}
                            onChange={e => updateExp(exp.id, 'description', e.target.value)}
                            placeholder="Brief description of your role and achievements..."
                            className="input-style resize-none" />
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center
                                         justify-center text-xl flex-shrink-0
                                         ${exp.exp_type === 'job'
                                           ? 'bg-blue-50'
                                           : 'bg-indigo-50'}`}>
                          {exp.exp_type === 'job' ? '💼' : '🎓'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800">
                              {exp.role || '—'}
                            </h4>
                            <span className={`text-xs font-semibold px-2 py-0.5
                                              rounded-full capitalize
                                              ${exp.exp_type === 'job'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-indigo-50 text-indigo-700'}`}>
                              {exp.exp_type === 'job' ? 'Job' : 'Internship'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium mt-0.5">
                            {exp.company || '—'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {exp.start_date
                              ? new Date(exp.start_date + '-01')
                                  .toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                              : ''}
                            {exp.start_date && (exp.end_date || exp.currently) ? ' → ' : ''}
                            {exp.currently
                              ? <span className="text-emerald-600 font-semibold">Present</span>
                              : exp.end_date
                              ? new Date(exp.end_date + '-01')
                                  .toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                              : ''}
                          </p>
                          {exp.description && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .input-style {
          width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem;
          padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
          transition: box-shadow 0.15s;
        }
        .input-style:focus { box-shadow: 0 0 0 2px #a5b4fc; }
        .elabel {
          display: block; font-size: 0.7rem; font-weight: 600;
          color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400
                        uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Value({ children, className = '' }) {
  return (
    <p className={`text-slate-700 text-sm font-medium ${className}`}>
      {children}
    </p>
  );
}
