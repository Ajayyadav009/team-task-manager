import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiArrowRight,
  FiZap,
} from 'react-icons/fi';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) {
      return toast.error('All fields are required');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data.user, data.token);
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white border border-[#dfe1e6] rounded-xl px-4 py-3.5 text-sm text-[#172b4d] placeholder-[#a5adba] focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 hover:border-[#c1c4cc] transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#f1f2f4] relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-125 h-125 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-105">

        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-5">
            <FiZap className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#172b4d] tracking-tight">TaskManager</h1>
          <p className="text-[#44546f] text-sm mt-1.5">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#dfe1e6] rounded-2xl p-8 shadow-2xl shadow-black/10 ring-1 ring-black/5">

          <h2 className="text-xl font-semibold text-[#172b4d] mb-6">Get started</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#44546f]">Full name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5adba] text-sm pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#44546f]">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5adba] text-sm pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#44546f]">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5adba] text-sm pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={`${inputCls} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a5adba] hover:text-[#44546f] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 6 && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <span>⚠</span> Minimum 6 characters
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#44546f]">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {['member', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all
                      ${form.role === r
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-white border-[#dfe1e6] text-[#44546f] hover:border-[#c1c4cc] hover:text-[#172b4d]'
                      }`}
                  >
                    <FiShield className="text-sm" />
                    <span className="capitalize">{r}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#8590a2] mt-1.5">
                {form.role === 'admin'
                  ? 'Admins can create projects and manage team members.'
                  : 'Members can view and update their assigned tasks.'}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500
                text-white font-semibold py-3.5 rounded-xl transition-all
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>Create Account <FiArrowRight className="text-sm" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#dfe1e6] text-center">
            <p className="text-sm text-[#44546f]">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
