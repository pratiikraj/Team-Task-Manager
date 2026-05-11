const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [memberSchema], default: [] }
}, { timestamps: true });

projectSchema.methods.getRoleOf = function (userId) {
  const found = this.members.find(m => String(m.user) === String(userId));
  return found ? found.role : null;
};

projectSchema.methods.isAdmin = function (userId) {
  return this.getRoleOf(userId) === 'Admin';
};

projectSchema.methods.hasMember = function (userId) {
  return this.members.some(m => String(m.user) === String(userId));
};

module.exports = mongoose.model('Project', projectSchema);
