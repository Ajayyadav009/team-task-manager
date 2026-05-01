import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiZap,
} from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return toast.error('Email and password are required');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white border border-[#dfe1e6] rounded-xl px-4 py-3.5 text-sm text-[#172b4d] placeholder-[#a5adba] focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 hover:border-[#c1c4cc] transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f1f2f4] relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[420px]">

        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-5">
            <FiZap className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#172b4d] tracking-tight">TaskManager</h1>
          <p className="text-[#44546f] text-sm mt-1.5">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#dfe1e6] rounded-2xl p-8 shadow-2xl shadow-black/10 ring-1 ring-black/5">

          <h2 className="text-xl font-semibold text-[#172b4d] mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">

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
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  Signing in…
                </>
              ) : (
                <>Sign In <FiArrowRight className="text-sm" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#dfe1e6] text-center">
            <p className="text-sm text-[#44546f]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
