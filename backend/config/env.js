// Environment configuration management
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Jira Configuration
  jira: {
    url: process.env.JIRA_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN
  },
  
  // Security
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // API Configuration
  api: {
    prefix: '/api',
    version: 'v1'
  }
};

// Validate required environment variables
function validateConfig() {
  const required = ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  // Silent validation - credentials can be configured via UI
}

validateConfig();

module.exports = config;

