const mongoose = require('mongoose');

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 4000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'To Do' }
}, { timestamps: true });

taskSchema.statics.STATUSES = STATUSES;
taskSchema.statics.PRIORITIES = PRIORITIES;

module.exports = mongoose.model('Task', taskSchema);
