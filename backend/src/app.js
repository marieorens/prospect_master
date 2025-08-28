require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Import routes
const importRoutes = require('./routes/import');
const scrapeRoutes = require('./routes/scrape');
const exportRoutes = require('./routes/export');
const googleSearchRoutes = require('./routes/googleSearch');
const campaignRoutes = require('./routes/campaigns');
const emailRoutes = require('./routes/email');
const emailTestRoutes = require('./routes/emailTest');
const analyticsRoutes = require('./routes/analytics');
const { router: feedbackRoutes, initializeWebSocket } = require('./routes/feedback');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Routes
app.use('/api/import', importRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/google-search', googleSearchRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-test', emailTestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ab-testing', require('./routes/abTesting'));
app.use('/api/cache', require('./routes/cache'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get logs
app.get('/api/logs', (req, res) => {
  try {
    const logFiles = fs.readdirSync(logsDir);
    const logs = {};
    
    logFiles.forEach(file => {
      const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
      logs[file] = content.split('\n').slice(-100).join('\n'); // Last 100 lines
    });
    
    res.json(logs);
  } catch (error) {
    logger.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket server for real-time feedback
initializeWebSocket(server);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  console.error('Uncaught exception:', error);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', reason);
  console.error('Unhandled rejection:', reason);
});

module.exports = app;