// In-memory credential store
// Stores Jira credentials after user saves them in settings

class CredentialStore {
  constructor() {
    this.credentials = {
      jiraUrl: null,
      jiraEmail: null,
      jiraApiToken: null
    };
    
    // Try to load from environment variables on startup
    this.loadFromEnv();
  }

  /**
   * Load credentials from environment variables
   */
  loadFromEnv() {
    const config = require('../config/env');
    
    if (config.jira.url && config.jira.email && config.jira.apiToken) {
      this.credentials = {
        jiraUrl: config.jira.url,
        jiraEmail: config.jira.email,
        jiraApiToken: config.jira.apiToken
      };
    }
  }

  /**
   * Save credentials (from user input)
   */
  save(jiraUrl, jiraEmail, jiraApiToken) {
    this.credentials = {
      jiraUrl,
      jiraEmail,
      jiraApiToken
    };
  }

  /**
   * Get stored credentials
   */
  get() {
    return this.credentials;
  }

  /**
   * Check if credentials are configured
   */
  isConfigured() {
    return !!(
      this.credentials.jiraUrl && 
      this.credentials.jiraEmail && 
      this.credentials.jiraApiToken
    );
  }

  /**
   * Clear credentials
   */
  clear() {
    this.credentials = {
      jiraUrl: null,
      jiraEmail: null,
      jiraApiToken: null
    };
  }
}

// Export singleton instance
module.exports = new CredentialStore();

