const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const roleRoutes      = require('./routes/roleRoutes');
const siteRoutes      = require('./routes/siteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TenantFlow API' });
});

// Routes
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/roles',     roleRoutes);
app.use('/api/v1/sites',     siteRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
