// Jira API Routes

const express = require('express');
const router = express.Router();
const jiraController = require('../controllers/jiraController');
const { validateRequestBody } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/check-credentials
 * Check if credentials are configured (no auth required)
 */
router.get('/check-credentials',
  jiraController.checkCredentials.bind(jiraController)
);

/**
 * POST /api/save-credentials
 * Save Jira credentials to backend and create session (no auth required for first setup)
 */
router.post('/save-credentials',
  validateRequestBody(['jiraUrl', 'jiraEmail', 'jiraApiToken']),
  jiraController.saveCredentials.bind(jiraController)
);

/**
 * POST /api/logout
 * Logout and destroy session (no auth required)
 */
router.post('/logout',
  jiraController.logout.bind(jiraController)
);

/**
 * POST /api/test-connection
 * Test connection to Jira (no auth required for testing before save)
 */
router.post('/test-connection',
  validateRequestBody(['jiraUrl', 'jiraEmail', 'jiraApiToken']),
  jiraController.testConnection.bind(jiraController)
);

/**
 * POST /api/fetch-tickets
 * Fetch tickets from Jira with scoring
 * 🔒 PROTECTED - Requires authentication cookie
 */
router.post('/fetch-tickets',
  requireAuth,  // Authentication required!
  validateRequestBody(['jqlQuery']),
  jiraController.fetchTickets.bind(jiraController)
);

/**
 * POST /api/fetch-support-tickets
 * Fetch support tickets from Jira
 * 🔒 PROTECTED - Requires authentication cookie
 */
router.post('/fetch-support-tickets',
  requireAuth,  // Authentication required!
  validateRequestBody(['jqlQuery']),
  jiraController.fetchSupportTickets.bind(jiraController)
);

module.exports = router;
