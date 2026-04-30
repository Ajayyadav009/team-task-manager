import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiArrowLeft,
  FiTrash2,
  FiEdit3,
  FiAlertCircle,
  FiCalendar,
  FiUser,
  FiX,
  FiClipboard,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES   = ['todo', 'inprogress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

const PRIORITY_BAR   = { low: 'bg-emerald-500', medium: 'bg-amber-400', high: 'bg-red-500' };
const PRIORITY_BADGE = {
  low:    'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  high:   'bg-red-500/15 text-red-400 ring-1 ring-red-500/20',
};
const STATUS_BADGE = {
  todo:       'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/15',
  inprogress: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20',
  done:       'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
};

const TABS = [
  { label: 'All',         value: 'all' },
  { label: 'To Do',       value: 'todo' },
  { label: 'In Progress', value: 'inprogress' },
  { label: 'Done',        value: 'done' },
];

const EMPTY_FORM = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' };

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Shared dark input class ──────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#070b14] border border-[#1e3052] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#3d5470] focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 hover:border-[#253857] transition-all';

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Modal backdrop ───────────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth = 'max-w-lg' }) {
  const backdropRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
    >
      <div className={`bg-[#0d1525] border border-[#1a2844] rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

// ─── Modal header ─────────────────────────────────────────────────────────────
function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between mb-5 p-6 pb-0">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-[#8899bb] mt-0.5 truncate max-w-64">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl text-[#8899bb] hover:text-white hover:bg-[#142038] transition-all"
      >
        <FiX />
      </button>
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [submitting, setSubmit] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSubmit(true);
    try {
      const { data } = await api.post('/api/tasks', {
        title:       form.title.trim(),
        description: form.description.trim(),
        projectId,
        priority:    form.priority,
        dueDate:     form.dueDate || undefined,
        assignedTo:  form.assignedTo || undefined,
      });
      toast.success('Task created!');
      onCreated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmit(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Add New Task" subtitle="Fill in the details below" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Design the landing page"
            autoComplete="off"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">
            Description <span className="text-[#48617a] font-normal">(optional)</span>
          </label>
          <textarea name="description" value={form.description} onChange={onChange}
            placeholder="Describe the task…" rows={3} className={`${inputCls} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8899bb]">Priority</label>
            <select name="priority" value={form.priority} onChange={onChange}
              className={`${inputCls} bg-[#070b14] cursor-pointer`}>
              {PRIORITIES.map((p) => <option key={p} value={p} className="bg-[#0d1525]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8899bb]">Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={onChange}
              className={`${inputCls} bg-[#070b14]`} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">Assign To</label>
          <select name="assignedTo" value={form.assignedTo} onChange={onChange}
            className={`${inputCls} bg-[#070b14] cursor-pointer`}>
            <option value="" className="bg-[#0d1525]">Unassigned</option>
            {members.map((m) => <option key={m.user._id} value={m.user._id} className="bg-[#0d1525]">{m.user.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
              text-white font-semibold py-3 rounded-xl transition-all
              shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
              disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? <><Spinner /> Creating…</> : <><FiPlus className="text-sm" /> Add Task</>}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-medium bg-[#142038] hover:bg-[#1a2844] text-[#8899bb] hover:text-white border border-[#1a2844] hover:border-[#253857] transition-all">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Task Modal ──────────────────────────────────────────────────────────
function EditTaskModal({ task, members, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || '',
    priority:    task.priority,
    dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : '',
    assignedTo:  task.assignedTo?._id || '',
  });
  const [submitting, setSubmit] = useState(false);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSubmit(true);
    try {
      const { data } = await api.patch(`/api/tasks/${task._id}`, {
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        dueDate:     form.dueDate || null,
        assignedTo:  form.assignedTo || null,
      });
      toast.success('Task updated!');
      onUpdated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmit(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Edit Task" subtitle={task.title} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">Title <span className="text-red-400">*</span></label>
          <input type="text" name="title" value={form.title} onChange={onChange} className={inputCls} autoFocus />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={3} className={`${inputCls} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8899bb]">Priority</label>
            <select name="priority" value={form.priority} onChange={onChange}
              className={`${inputCls} bg-[#070b14] cursor-pointer`}>
              {PRIORITIES.map((p) => <option key={p} value={p} className="bg-[#0d1525]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8899bb]">Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={onChange}
              className={`${inputCls} bg-[#070b14]`} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#8899bb]">Assign To</label>
          <select name="assignedTo" value={form.assignedTo} onChange={onChange}
            className={`${inputCls} bg-[#070b14] cursor-pointer`}>
            <option value="" className="bg-[#0d1525]">Unassigned</option>
            {members.map((m) => <option key={m.user._id} value={m.user._id} className="bg-[#0d1525]">{m.user.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
              text-white font-semibold py-3 rounded-xl transition-all
              shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
              disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? <><Spinner /> Saving…</> : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-medium bg-[#142038] hover:bg-[#1a2844] text-[#8899bb] hover:text-white border border-[#1a2844] hover:border-[#253857] transition-all">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({ task, onClose, onConfirm, deleting }) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
          <FiTrash2 className="text-red-400 text-xl" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Delete Task?</h2>
        <p className="text-sm text-[#8899bb] mb-6">
          <span className="font-medium text-white">&ldquo;{task.title}&rdquo;</span> will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#142038] hover:bg-[#1a2844] text-[#8899bb] hover:text-white border border-[#1a2844] hover:border-[#253857] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {deleting ? <><Spinner /> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, isAdmin, currentUserId, onStatusChange, onEdit, onDelete }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAssignedToMe = task.assignedTo?._id === currentUserId;
  const canChangeStatus = isAdmin || isAssignedToMe;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) return;
    setUpdatingStatus(true);
    await onStatusChange(task._id, newStatus);
    setUpdatingStatus(false);
  };

  return (
    <div className={`group relative bg-[#0d1525] border rounded-2xl overflow-hidden
      hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5
      transition-all duration-200
      ${isOverdue
        ? 'border-red-500/30 bg-red-500/[0.02] hover:border-red-500/50'
        : 'border-[#1a2844] hover:border-indigo-500/30'
      }`}>

      {/* Priority stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${PRIORITY_BAR[task.priority]}`} />

      <div className="pl-6 pr-5 py-5">
        {/* Title row + admin actions */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className={`font-bold text-lg leading-snug flex-1 min-w-0
            ${task.status === 'done' ? 'line-through text-[#48617a]' : 'text-white'}`}>
            {task.title}
          </p>
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-[#8899bb] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                title="Edit task"
              >
                <FiEdit3 className="text-sm" />
              </button>
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 text-[#8899bb] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete task"
              >
                <FiTrash2 className="text-sm" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[#8899bb] line-clamp-2 mt-1.5 mb-4 leading-relaxed min-h-[2.5rem]">
          {task.description || <span className="text-[#48617a] italic">No description</span>}
        </p>

        {/* Bottom meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority badge */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${PRIORITY_BADGE[task.priority]}`}>
            {task.priority}
          </span>

          {/* Status badge / selector */}
          {canChangeStatus ? (
            updatingStatus ? (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[task.status]}`}>
                <Spinner className="h-3 w-3" />
                <span>{STATUS_LABELS[task.status]}</span>
              </div>
            ) : (
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none
                  bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400/50 ${STATUS_BADGE[task.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#0d1525] text-white">{STATUS_LABELS[s]}</option>
                ))}
              </select>
            )
          ) : (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          )}

          {/* Overdue badge */}
          {isOverdue && (
            <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/20">
              <FiAlertCircle className="text-xs" /> Overdue
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Assignee */}
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {initials(task.assignedTo.name)}
              </div>
              <span className="text-xs text-[#8899bb]">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-xs text-[#48617a]">
              <FiUser className="text-xs" /> Unassigned
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-[#48617a]'}`}>
              <FiCalendar className="text-xs" /> {fmtDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tasks() {
  const { id: projectId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const [project,      setProject]      = useState(null);
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('all');
  const [showCreate,   setShowCreate]   = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const isProjectAdmin = project?.members?.some(
    (m) => m.user?._id === user?.id && m.role === 'admin'
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get(`/api/projects/${projectId}`),
          api.get(`/api/tasks/project/${projectId}`),
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const filtered = activeTab === 'all' ? tasks : tasks.filter((t) => t.status === activeTab);
  const counts   = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  const handleStatusChange = async (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      const { data } = await api.patch(`/api/tasks/${taskId}/status`, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
      toast.success('Status updated');
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: t.status } : t)));
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreated  = (newTask)     => { setTasks((prev) => [newTask, ...prev]); };
  const handleUpdated  = (updatedTask) => { setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))); };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await api.delete(`/api/tasks/${deletingTask._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      toast.success('Task deleted');
      setDeletingTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-3 text-[#8899bb]">
        <Spinner className="h-8 w-8 text-indigo-400" />
        <p>Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-sm text-[#8899bb] hover:text-indigo-400 transition-colors mb-5"
          >
            <FiArrowLeft /> Back to Projects
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-white truncate">{project?.name}</h1>
              <p className="text-[#8899bb] text-sm mt-1.5">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                {!isProjectAdmin && ' · showing your assigned tasks'}
              </p>
            </div>
            {isProjectAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white
                  px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px"
              >
                <FiPlus /> Add Task
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {TABS.map((tab) => {
            const count = tab.value === 'all' ? tasks.length : (counts[tab.value] || 0);
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-[#0d1525] border border-[#1a2844] text-[#8899bb] hover:text-white hover:border-[#253857]'
                  }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-[#142038] text-[#8899bb]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0d1525] border border-[#1a2844] flex items-center justify-center mb-4">
              <FiClipboard className="text-[#48617a] text-2xl" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">
              {activeTab === 'all' ? 'No tasks yet' : `No ${STATUS_LABELS[activeTab]} tasks`}
            </h2>
            <p className="text-[#8899bb] text-sm">
              {activeTab === 'all' && isProjectAdmin
                ? 'Click "Add Task" to create the first one'
                : 'Switch tabs or check back later'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                isAdmin={isProjectAdmin}
                currentUserId={user?.id}
                onStatusChange={handleStatusChange}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          members={project?.members || []}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          members={project?.members || []}
          onClose={() => setEditingTask(null)}
          onUpdated={handleUpdated}
        />
      )}

      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onClose={() => { if (!deleting) setDeletingTask(null); }}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </div>
  );
}
