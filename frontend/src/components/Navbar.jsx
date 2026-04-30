import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiZap } from 'react-icons/fi';

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-xl border-b border-[#1a2844]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FiZap className="text-white text-sm" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">TaskManager</span>
        </button>

        {/* User section */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#0d1525] border border-[#1a2844] rounded-2xl px-4 py-2.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-indigo-500/30">
                {initials(user.name)}
              </div>

              {/* Name + Role */}
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-white leading-none">{user.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                  user.role === 'admin'
                    ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25'
                    : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#8899bb] hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all"
            >
              <FiLogOut className="text-sm" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
