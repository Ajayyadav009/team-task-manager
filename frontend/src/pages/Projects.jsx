import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiUsers,
  FiBarChart2,
  FiList,
  FiSettings,
  FiX,
  FiUserPlus,
  FiTrash2,
  FiFolder,
} from 'react-icons/fi';

// ─── Shared dark input class ──────────────────────────────────────────────────
const darkInput =
  'w-full bg-white border border-[#dfe1e6] rounded-xl px-4 py-3.5 text-sm text-[#172b4d] placeholder-[#a5adba] focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 hover:border-[#c1c4cc] transition-all';

// ─── Initials helper ──────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Modal backdrop ───────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  const backdropRef = useRef(null);
  const handleBackdrop = (e) => { if (e.target === backdropRef.current) onClose(); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      {children}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Create Project Modal ─────────────────────────────────────────────────────
function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/projects', form);
      toast.success('Project created!');
      onCreate(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white border border-[#dfe1e6] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#172b4d]">Create New Project</h2>
            <p className="text-sm text-[#44546f] mt-0.5">Set up a new workspace for your team</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#44546f] hover:text-[#172b4d] hover:bg-[#ebecf0] transition-all"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#44546f]">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className={darkInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#44546f]">
              Description <span className="text-[#8590a2] font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
              rows={3}
              className={`${darkInput} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
                text-white font-semibold py-3 rounded-xl transition-all
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <><Spinner className="h-4 w-4 text-white" /> Creating…</> : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium bg-[#f1f2f4] hover:bg-[#ebecf0] text-[#44546f] hover:text-[#172b4d] border border-[#dfe1e6] hover:border-[#c1c4cc] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─── Manage Members Modal ─────────────────────────────────────────────────────
function ManageMembersModal({ project, currentUserId, onClose, onUpdate }) {
  const [members, setMembers] = useState(project.members || []);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const emailRef = useRef(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter an email address');
    setAdding(true);
    try {
      const { data } = await api.post(`/api/projects/${project._id}/members`, { email: email.trim() });
      setMembers(data.members);
      onUpdate(data.members);
      setEmail('');
      toast.success('Member added!');
      emailRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      const { data } = await api.delete(`/api/projects/${project._id}/members/${userId}`);
      setMembers(data.members);
      onUpdate(data.members);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white border border-[#dfe1e6] rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#172b4d]">Manage Members</h2>
            <p className="text-sm text-[#44546f] mt-0.5 truncate max-w-60">{project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#44546f] hover:text-[#172b4d] hover:bg-[#ebecf0] transition-all"
          >
            <FiX />
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold text-[#8590a2] uppercase tracking-wider mb-3">
            Team Members · {members.length}
          </p>
          {members.map((m) => {
            const isCurrentUser = m.user._id === currentUserId;
            const isRemoving = removingId === m.user._id;
            return (
              <div
                key={m.user._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fa] border border-[#dfe1e6]"
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm
                  flex items-center justify-center shrink-0">
                  {initials(m.user.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#172b4d] truncate">
                    {m.user.name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-[#8590a2] font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#44546f] truncate">{m.user.email}</p>
                </div>

                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                  ${m.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                  }`}>
                  {m.role}
                </span>

                {!isCurrentUser && (
                  <button
                    onClick={() => handleRemove(m.user._id)}
                    disabled={isRemoving}
                    className="p-1.5 text-[#44546f] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                    title="Remove member"
                  >
                    {isRemoving
                      ? <Spinner className="h-3.5 w-3.5" />
                      : <FiTrash2 className="text-sm" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add member */}
        <div className="pt-4 border-t border-[#dfe1e6]">
          <p className="text-xs font-semibold text-[#8590a2] uppercase tracking-wider mb-3">
            Add Member by Email
          </p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="relative flex-1">
              <FiUserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a5adba] text-sm pointer-events-none" />
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-white border border-[#dfe1e6] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#172b4d]
                  placeholder-[#a5adba] focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15
                  hover:border-[#c1c4cc] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white
                px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0
                shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {adding ? <Spinner className="h-4 w-4 text-white" /> : <FiPlus />}
              Add
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, currentUserId, onManageMembers, navigate }) {
  const membership = project.members?.find((m) => m.user?._id === currentUserId);
  const role = membership?.role || 'member';
  const isAdmin = role === 'admin';

  const visibleMembers = (project.members || []).slice(0, 4);
  const extraCount = Math.max(0, (project.members?.length || 0) - 4);

  return (
    <div className="group relative bg-white border border-[#dfe1e6] rounded-2xl
      hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1
      transition-all duration-300 flex flex-col ring-1 ring-black/5">

      {/* Hover top gradient line */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-linear-to-r from-transparent via-indigo-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-6 flex flex-col flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/10
              border border-indigo-500/20 flex items-center justify-center">
              <FiFolder className="text-indigo-400 text-lg" />
            </div>
            <h2 className="font-bold text-[#172b4d] text-base leading-snug truncate">
              {project.name}
            </h2>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize
            ${isAdmin
              ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
              : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
            }`}>
            {role}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#44546f] text-sm leading-relaxed line-clamp-2 mb-5 min-h-10 flex-1">
          {project.description || <span className="italic text-[#8590a2]">No description</span>}
        </p>

        {/* Member avatar stack */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex -space-x-2">
            {visibleMembers.map((m) => (
              <div
                key={m.user?._id}
                title={m.user?.name}
                className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold
                  flex items-center justify-center border-2 border-white ring-0"
              >
                {initials(m.user?.name)}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-7 h-7 rounded-full bg-[#ebecf0] text-[#44546f] text-xs font-bold
                flex items-center justify-center border-2 border-white">
                +{extraCount}
              </div>
            )}
          </div>
          <span className="text-xs text-[#8590a2]">
            {project.members?.length ?? 0} member{project.members?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/projects/${project._id}/tasks`)}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold
                bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 rounded-xl transition-all
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px"
            >
              <FiList className="text-sm" /> View Tasks
            </button>
            <button
              onClick={() => navigate(`/dashboard/${project._id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium
                bg-[#f1f2f4] hover:bg-[#ebecf0] text-[#44546f] hover:text-[#172b4d] px-3 py-2.5 rounded-xl
                border border-[#dfe1e6] hover:border-[#c1c4cc] transition-all"
            >
              <FiBarChart2 className="text-sm" /> Dashboard
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => onManageMembers(project)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium
                border border-[#dfe1e6] hover:border-[#c1c4cc] text-[#44546f] hover:text-[#172b4d]
                hover:bg-[#ebecf0] py-2.5 rounded-xl transition-all"
            >
              <FiSettings className="text-sm" /> Manage Members
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingProject, setManagingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleMembersUpdated = (projectId, newMembers) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === projectId ? { ...p, members: newMembers } : p))
    );
    setManagingProject((prev) =>
      prev?._id === projectId ? { ...prev, members: newMembers } : prev
    );
  };

  const adminCount = projects.filter((p) =>
    p.members?.find((m) => m.user?._id === user?.id && m.role === 'admin')
  ).length;

  return (
    <div className="min-h-screen bg-[#f1f2f4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#172b4d]">My Projects</h1>
            <p className="text-[#44546f] text-sm mt-1.5">
              {loading
                ? 'Loading…'
                : `${projects.length} project${projects.length !== 1 ? 's' : ''} · ${adminCount} as admin`}
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white
                px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px"
            >
              <FiPlus /> Create Project
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-[#44546f]">
            <Spinner className="h-8 w-8 text-indigo-400" />
            <p>Loading your projects…</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white border border-[#dfe1e6] flex items-center justify-center mb-5">
              <FiFolder className="text-[#8590a2] text-3xl" />
            </div>
            {user?.role === 'admin' ? (
              <>
                <h2 className="text-xl font-semibold text-[#172b4d] mb-2">No projects yet</h2>
                <p className="text-[#44546f] text-sm mb-8 max-w-xs">Create your first project to start collaborating with your team</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white
                    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px"
                >
                  <FiPlus /> Create Project
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[#172b4d] mb-2">No projects assigned</h2>
                <p className="text-[#44546f] text-sm max-w-xs">You haven&apos;t been added to any projects yet. Ask an admin to add you.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                currentUserId={user?.id}
                onManageMembers={setManagingProject}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleProjectCreated}
        />
      )}

      {managingProject && (
        <ManageMembersModal
          project={managingProject}
          currentUserId={user?.id}
          onClose={() => setManagingProject(null)}
          onUpdate={(newMembers) => handleMembersUpdated(managingProject._id, newMembers)}
        />
      )}
    </div>
  );
}
