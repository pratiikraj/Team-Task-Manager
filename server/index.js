require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Exiting.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('DB connected');
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
