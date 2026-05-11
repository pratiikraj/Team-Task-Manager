const express = require('express');
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const loadTaskAndProject = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid task id' });
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = await Project.findById(task.project);
  if (!project) return res.status(404).json({ error: 'Parent project missing' });
  if (!project.hasMember(req.user._id)) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.task = task;
  req.project = project;
  next();
};

router.get(
  '/',
  requireAuth,
  [query('project').optional().isMongoId(), query('status').optional().isString()],
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.project) {
        const project = await Project.findById(req.query.project);
        if (!project || !project.hasMember(req.user._id)) {
          return res.status(403).json({ error: 'No access to this project' });
        }
        filter.project = project._id;
      } else {
        const myProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
        filter.project = { $in: myProjects.map(p => p._id) };
      }
      if (req.query.status) filter.status = req.query.status;
      if (req.query.assignee === 'me') filter.assignee = req.user._id;

      const tasks = await Task.find(filter)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name')
        .sort({ dueDate: 1, createdAt: -1 });
      res.json({ tasks });
    } catch (e) { next(e); }
  }
);

router.post(
  '/',
  requireAuth,
  [
    body('project').isMongoId(),
    body('title').isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString().isLength({ max: 4000 }),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('priority').optional().isIn(Task.PRIORITIES),
    body('status').optional().isIn(Task.STATUSES),
    body('assignee').optional({ nullable: true }).isMongoId()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errs.array() });
    try {
      const project = await Project.findById(req.body.project);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (!project.isAdmin(req.user._id)) {
        return res.status(403).json({ error: 'Only Admins can create tasks' });
      }
      if (req.body.assignee && !project.hasMember(req.body.assignee)) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
      const task = await Task.create({
        project: project._id,
        title: req.body.title,
        description: req.body.description || '',
        dueDate: req.body.dueDate || null,
        priority: req.body.priority || 'Medium',
        status: req.body.status || 'To Do',
        assignee: req.body.assignee || null,
        createdBy: req.user._id
      });
      const populated = await task.populate([
        { path: 'assignee', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
        { path: 'project', select: 'name' }
      ]);
      res.status(201).json({ task: populated });
    } catch (e) { next(e); }
  }
);

router.patch(
  '/:id',
  requireAuth,
  loadTaskAndProject,
  [
    body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString().isLength({ max: 4000 }),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('priority').optional().isIn(Task.PRIORITIES),
    body('status').optional().isIn(Task.STATUSES),
    body('assignee').optional({ nullable: true }).isMongoId()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: 'Validation failed' });
    try {
      const isAdmin = req.project.isAdmin(req.user._id);
      const isAssignee = String(req.task.assignee) === String(req.user._id);
      const incoming = req.body;

      const allowedForMember = ['status'];
      const updates = {};

      for (const key of Object.keys(incoming)) {
        if (isAdmin || (isAssignee && allowedForMember.includes(key))) {
          updates[key] = incoming[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you (status only) or as Admin' });
      }

      if (updates.assignee && !req.project.hasMember(updates.assignee)) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }

      Object.assign(req.task, updates);
      await req.task.save();

      const populated = await req.task.populate([
        { path: 'assignee', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
        { path: 'project', select: 'name' }
      ]);
      res.json({ task: populated });
    } catch (e) { next(e); }
  }
);

router.delete('/:id', requireAuth, loadTaskAndProject, async (req, res, next) => {
  if (!req.project.isAdmin(req.user._id)) {
    return res.status(403).json({ error: 'Admins only' });
  }
  try {
    await req.task.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
