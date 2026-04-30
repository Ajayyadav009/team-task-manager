const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/:projectId
router.get('/:projectId', protect, async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    const project = await Project.findById(projectId).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const membership = project.members.find((m) => m.user._id.toString() === req.user.id);
    if (!membership) {
      return res.status(403).json({ message: 'Access denied: you are not a member of this project' });
    }

    const now = new Date();
    const projectObjId = new mongoose.Types.ObjectId(projectId);
    const overdueFilter = { project: projectObjId, dueDate: { $lt: now, $ne: null }, status: { $ne: 'done' } };

    if (membership.role === 'admin') {
      const userObjId = new mongoose.Types.ObjectId(req.user.id);

      const [allTasks, overdueTasks, tasksByUserAgg] = await Promise.all([
        // All tasks in the project
        Task.find({ project: projectObjId }).select('status assignedTo'),

        // Overdue tasks with assignee details
        Task.find(overdueFilter)
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email')
          .sort({ dueDate: 1 }),

        // Per-user task counts via aggregation
        Task.aggregate([
          { $match: { project: projectObjId, assignedTo: { $ne: null } } },
          {
            $group: {
              _id: '$assignedTo',
              taskCount: { $sum: 1 },
              completedCount: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: 0,
              user: { _id: '$user._id', name: '$user.name', email: '$user.email' },
              taskCount: 1,
              completedCount: 1,
            },
          },
          { $sort: { taskCount: -1 } },
        ]),
      ]);

      const tasksByStatus = { todo: 0, inprogress: 0, done: 0 };
      for (const t of allTasks) tasksByStatus[t.status]++;

      return res.json({
        totalTasks: allTasks.length,
        tasksByStatus,
        tasksByUser: tasksByUserAgg,
        overdueTasks,
        totalMembers: project.members.length,
      });
    }

    // ── Member view ──────────────────────────────────────────────────────────
    const userObjId = new mongoose.Types.ObjectId(req.user.id);

    const [myTasks, myOverdue] = await Promise.all([
      Task.find({ project: projectObjId, assignedTo: userObjId }).select('status'),

      Task.find({ ...overdueFilter, assignedTo: userObjId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ dueDate: 1 }),
    ]);

    const tasksByStatus = { todo: 0, inprogress: 0, done: 0 };
    for (const t of myTasks) tasksByStatus[t.status]++;

    return res.json({
      totalTasks: myTasks.length,
      tasksByStatus,
      overdueTasks: myOverdue,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
