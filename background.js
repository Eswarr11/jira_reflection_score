// Background Service Worker for Jira Score Calculator

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Jira Score Calculator installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchTickets') {
    handleFetchTickets(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'fetchSupportTickets') {
    handleFetchSupportTickets(request.data, sendResponse);
    return true;
  }
  
  if (request.action === 'testConnection') {
    handleTestConnection(request.data, sendResponse);
    return true;
  }
});

// Fetch tickets from Jira API
async function handleFetchTickets(data, sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'jiraUrl',
      'jiraEmail',
      'jiraApiToken',
      'scoringMethod',
      'customField',
      'priorityWeights'
    ]);

    if (!settings.jiraUrl || !settings.jiraEmail || !settings.jiraApiToken) {
      sendResponse({ 
        success: false, 
        error: 'Please configure Jira credentials in settings' 
      });
      return;
    }

    const jqlQuery = data.jqlQuery || 'order by created DESC';
    //const maxResults = data.maxResults || 100;

    // Clean Jira URL (remove trailing slash)
    let jiraUrl = settings.jiraUrl;
    if (jiraUrl.endsWith('/')) {
      jiraUrl = jiraUrl.slice(0, -1);
    }

    // Use the new /search/jql endpoint (as per Atlassian migration guide)
    const baseUrl = `${jiraUrl}/rest/api/3/search/jql`;
    
    const authString = btoa(`${settings.jiraEmail}:${settings.jiraApiToken}`);
    
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
    const maxPages = 100; // Safety limit to prevent infinite loops
    
    do {
      pageCount++;
      
      // Build request body with optional nextPageToken
      const requestBody = {
        jql: jqlQuery,
        fields: requestFields
      };
      
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      
      // Use POST method with JQL in body
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
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
          if (errorData.errors) {
            errorMessage += ' - ' + JSON.stringify(errorData.errors);
          }
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Accumulate issues from this page
      if (result.issues && result.issues.length > 0) {
        allIssues = allIssues.concat(result.issues);
      }
      
      // Check for next page
      nextPageToken = result.nextPageToken || null;
      
      // Safety check
      if (pageCount >= maxPages) {
        console.warn(`Reached maximum page limit (${maxPages}). Stopping pagination.`);
        break;
      }
      
    } while (nextPageToken);
    
    console.log(`Fetched ${allIssues.length} issues across ${pageCount} page(s)`);
    
    // Calculate scores for each ticket
    const ticketsWithScores = allIssues.map(issue => {
      const score = calculateTicketScore(issue, settings);
      const isFixed = isTicketFixed(issue.fields.status.name);
      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        storyPoints: issue.fields.customfield_10016 || 0,
        score: score,
        isFixed: isFixed,
        url: `${jiraUrl}/browse/${issue.key}`
      };
    });

    const totalScore = ticketsWithScores.reduce((sum, ticket) => sum + ticket.score, 0);
    const avgScore = ticketsWithScores.length > 0 ? totalScore / ticketsWithScores.length : 0;
    
    // Calculate quality score by priority
    const qualityScore = calculateQualityScore(ticketsWithScores);

    sendResponse({
      success: true,
      data: {
        tickets: ticketsWithScores,
        totalTickets: allIssues.length,
        totalScore: totalScore,
        avgScore: avgScore.toFixed(2),
        qualityScore: qualityScore
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Fetch support tickets from Jira API (simpler version, just count by status)
async function handleFetchSupportTickets(data, sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'jiraUrl',
      'jiraEmail',
      'jiraApiToken'
    ]);

    if (!settings.jiraUrl || !settings.jiraEmail || !settings.jiraApiToken) {
      sendResponse({ 
        success: false, 
        error: 'Please configure Jira credentials in settings' 
      });
      return;
    }

    const jqlQuery = data.jqlQuery || 'order by created DESC';

    // Clean Jira URL (remove trailing slash)
    let jiraUrl = settings.jiraUrl;
    if (jiraUrl.endsWith('/')) {
      jiraUrl = jiraUrl.slice(0, -1);
    }

    // Use the new /search/jql endpoint
    const baseUrl = `${jiraUrl}/rest/api/3/search/jql`;
    
    const authString = btoa(`${settings.jiraEmail}:${settings.jiraApiToken}`);
    
    const requestFields = ['status', 'key', 'summary'];
    
    // Fetch all pages of results
    let allIssues = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 100;
    
    do {
      pageCount++;
      
      const requestBody = {
        jql: jqlQuery,
        fields: requestFields
      };
      
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
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
          if (errorData.errors) {
            errorMessage += ' - ' + JSON.stringify(errorData.errors);
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
        console.warn(`Reached maximum page limit (${maxPages}). Stopping pagination.`);
        break;
      }
      
    } while (nextPageToken);
    
    console.log(`Fetched ${allIssues.length} support tickets across ${pageCount} page(s)`);
    
    // Count tickets by status
    const statusCounts = {};
    allIssues.forEach(issue => {
      const status = issue.fields.status.name;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    sendResponse({
      success: true,
      data: {
        total: allIssues.length,
        statusCounts: statusCounts
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Check if a ticket is considered "fixed" based on status
// These match the specific statuses from the TEG "Done" query
function isTicketFixed(status) {
  const fixedStatuses = [
    'Ready for Release',
    'Done',
    'Ready to Test',
    'Testing'
  ];
  // Exact match for these specific statuses
  return fixedStatuses.some(s => status.toLowerCase() === s.toLowerCase());
}

// Calculate quality score based on priority breakdown
function calculateQualityScore(tickets) {
  const priorityPoints = {
    'Urgent': 4,
    'Highest': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1,
    'Lowest': 1,
    'None': 1
  };
  
  // Group tickets by priority
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
  
  // Calculate scores for each priority
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

// Calculate score based on ticket and settings
function calculateTicketScore(issue, settings) {
  const scoringMethod = settings.scoringMethod || 'storyPoints';
  
  switch (scoringMethod) {
    case 'storyPoints':
      // Use story points field (adjust field name as needed)
      return issue.fields.customfield_10016 || 0;
    
    case 'priority':
      // Use priority-based scoring
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
      // Use custom field
      const customField = settings.customField || 'customfield_10016';
      return issue.fields[customField] || 0;
    
    case 'complexity':
      // Calculate complexity based on multiple factors
      let complexityScore = 0;
      
      // Factor 1: Number of comments
      complexityScore += Math.min(issue.fields.comment?.total || 0, 10) * 0.5;
      
      // Factor 2: Number of subtasks
      complexityScore += (issue.fields.subtasks?.length || 0) * 2;
      
      // Factor 3: Priority weight
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

// Test Jira connection
async function handleTestConnection(data, sendResponse) {
  try {
    let { jiraUrl, jiraEmail, jiraApiToken } = data;
    
    if (!jiraUrl || !jiraEmail || !jiraApiToken) {
      sendResponse({ 
        success: false, 
        error: 'Please provide all required credentials' 
      });
      return;
    }

    // Clean URL (remove trailing slash)
    if (jiraUrl.endsWith('/')) {
      jiraUrl = jiraUrl.slice(0, -1);
    }

    const url = `${jiraUrl}/rest/api/3/myself`;
    const authString = btoa(`${jiraEmail}:${jiraApiToken}`);
    
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
    
    sendResponse({
      success: true,
      message: `Connected successfully as ${userData.displayName}`,
      data: userData
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

