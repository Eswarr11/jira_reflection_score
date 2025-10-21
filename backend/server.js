const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders, sanitizeRequest, blockScriptInjection } = require('./middleware/security');
const { validateRequestBody } = require('./middleware/validation');

// Import routes
const jiraRoutes = require('./routes/jiraRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(blockScriptInjection);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// API routes
app.use('/api', jiraRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from frontend directory (original HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve main app for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve settings page
app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/settings.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Application: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});