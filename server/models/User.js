const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email']
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  }
}, { timestamps: true });

userSchema.statics.hashPassword = async function (plain) {
  const rounds = 10;
  return bcrypt.hash(plain, rounds);
};

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
