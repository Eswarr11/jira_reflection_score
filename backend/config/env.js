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
  
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('   The application will still start, but Jira API calls will fail.');
    console.warn('   Please configure these in your .env file.');
  }
}

validateConfig();

module.exports = config;

