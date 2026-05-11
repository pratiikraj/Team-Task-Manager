const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const loadProject = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid project id' });
  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!project.hasMember(req.user._id)) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.project = project;
  next();
};

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');
    res.json({ projects });
  } catch (e) { next(e); }
});

router.post(
  '/',
  requireAuth,
  [
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().isLength({ max: 1000 })
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: 'Validation failed' });
    try {
      const { name, description = '' } = req.body;
      const project = await Project.create({
        name,
        description,
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'Admin' }]
      });
      const populated = await project.populate('members.user', 'name email');
      res.status(201).json({ project: populated });
    } catch (e) { next(e); }
  }
);

router.get('/:id', requireAuth, loadProject, async (req, res, next) => {
  try {
    const populated = await req.project
      .populate('owner', 'name email')
      .then(p => p.populate('members.user', 'name email'));
    res.json({ project: populated });
  } catch (e) { next(e); }
});

router.post(
  '/:id/members',
  requireAuth,
  loadProject,
  [body('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    if (!req.project.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Admins only' });
    }
    try {
      const { email, role = 'Member' } = req.body;
      const target = await User.findOne({ email });
      if (!target) return res.status(404).json({ error: 'User with that email not found' });
      if (req.project.hasMember(target._id)) {
        return res.status(409).json({ error: 'User already in project' });
      }
      req.project.members.push({ user: target._id, role: role === 'Admin' ? 'Admin' : 'Member' });
      await req.project.save();
      const populated = await req.project.populate('members.user', 'name email');
      res.json({ project: populated });
    } catch (e) { next(e); }
  }
);

router.delete('/:id/members/:userId', requireAuth, loadProject, async (req, res, next) => {
  if (!req.project.isAdmin(req.user._id)) {
    return res.status(403).json({ error: 'Admins only' });
  }
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return res.status(400).json({ error: 'Invalid user id' });
    if (String(req.project.owner) === String(userId)) {
      return res.status(400).json({ error: 'Cannot remove the project owner' });
    }
    req.project.members = req.project.members.filter(m => String(m.user) !== String(userId));
    await req.project.save();
    await Task.updateMany(
      { project: req.project._id, assignee: userId },
      { $set: { assignee: null } }
    );
    const populated = await req.project.populate('members.user', 'name email');
    res.json({ project: populated });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, loadProject, async (req, res, next) => {
  if (String(req.project.owner) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Only the owner can delete this project' });
  }
  try {
    await Task.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
