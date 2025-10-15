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

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

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
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 Jira Score Calculator Server                          ║
║                                                            ║
║  Environment: ${config.nodeEnv.padEnd(44)}║
║  Frontend:    http://localhost:${config.port}${' '.repeat(32)}║
║  Backend:     http://localhost:${config.port}${config.api.prefix}${' '.repeat(29)}║
║  Health:      http://localhost:${config.port}/health${' '.repeat(26)}║
║                                                            ║
║  🛡️  Security: XSS Protection ENABLED                     ║
║  🔒 Script injection attempts will be blocked             ║
║  🍪 Cookie-based authentication ENABLED                   ║
║                                                            ║
║  API Endpoints:                                            ║
║  • POST ${config.api.prefix}/save-credentials${' '.repeat(27)}║
║  • POST ${config.api.prefix}/test-connection${' '.repeat(30)}║
║  • POST ${config.api.prefix}/fetch-tickets (🔒 Protected)${' '.repeat(15)}║
║  • POST ${config.api.prefix}/fetch-support-tickets (🔒 Protected)${' '.repeat(5)}║
║                                                            ║
║  Press Ctrl+C to stop                                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
