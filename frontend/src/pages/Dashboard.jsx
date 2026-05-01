import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiCheckCircle,
  FiUsers,
  FiCheckSquare,
  FiClock,
  FiList,
  FiCalendar,
  FiUser,
  FiTrendingUp,
} from 'react-icons/fi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(num, den) {
  if (!den || den === 0) return 0;
  return Math.round((num / den) * 100);
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = 'h-8 w-8' }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className="bg-white border border-[#dfe1e6] rounded-2xl p-5 flex items-center gap-5
      hover:border-indigo-300 transition-all ring-1 ring-black/5">
      <div className={`shrink-0 w-13 h-13 rounded-2xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-4xl font-bold text-[#172b4d] leading-none mb-1">{value}</p>
        <p className="text-sm text-[#44546f] mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  todo:       { label: 'To Do',       bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  inprogress: { label: 'In Progress', bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' },
  done:       { label: 'Done',        bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
};

// ─── Status row with progress bar ─────────────────────────────────────────────
function StatusBar({ status, count, total }) {
  const meta  = STATUS_META[status];
  const ratio = pct(count, total);
  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full w-24 text-center ${meta.badge}`}>
        {meta.label}
      </span>
      <div className="flex-1 bg-[#ebecf0] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <div className="shrink-0 text-right w-20">
        <span className="text-sm font-semibold text-[#172b4d]">{count}</span>
        <span className="text-xs text-[#44546f] ml-1">({ratio}%)</span>
      </div>
    </div>
  );
}

// ─── Member progress bar (color-coded) ───────────────────────────────────────
function memberBarColor(ratio) {
  if (ratio >= 70) return 'bg-emerald-500';
  if (ratio >= 30) return 'bg-amber-400';
  return 'bg-red-400';
}

function memberBadgeColor(ratio) {
  if (ratio >= 70) return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200';
  if (ratio >= 30) return 'text-amber-700 bg-amber-50 ring-1 ring-amber-200';
  return 'text-red-600 bg-red-50 ring-1 ring-red-200';
}

function MemberRow({ entry }) {
  const ratio = pct(entry.completedCount, entry.taskCount);
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f1f2f4] transition-all">
      <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center">
        {initials(entry.user.name)}
      </div>
      <div className="min-w-0 w-36 shrink-0">
        <p className="text-sm font-semibold text-[#172b4d] truncate">{entry.user.name}</p>
        <p className="text-xs text-[#44546f] truncate">{entry.user.email}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="w-full bg-[#ebecf0] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${memberBarColor(ratio)}`}
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-xs text-[#44546f]">{entry.completedCount}/{entry.taskCount}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${memberBadgeColor(ratio)}`}>
          {ratio}%
        </span>
      </div>
    </div>
  );
}

// ─── Overdue task row ──────────────────────────────────────────────────────────
function OverdueRow({ task }) {
  const statusMeta = STATUS_META[task.status];
  return (
    <div className="flex items-center gap-3 p-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
      <FiAlertTriangle className="text-red-400 shrink-0 text-base" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#172b4d] truncate">{task.title}</p>
        <div className="flex items-center flex-wrap gap-3 mt-1">
          {task.assignedTo?.name && (
            <span className="flex items-center gap-1 text-xs text-[#44546f]">
              <FiUser className="text-xs" /> {task.assignedTo.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
            <FiCalendar className="text-xs" /> Due {fmtDate(task.dueDate)}
          </span>
        </div>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta?.badge ?? 'bg-slate-100 text-slate-600'}`}>
        {statusMeta?.label ?? task.status}
      </span>
    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, icon, children, headerRight }) {
  return (
    <div className="bg-white border border-[#dfe1e6] rounded-2xl p-6 ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-[#172b4d] flex items-center gap-2">
          {icon} {title}
        </h2>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [data,    setData]    = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, projRes] = await Promise.all([
          api.get(`/api/dashboard/${projectId}`),
          api.get(`/api/projects/${projectId}`),
        ]);
        setData(dashRes.data);
        setProject(projRes.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex flex-col items-center justify-center gap-3 text-[#44546f]">
        <Spinner className="h-8 w-8 text-indigo-400" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex flex-col items-center justify-center gap-2 text-[#44546f]">
        <FiAlertTriangle className="text-4xl text-red-500" />
        <p className="text-lg font-medium text-[#172b4d]">Could not load dashboard</p>
        <button onClick={() => navigate('/projects')} className="text-indigo-600 text-sm hover:text-indigo-500 transition-colors">
          Back to Projects
        </button>
      </div>
    );
  }

  const isAdmin = project?.members?.some(
    (m) => m.user?._id === user?.id && m.role === 'admin'
  );

  const { totalTasks, tasksByStatus, overdueTasks, tasksByUser, totalMembers } = data;
  const total    = totalTasks ?? 0;
  const overdues = overdueTasks ?? [];

  return (
    <div className="min-h-screen bg-[#f1f2f4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-7">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-sm text-[#44546f] hover:text-indigo-600 transition-colors mb-5"
          >
            <FiArrowLeft /> Back to Projects
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-[#172b4d]">{project?.name}</h1>
              <p className="text-[#44546f] text-sm mt-1.5">
                {isAdmin ? 'Full project overview · Admin view' : 'Your personal task summary'}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              isAdmin
                ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
            }`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* Overdue alert banner */}
        {overdues.length > 0 ? (
          <div className="flex items-center gap-3 bg-red-500/[0.08] border border-red-500/25 border-l-4 border-l-red-500 rounded-xl px-5 py-4 mb-6">
            <FiAlertTriangle className="text-red-400 text-xl shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">
                {overdues.length} task{overdues.length !== 1 ? 's are' : ' is'} overdue!
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">Review the overdue section below and take action.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/[0.08] border border-emerald-500/25 border-l-4 border-l-emerald-500 rounded-xl px-5 py-4 mb-6">
            <FiCheckCircle className="text-emerald-400 text-xl shrink-0" />
            <p className="text-sm font-semibold text-emerald-400">All tasks are on track — great work!</p>
          </div>
        )}

        {/* Stat cards */}
        <div className={`grid gap-4 mb-6 grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <StatCard
            icon={<FiList className="text-indigo-400 text-xl" />}
            label="Total Tasks"
            value={total}
            iconBg="bg-indigo-500/15"
          />
          <StatCard
            icon={<FiList className="text-slate-400 text-xl" />}
            label="To Do"
            value={tasksByStatus?.todo ?? 0}
            iconBg="bg-slate-500/10"
          />
          <StatCard
            icon={<FiClock className="text-amber-400 text-xl" />}
            label="In Progress"
            value={tasksByStatus?.inprogress ?? 0}
            iconBg="bg-amber-500/15"
          />
          <StatCard
            icon={<FiCheckSquare className="text-emerald-400 text-xl" />}
            label="Done"
            value={tasksByStatus?.done ?? 0}
            iconBg="bg-emerald-500/15"
          />
          {isAdmin && (
            <StatCard
              icon={<FiUsers className="text-purple-400 text-xl" />}
              label="Members"
              value={totalMembers ?? project?.members?.length ?? 0}
              iconBg="bg-purple-500/15"
            />
          )}
        </div>

        {/* Two-column middle sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Tasks by status */}
          <Section
            title="Tasks by Status"
            icon={<FiTrendingUp className="text-indigo-400" />}
          >
            {total === 0 ? (
              <div className="text-center py-8 text-[#8590a2]">
                <FiList className="text-3xl mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#44546f]">No tasks in this project yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['todo', 'inprogress', 'done'].map((s) => (
                  <StatusBar key={s} status={s} count={tasksByStatus?.[s] ?? 0} total={total} />
                ))}
                {total > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#dfe1e6]">
                    <p className="text-xs text-[#8590a2] mb-2 font-medium uppercase tracking-wide">Overall distribution</p>
                    <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
                      {['todo', 'inprogress', 'done'].map((s) => {
                        const count = tasksByStatus?.[s] ?? 0;
                        return count > 0 ? (
                          <div
                            key={s}
                            style={{ width: `${pct(count, total)}%` }}
                            className={`${STATUS_META[s].bar} transition-all duration-500`}
                            title={`${STATUS_META[s].label}: ${count}`}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Overdue tasks */}
          <Section
            title="Overdue Tasks"
            icon={<FiAlertTriangle className="text-red-400" />}
            headerRight={
              overdues.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/20">
                  {overdues.length} overdue
                </span>
              )
            }
          >
            {overdues.length === 0 ? (
              <div className="text-center py-8">
                <FiCheckCircle className="text-emerald-400 text-3xl mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-400">No overdue tasks</p>
                <p className="text-xs text-[#44546f] mt-1">Everything is on schedule</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {overdues.map((task) => (
                  <OverdueRow key={task._id} task={task} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Team Performance — Admin only */}
        {isAdmin && (
          <Section
            title="Team Performance"
            icon={<FiUsers className="text-purple-400" />}
            headerRight={
              <span className="text-xs text-[#44546f] font-medium">Completion rate per member</span>
            }
          >
            {(!tasksByUser || tasksByUser.length === 0) ? (
              <div className="text-center py-10 text-[#8590a2]">
                <FiUsers className="text-3xl mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#44546f]">No task assignments yet</p>
                <p className="text-xs text-[#8590a2] mt-1">Assign tasks to team members to see stats here</p>
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex items-center gap-5 mb-4 pb-4 border-b border-[#dfe1e6] flex-wrap">
                  {[
                    { color: 'bg-emerald-500', label: '≥ 70% — On track' },
                    { color: 'bg-amber-400',   label: '30–69% — In progress' },
                    { color: 'bg-red-400',     label: '< 30% — Needs attention' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-[#44546f]">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr] gap-4 px-3 mb-1">
                  <span className="text-xs font-semibold text-[#8590a2] uppercase tracking-wide">Member</span>
                  <span className="text-xs font-semibold text-[#8590a2] uppercase tracking-wide">Progress</span>
                  <span className="text-xs font-semibold text-[#8590a2] uppercase tracking-wide text-right">Tasks</span>
                </div>

                <div className="space-y-1">
                  {tasksByUser.map((entry) => (
                    <MemberRow key={entry.user._id} entry={entry} />
                  ))}
                </div>

                {/* Members with no tasks */}
                {project?.members && (() => {
                  const assignedIds = new Set(tasksByUser.map((e) => e.user._id));
                  const unassigned  = project.members.filter((m) => !assignedIds.has(m.user._id));
                  if (unassigned.length === 0) return null;
                  return (
                    <div className="mt-4 pt-4 border-t border-[#dfe1e6]">
                      <p className="text-xs font-medium text-[#8590a2] mb-2">No assigned tasks</p>
                      <div className="flex flex-wrap gap-2">
                        {unassigned.map((m) => (
                          <div key={m.user._id} className="flex items-center gap-1.5 bg-[#ebecf0] border border-[#dfe1e6] rounded-full px-3 py-1">
                            <div className="w-5 h-5 rounded-full bg-linear-to-br from-indigo-400/50 to-violet-500/50 text-[#44546f] text-xs font-bold flex items-center justify-center">
                              {initials(m.user.name)}
                            </div>
                            <span className="text-xs text-[#44546f]">{m.user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </Section>
        )}

        {/* Member self-summary */}
        {!isAdmin && (
          <Section
            title="My Task Summary"
            icon={<FiUser className="text-indigo-400" />}
          >
            {total === 0 ? (
              <div className="text-center py-10 text-[#8590a2]">
                <FiCheckSquare className="text-3xl mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#44546f]">No tasks assigned to you yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['todo', 'inprogress', 'done'].map((s) => {
                  const count = tasksByStatus?.[s] ?? 0;
                  const meta  = STATUS_META[s];
                  return (
                    <div key={s} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#f8f9fa] border border-[#dfe1e6] gap-2 hover:border-[#c1c4cc] transition-all">
                      <span className={`text-4xl font-bold ${
                        s === 'todo' ? 'text-slate-400' : s === 'inprogress' ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        {count}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-[#8590a2] mt-1">
                        {pct(count, total)}% of your tasks
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        )}

      </div>
    </div>
  );
}
