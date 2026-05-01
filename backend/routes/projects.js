const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Load project and verify the requesting user is a project-level admin
const requireProjectAdmin = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { status: 404, message: 'Project not found' };

  const membership = project.members.find((m) => m.user.toString() === userId);
  if (!membership || membership.role !== 'admin') {
    return { status: 403, message: 'Access denied: project admins only' };
  }

  return { project };
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/projects — create project; only system admins can create (creator becomes project admin)
router.post('/', protect, isAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const project = await Project.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }],
    });

    await project.populate('createdBy', 'name email');
    await project.populate('members.user', 'name email role');

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects — return all projects where the logged-in user is a member
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id — return single project (requester must be a member)
router.get('/:id', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    const project = await Project.findOne({
      _id: req.params.id,
      'members.user': req.user.id,
    })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/projects/:id/members — add member by email (project admin only)
router.post('/:id/members', protect, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const { project, status, message } = await requireProjectAdmin(req.params.id, req.user.id);
    if (!project) return res.status(status).json({ message });

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ message: 'User is already a member of this project' });
    }

    project.members.push({ user: userToAdd._id, role: 'member' });
    await project.save();
    await project.populate('members.user', 'name email role');

    res.status(201).json({ message: 'Member added successfully', members: project.members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (project admin only)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  const { id, userId } = req.params;

  if (!isValidId(id) || !isValidId(userId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Prevent an admin from accidentally removing themselves if they are the only admin
  try {
    const { project, status, message } = await requireProjectAdmin(id, req.user.id);
    if (!project) return res.status(status).json({ message });

    const targetMember = project.members.find((m) => m.user.toString() === userId);
    if (!targetMember) {
      return res.status(404).json({ message: 'User is not a member of this project' });
    }

    if (targetMember.role === 'admin') {
      const adminCount = project.members.filter((m) => m.role === 'admin').length;
      if (adminCount === 1) {
        return res.status(400).json({ message: 'Cannot remove the only admin of the project' });
      }
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({ message: 'Member removed successfully', members: project.members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
