// Jira API Service
// Handles all interactions with Jira REST API

const credentialStore = require('./credentialStore');

class JiraService {
  /**
   * Get credentials from store
   */
  getCredentials() {
    return credentialStore.get();
  }

  /**
   * Get authorization header for Jira API
   */
  getAuthHeader() {
    const creds = this.getCredentials();
    const authString = Buffer.from(`${creds.jiraEmail}:${creds.jiraApiToken}`).toString('base64');
    return `Basic ${authString}`;
  }

  /**
   * Clean Jira URL (remove trailing slash)
   */
  cleanJiraUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Test connection to Jira (accepts credentials as parameter for initial test)
   */
  async testConnection(jiraUrl, jiraEmail, jiraApiToken) {
    const cleanUrl = this.cleanJiraUrl(jiraUrl);
    const url = `${cleanUrl}/rest/api/3/myself`;
    const authString = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    return {
      success: true,
      message: `Connected successfully as ${userData.displayName}`,
      data: userData
    };
  }

  /**
   * Fetch tickets from Jira with pagination (uses stored credentials)
   */
  async fetchTickets(jqlQuery, options = {}) {
    const creds = this.getCredentials();
    
    if (!creds.jiraUrl || !creds.jiraEmail || !creds.jiraApiToken) {
      throw new Error('Jira credentials not configured. Please save your credentials in settings.');
    }

    const {
      scoringMethod = 'priority',
      customField = null,
      priorityWeights = null
    } = options;

    const cleanUrl = this.cleanJiraUrl(creds.jiraUrl);
    const baseUrl = `${cleanUrl}/rest/api/3/search/jql`;

    const requestFields = [
      'summary',
      'status',
      'priority',
      'assignee',
      'created',
      'updated',
      'customfield_10016', // Story points
      'comment',
      'subtasks'
    ];

    // Fetch all pages of results
    let allIssues = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 100;

    do {
      pageCount++;

      const requestBody = {
        jql: jqlQuery || 'order by created DESC',
        fields: requestFields
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `Jira API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.errorMessages && errorData.errorMessages.length > 0) {
            errorMessage += ' - ' + errorData.errorMessages.join(', ');
          }
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.issues && result.issues.length > 0) {
        allIssues = allIssues.concat(result.issues);
      }

      nextPageToken = result.nextPageToken || null;

      if (pageCount >= maxPages) {
        break;
      }

    } while (nextPageToken);

    // Calculate scores for each ticket
    const ticketsWithScores = allIssues.map(issue => {
      const score = this.calculateTicketScore(issue, { 
        scoringMethod, 
        customField, 
        priorityWeights 
      });
      const isFixed = this.isTicketFixed(issue.fields.status.name);
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        storyPoints: issue.fields.customfield_10016 || 0,
        score: score,
        isFixed: isFixed,
        url: `${cleanUrl}/browse/${issue.key}`
      };
    });

    const totalScore = ticketsWithScores.reduce((sum, ticket) => sum + ticket.score, 0);
    const avgScore = ticketsWithScores.length > 0 ? totalScore / ticketsWithScores.length : 0;

    const qualityScore = this.calculateQualityScore(ticketsWithScores);

    return {
      tickets: ticketsWithScores,
      totalTickets: allIssues.length,
      totalScore: totalScore,
      avgScore: avgScore.toFixed(2),
      qualityScore: qualityScore,
      paginationInfo: {
        pagesFetched: pageCount,
        hadMultiplePages: pageCount > 1
      }
    };
  }

  /**
   * Fetch support tickets from Jira (uses stored credentials)
   */
  async fetchSupportTickets(jqlQuery) {
    const creds = this.getCredentials();
    
    if (!creds.jiraUrl || !creds.jiraEmail || !creds.jiraApiToken) {
      throw new Error('Jira credentials not configured. Please save your credentials in settings.');
    }

    const cleanUrl = this.cleanJiraUrl(creds.jiraUrl);
    const baseUrl = `${cleanUrl}/rest/api/3/search/jql`;

    const requestFields = ['status', 'key', 'summary'];

    let allIssues = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 100;

    do {
      pageCount++;

      const requestBody = {
        jql: jqlQuery || 'order by created DESC',
        fields: requestFields
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `Jira API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.errorMessages && errorData.errorMessages.length > 0) {
            errorMessage += ' - ' + errorData.errorMessages.join(', ');
          }
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.issues && result.issues.length > 0) {
        allIssues = allIssues.concat(result.issues);
      }

      nextPageToken = result.nextPageToken || null;

      if (pageCount >= maxPages) {
        break;
      }

    } while (nextPageToken);

    // Count tickets by status
    const statusCounts = {};
    allIssues.forEach(issue => {
      const status = issue.fields.status.name;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      total: allIssues.length,
      statusCounts: statusCounts,
      paginationInfo: {
        pagesFetched: pageCount,
        hadMultiplePages: pageCount > 1
      }
    };
  }

  /**
   * Check if ticket is fixed
   */
  isTicketFixed(status) {
    const fixedStatuses = [
      'Ready for Release',
      'Done',
      'Ready to Test',
      'Testing',
      'Closed'
    ];
    return fixedStatuses.some(s => status.toLowerCase() === s.toLowerCase());
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(tickets) {
    const priorityPoints = {
      'Urgent': 4,
      'Highest': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1,
      'Lowest': 1,
      'None': 1
    };

    const priorityBreakdown = {};

    tickets.forEach(ticket => {
      const priority = ticket.priority || 'None';
      if (!priorityBreakdown[priority]) {
        priorityBreakdown[priority] = {
          priority: priority,
          points: priorityPoints[priority] || 1,
          totalCount: 0,
          fixedCount: 0,
          totalScore: 0,
          fixedScore: 0
        };
      }

      priorityBreakdown[priority].totalCount++;
      if (ticket.isFixed) {
        priorityBreakdown[priority].fixedCount++;
      }
    });

    let overallTotalScore = 0;
    let overallFixedScore = 0;

    Object.values(priorityBreakdown).forEach(item => {
      item.totalScore = item.points * item.totalCount;
      item.fixedScore = item.points * item.fixedCount;
      overallTotalScore += item.totalScore;
      overallFixedScore += item.fixedScore;
    });

    const qualityScorePercentage = overallTotalScore > 0
      ? (overallFixedScore / overallTotalScore) * 100
      : 0;

    return {
      breakdown: Object.values(priorityBreakdown).sort((a, b) => b.points - a.points),
      overallTotalScore: overallTotalScore,
      overallFixedScore: overallFixedScore,
      qualityScorePercentage: qualityScorePercentage.toFixed(2),
      totalTickets: tickets.length,
      fixedTickets: tickets.filter(t => t.isFixed).length
    };
  }

  /**
   * Calculate ticket score based on scoring method
   */
  calculateTicketScore(issue, settings) {
    const scoringMethod = settings.scoringMethod || 'priority';

    switch (scoringMethod) {
      case 'storyPoints':
        return issue.fields.customfield_10016 || 0;

      case 'priority':
        const priority = issue.fields.priority?.name;
        const weights = settings.priorityWeights || {
          'Highest': 5,
          'High': 4,
          'Medium': 3,
          'Low': 2,
          'Lowest': 1
        };
        return weights[priority] || 0;

      case 'custom':
        const customField = settings.customField || 'customfield_10016';
        return issue.fields[customField] || 0;

      case 'complexity':
        let complexityScore = 0;
        complexityScore += Math.min(issue.fields.comment?.total || 0, 10) * 0.5;
        complexityScore += (issue.fields.subtasks?.length || 0) * 2;
        const priorityWeight = {
          'Highest': 5,
          'High': 4,
          'Medium': 3,
          'Low': 2,
          'Lowest': 1
        };
        complexityScore += priorityWeight[issue.fields.priority?.name] || 0;
        return Math.round(complexityScore);

      default:
        return 0;
    }
  }
}

module.exports = new JiraService();
