const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let projectIds;
    if (req.query.project && mongoose.Types.ObjectId.isValid(req.query.project)) {
      const p = await Project.findById(req.query.project);
      if (!p || !p.hasMember(req.user._id)) return res.status(403).json({ error: 'No access' });
      projectIds = [p._id];
    } else {
      const myProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      projectIds = myProjects.map(p => p._id);
    }

    const baseFilter = { project: { $in: projectIds } };
    const now = new Date();

    const [total, byStatus, perUserRaw, overdue] = await Promise.all([
      Task.countDocuments(baseFilter),
      Task.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$assignee', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: { $ifNull: ['$user.name', 'Unassigned'] },
            email: '$user.email',
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ]),
      Task.countDocuments({ ...baseFilter, dueDate: { $lt: now, $ne: null }, status: { $ne: 'Done' } })
    ]);

    const statusMap = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
    byStatus.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      total,
      byStatus: statusMap,
      perUser: perUserRaw,
      overdue
    });
  } catch (e) { next(e); }
});

module.exports = router;
