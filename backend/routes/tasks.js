const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Fetch project and resolve the caller's project-level role.
// Returns { project, callerRole } or sends an error response directly.
const resolveProjectMembership = async (res, projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }

  const membership = project.members.find((m) => m.user.toString() === userId);
  if (!membership) {
    res.status(403).json({ message: 'Access denied: you are not a member of this project' });
    return null;
  }

  return { project, callerRole: membership.role };
};

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
// Admin only — create a task inside a project
router.post('/', protect, async (req, res) => {
  const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }
  if (!projectId || !isValidId(projectId)) {
    return res.status(400).json({ message: 'A valid projectId is required' });
  }
  if (assignedTo && !isValidId(assignedTo)) {
    return res.status(400).json({ message: 'Invalid assignedTo user ID' });
  }

  try {
    const membership = await resolveProjectMembership(res, projectId, req.user.id);
    if (!membership) return;

    if (membership.callerRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: project admins only' });
    }

    // Validate that the assignee is actually a member of the project
    if (assignedTo) {
      const isProjectMember = membership.project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!isProjectMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
      priority,
      dueDate: dueDate || null,
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name' },
    ]);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/tasks/project/:projectId ───────────────────────────────────────
// Protected — admin sees all tasks, member sees only their assigned tasks
router.get('/project/:projectId', protect, async (req, res) => {
  if (!isValidId(req.params.projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    const membership = await resolveProjectMembership(res, req.params.projectId, req.user.id);
    if (!membership) return;

    const filter = { project: req.params.projectId };
    if (membership.callerRole === 'member') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
// Protected — caller must be a member of the task's project
router.get('/:id', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name description');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Verify caller belongs to the project
    const membership = await resolveProjectMembership(res, task.project._id, req.user.id);
    if (!membership) return;

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
// Protected — admin: any task; member: only their assigned tasks
router.patch('/:id/status', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const { status } = req.body;
  const validStatuses = ['todo', 'inprogress', 'done'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const membership = await resolveProjectMembership(res, task.project, req.user.id);
    if (!membership) return;

    if (membership.callerRole === 'member') {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: you can only update your own tasks' });
      }
    }

    task.status = status;
    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name' },
    ]);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
// Admin only — update task details
router.patch('/:id', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const { title, description, priority, dueDate, assignedTo } = req.body;
  const validPriorities = ['low', 'medium', 'high'];

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ message: `Priority must be one of: ${validPriorities.join(', ')}` });
  }
  if (assignedTo && !isValidId(assignedTo)) {
    return res.status(400).json({ message: 'Invalid assignedTo user ID' });
  }
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ message: 'Title cannot be empty' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const membership = await resolveProjectMembership(res, task.project, req.user.id);
    if (!membership) return;

    if (membership.callerRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: project admins only' });
    }

    // Validate new assignee is a project member
    if (assignedTo) {
      const isProjectMember = membership.project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!isProjectMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name' },
    ]);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Admin only — delete a task
router.delete('/:id', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const membership = await resolveProjectMembership(res, task.project, req.user.id);
    if (!membership) return;

    if (membership.callerRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: project admins only' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
