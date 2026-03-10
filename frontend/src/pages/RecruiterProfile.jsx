import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecruiterProfile, updateRecruiterProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const INDUSTRIES = [
  { value: 'it',         label: 'Information Technology' },
  { value: 'finance',    label: 'Finance & Banking' },
  { value: 'core',       label: 'Core Engineering' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'ecommerce',  label: 'E-Commerce' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education',  label: 'Education' },
  { value: 'other',      label: 'Other' },
];

const SIZES = [
  { value: 'startup', label: 'Startup (1–50)' },
  { value: 'small',   label: 'Small (51–200)' },
  { value: 'medium',  label: 'Medium (201–1000)' },
  { value: 'large',   label: 'Large (1001–5000)' },
  { value: 'mnc',     label: 'MNC (5000+)' },
];

export default function RecruiterProfile() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const logoRef   = useRef();

  const [profile,  setProfile]  = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ type: '', text: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [form, setForm] = useState({
    company_name: '', company_website: '', industry: '',
    company_size: '', designation: '', phone: '',
    company_description: '', city: '', state: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'recruiter') { navigate('/dashboard'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getRecruiterProfile();
      setProfile(res.data);
      setForm({
        company_name:        res.data.company_name        || '',
        company_website:     res.data.company_website     || '',
        industry:            res.data.industry            || '',
        company_size:        res.data.company_size        || '',
        designation:         res.data.designation         || '',
        phone:               res.data.phone               || '',
        company_description: res.data.company_description || '',
        city:                res.data.city                || '',
        state:               res.data.state               || '',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (logoFile) fd.append('company_logo', logoFile);
      const res = await updateRecruiterProfile(fd);
      setProfile(res.data.profile);
      setEditing(false);
      setMessage({ type: 'success', text: '✅ Company profile saved successfully!' });
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.phone?.[0] || d?.company_name?.[0] || 'Failed to save.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  // Profile completion
  const completionFields = ['company_name','industry','company_size','designation','phone','company_description','city'];
  const filled     = completionFields.filter(f => form[f]).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  const industryLabel = INDUSTRIES.find(i => i.value === form.industry)?.label;
  const sizeLabel     = SIZES.find(s => s.value === form.company_size)?.label;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium">Loading company profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-slate-800 text-lg">PlacementHub</span>
          <span className="ml-2 text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">Recruiter</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.full_name}</span>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-violet-600 hover:underline font-medium">Dashboard</button>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Flash message */}
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

            {/* Company Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">

              {/* Logo */}
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-violet-50 mx-auto ring-4 ring-violet-50 flex items-center justify-center">
                  {(logoPreview || profile?.company_logo) ? (
                    <img
                      src={logoPreview || `http://localhost:8000${profile.company_logo}`}
                      alt="Company Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-5xl">🏢</span>
                  )}
                </div>
                {editing && (
                  <button onClick={() => logoRef.current.click()}
                    className="absolute bottom-0 right-0 bg-violet-600 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center hover:bg-violet-700 shadow">
                    📷
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*"
                  onChange={handleLogoChange} className="hidden" />
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                {form.company_name || 'Your Company'}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>

              {form.designation && (
                <p className="text-sm text-slate-600 mt-1 font-medium">{form.designation}</p>
              )}

              {industryLabel && (
                <span className="inline-block mt-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {industryLabel}
                </span>
              )}

              {sizeLabel && (
                <div className="mt-3 bg-slate-50 rounded-xl p-3">
                  <p className="text-sm font-bold text-violet-600">{sizeLabel}</p>
                  <p className="text-xs text-slate-400 font-medium">Company Size</p>
                </div>
              )}

              {/* Completion bar */}
              <div className="mt-4 text-left">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Profile Completion</span>
                  <span className="font-semibold text-violet-600">{completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completion}%` }} />
                </div>
                {completion < 100 && (
                  <p className="text-xs text-slate-400 mt-1">Complete profile to attract students</p>
                )}
              </div>
            </div>

            {/* Location & Website */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Location & Web</h3>
              {!editing ? (
                <div className="space-y-2">
                  {(form.city || form.state) ? (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      📍 {[form.city, form.state].filter(Boolean).join(', ')}
                    </p>
                  ) : <p className="text-xs text-slate-400">No location added</p>}
                  {form.company_website ? (
                    <a href={form.company_website} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-violet-600 hover:underline">
                      🌐 Company Website
                    </a>
                  ) : <p className="text-xs text-slate-400">No website added</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="text" name="city" value={form.city}
                    onChange={handleChange} placeholder="City"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  <input type="text" name="state" value={form.state}
                    onChange={handleChange} placeholder="State"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  <input type="url" name="company_website" value={form.company_website}
                    onChange={handleChange} placeholder="https://yourcompany.com"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Contact</h3>
              {!editing ? (
                <p className="text-sm text-slate-600">
                  {form.phone ? `📞 ${form.phone}` : <span className="text-slate-400 text-xs">No phone added</span>}
                </p>
              ) : (
                <input type="tel" name="phone" value={form.phone}
                  onChange={handleChange} placeholder="10-digit phone"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">Company Profile</h1>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setMessage({ type: '', text: '' }); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Company Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Company Details</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Company Name</label>
                  {editing
                    ? <input type="text" name="company_name" value={form.company_name}
                        onChange={handleChange} placeholder="e.g. TCS, Infosys, Google"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    : <p className="text-slate-700 text-sm font-medium">{form.company_name || '—'}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Industry</label>
                  {editing
                    ? <select name="industry" value={form.industry} onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                      </select>
                    : <p className="text-slate-700 text-sm font-medium">{industryLabel || '—'}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Company Size</label>
                  {editing
                    ? <select name="company_size" value={form.company_size} onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                        <option value="">Select Size</option>
                        {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    : <p className="text-slate-700 text-sm font-medium">{sizeLabel || '—'}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Your Designation</label>
                  {editing
                    ? <input type="text" name="designation" value={form.designation}
                        onChange={handleChange} placeholder="e.g. HR Manager, Technical Recruiter"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    : <p className="text-slate-700 text-sm font-medium">{form.designation || '—'}</p>}
                </div>
              </div>
            </div>

            {/* About Company */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">About the Company</h3>
              {editing
                ? <textarea name="company_description" value={form.company_description}
                    onChange={handleChange} rows={5}
                    placeholder="Describe your company — what you do, your culture, why students should join..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
                : <p className="text-slate-600 text-sm leading-relaxed">
                    {form.company_description ||
                      <span className="text-slate-400 italic">No description added yet. Tell students about your company!</span>}
                  </p>}
            </div>

            {/* Recruiter Actions Panel */}
            {!editing && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-6">
                <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => navigate('/jobs/post')}
                    className="bg-white rounded-xl p-4 text-center shadow-sm border border-violet-100 hover:shadow-md hover:border-violet-300 transition cursor-pointer">
                    <div className="text-2xl mb-1">📝</div>
                    <p className="text-xs font-semibold text-slate-700">Post a Job</p>
                  </button>
                  <button onClick={() => navigate('/students/browse')}
                    className="bg-white rounded-xl p-4 text-center shadow-sm border border-violet-100 hover:shadow-md hover:border-violet-300 transition cursor-pointer">
                    <div className="text-2xl mb-1">👥</div>
                    <p className="text-xs font-semibold text-slate-700">Browse Students</p>
                  </button>
                  <button onClick={() => navigate('/dashboard')}
                    className="bg-white rounded-xl p-4 text-center shadow-sm border border-violet-100 hover:shadow-md hover:border-violet-300 transition cursor-pointer">
                    <div className="text-2xl mb-1">📊</div>
                    <p className="text-xs font-semibold text-slate-700">Dashboard</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}