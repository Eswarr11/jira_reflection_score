// Main server entry point for Jira Score Calculator

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/env');
const jiraRoutes = require('./routes/jiraRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { securityHeaders, sanitizeRequest, blockScriptInjection } = require('./middleware/security');

const app = express();

// Security middleware (FIRST - before any other middleware)
app.use(securityHeaders);

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true  // Important: Allow cookies to be sent
}));
app.use(cookieParser());  // Parse cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// XSS Protection middleware
app.use(sanitizeRequest);
app.use(blockScriptInjection);

// Request logging removed for production

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use(config.api.prefix, jiraRoutes);

// Serve index.html for root and any unmatched routes (SPA support)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    security: 'XSS protection enabled',
    auth: 'Cookie-based authentication'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  // Server started
});

module.exports = app;
