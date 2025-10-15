// Jira API Controller
// Handles HTTP requests and responses for Jira-related endpoints

const jiraService = require('../services/jiraService');
const credentialStore = require('../services/credentialStore');
const authService = require('../services/authService');

class JiraController {
  /**
   * Check if credentials are configured
   */
  async checkCredentials(req, res) {
    try {
      const isConfigured = credentialStore.isConfigured();
      const credentials = credentialStore.get();
      const hasValidSession = req.cookies.authToken && authService.validateSession(req.cookies.authToken);
      
      res.json({
        success: true,
        configured: isConfigured,
        authenticated: hasValidSession,
        hasUrl: !!credentials.jiraUrl,
        hasEmail: !!credentials.jiraEmail,
        hasToken: !!credentials.jiraApiToken
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Save credentials to backend store and create auth session
   */
  async saveCredentials(req, res) {
    try {
      const { jiraUrl, jiraEmail, jiraApiToken } = req.body;

      if (!jiraUrl || !jiraEmail || !jiraApiToken) {
        return res.status(400).json({
          success: false,
          error: 'All credentials are required'
        });
      }

      // Save to credential store
      credentialStore.save(jiraUrl, jiraEmail, jiraApiToken);

      // Create authentication session
      const sessionToken = authService.createSession();

      // Set secure cookie
      res.cookie('authToken', sessionToken, {
        httpOnly: true,  // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
        sameSite: 'strict',  // CSRF protection
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
      });

      res.json({
        success: true,
        message: 'Credentials saved successfully and session created'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Logout - destroy session and clear cookie
   */
  async logout(req, res) {
    try {
      const token = req.cookies.authToken;
      
      if (token) {
        authService.destroySession(token);
      }

      res.clearCookie('authToken');

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test Jira connection (accepts credentials in payload for initial test)
   */
  async testConnection(req, res) {
    try {
      const { jiraUrl, jiraEmail, jiraApiToken } = req.body;

      if (!jiraUrl || !jiraEmail || !jiraApiToken) {
        return res.status(400).json({
          success: false,
          error: 'All credentials are required for testing'
        });
      }

      const result = await jiraService.testConnection(jiraUrl, jiraEmail, jiraApiToken);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Fetch tickets from Jira (uses stored credentials, NO credentials in payload)
   * Requires authentication cookie
   */
  async fetchTickets(req, res) {
    try {
      // Check if credentials are configured
      if (!credentialStore.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'Jira credentials not configured. Please save your credentials in settings first.'
        });
      }

      const {
        jqlQuery,
        scoringMethod,
        customField,
        priorityWeights
      } = req.body;

      if (!jqlQuery) {
        return res.status(400).json({
          success: false,
          error: 'JQL query is required'
        });
      }

      const result = await jiraService.fetchTickets(jqlQuery, {
        scoringMethod,
        customField,
        priorityWeights
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Fetch support tickets from Jira (uses stored credentials, NO credentials in payload)
   * Requires authentication cookie
   */
  async fetchSupportTickets(req, res) {
    try {
      // Check if credentials are configured
      if (!credentialStore.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'Jira credentials not configured. Please save your credentials in settings first.'
        });
      }

      const { jqlQuery } = req.body;

      if (!jqlQuery) {
        return res.status(400).json({
          success: false,
          error: 'JQL query is required'
        });
      }

      const result = await jiraService.fetchSupportTickets(jqlQuery);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new JiraController();
