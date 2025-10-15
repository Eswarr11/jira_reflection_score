// Web App script for Jira Score Calculator
// Updated with cookie-based authentication

let currentTemplate = 'teg';

// API base URL
const API_BASE_URL = '/api';

// HTML escape function to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize text content
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  text = text.replace(/javascript:/gi, '');
  
  return text;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI
  await checkConnectionStatus();
  await loadSavedFilters();
  
  updateJqlPreview();
  
  // Event listeners
  document.getElementById('fetchTickets').addEventListener('click', fetchTickets);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  
  // Template switching
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      switchTemplate(e.target.dataset.template);
    });
  });
  
  // Query builder inputs
  const inputs = ['projectName', 'issueType', 'startDate', 'endDate', 'thriveSquad'];
  inputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', updateJqlPreview);
    }
  });
  
  // Checkbox changes
  document.querySelectorAll('.checkbox-group input').forEach(checkbox => {
    checkbox.addEventListener('change', updateJqlPreview);
  });
  
  // Clear date buttons
  document.querySelectorAll('.clear-date-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.dataset.target;
      document.getElementById(targetId).value = '';
      updateJqlPreview();
    });
  });
  
  // Reset filters button
  document.getElementById('resetFilters').addEventListener('click', resetToDefaults);
  
  updateJqlPreview();
});

// Check authentication and connection status
async function checkConnectionStatus() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  try {
    // Check if credentials are configured and session is authenticated
    const response = await fetch(`${API_BASE_URL}/check-credentials`, {
      credentials: 'include'  // Include cookies
    });
    const result = await response.json();
    
    if (result.success && result.configured && result.authenticated) {
      statusIndicator.classList.remove('disconnected');
      statusIndicator.classList.add('connected');
      statusText.textContent = 'Connected (Authenticated)';
    } else if (result.success && result.configured) {
      statusIndicator.classList.remove('disconnected');
      statusIndicator.classList.add('connected');
      statusText.textContent = 'Connected (Session Expired)';
    } else {
      statusIndicator.classList.remove('connected');
      statusIndicator.classList.add('disconnected');
      statusText.textContent = 'Not Configured';
    }
  } catch (error) {
    statusIndicator.classList.remove('connected');
    statusIndicator.classList.add('disconnected');
    statusText.textContent = 'Server Error';
  }
}

function switchTemplate(template) {
  currentTemplate = template;
  
  if (template === 'custom') {
    document.getElementById('tegQueryBuilder').style.display = 'none';
    document.getElementById('customQueryInput').style.display = 'block';
  } else if (template === 'teg') {
    document.getElementById('tegQueryBuilder').style.display = 'block';
    document.getElementById('customQueryInput').style.display = 'none';
    updateJqlPreview();
  }
}

function buildTegQuery() {
  const project = sanitizeText(document.getElementById('projectName').value.trim());
  const issueType = sanitizeText(document.getElementById('issueType').value);
  const startDate = sanitizeText(document.getElementById('startDate').value);
  const endDate = sanitizeText(document.getElementById('endDate').value);
  const thriveSquad = sanitizeText(document.getElementById('thriveSquad').value.trim());
  
  const excludedStatuses = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => sanitizeText(cb.value));
  
  let queryParts = [];
  
  if (project) queryParts.push(`project = "${project}"`);
  if (startDate) queryParts.push(`created >= "${startDate}"`);
  if (endDate) queryParts.push(`created <= "${endDate}"`);
  if (issueType) queryParts.push(`type = ${issueType}`);
  if (thriveSquad) queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  if (excludedStatuses.length > 0) queryParts.push(`status NOT IN (${excludedStatuses.join(', ')})`);
  
  let jql;
  if (queryParts.length > 0) {
    jql = queryParts.join(' AND ');
    jql += ' ORDER BY created DESC';
  } else {
    jql = 'ORDER BY created DESC';
  }
  
  return jql;
}

function updateJqlPreview() {
  if (currentTemplate === 'teg') {
    const jql = buildTegQuery();
    const displayJql = jql.replace(/ AND /g, '\nAND ').replace(' ORDER BY', '\nORDER BY');
    document.getElementById('generatedJql').textContent = displayJql;
    saveFilters();
  }
}

async function saveFilters() {
  const filters = {
    projectName: document.getElementById('projectName').value,
    issueType: document.getElementById('issueType').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    thriveSquad: document.getElementById('thriveSquad').value,
    excludedStatuses: Array.from(document.querySelectorAll('.checkbox-group input:checked'))
      .map(cb => cb.value)
  };
  
  localStorage.setItem('savedFilters', JSON.stringify(filters));
}

async function loadSavedFilters() {
  const stored = localStorage.getItem('savedFilters');
  const savedFilters = stored ? JSON.parse(stored) : null;
  
  if (savedFilters) {
    if (savedFilters.projectName !== undefined) document.getElementById('projectName').value = savedFilters.projectName;
    if (savedFilters.issueType !== undefined) document.getElementById('issueType').value = savedFilters.issueType;
    if (savedFilters.startDate !== undefined) document.getElementById('startDate').value = savedFilters.startDate;
    if (savedFilters.endDate !== undefined) document.getElementById('endDate').value = savedFilters.endDate;
    if (savedFilters.thriveSquad !== undefined) document.getElementById('thriveSquad').value = savedFilters.thriveSquad;
    
    if (savedFilters.excludedStatuses) {
      document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = savedFilters.excludedStatuses.includes(cb.value);
      });
    }
  }
}

async function resetToDefaults() {
  localStorage.removeItem('savedFilters');
  
  document.getElementById('projectName').value = 'TEG';
  document.getElementById('issueType').value = 'Bug';
  document.getElementById('startDate').value = '2025-08-25';
  document.getElementById('endDate').value = '2025-10-13';
  document.getElementById('thriveSquad').value = 'OKR';
  
  // Set default checked statuses (DEFERRED and Invalid, but not Closed)
  document.querySelectorAll('.checkbox-group input').forEach(cb => {
    cb.checked = true;
  });
  
  updateJqlPreview();
  
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Filters reset to defaults';
  statusEl.className = 'status-message';
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status-message hidden';
  }, 2000);
}

function buildSupportTicketsQuery() {
  const project = sanitizeText(document.getElementById('projectName').value.trim());
  const startDate = sanitizeText(document.getElementById('startDate').value);
  const endDate = sanitizeText(document.getElementById('endDate').value);
  const thriveSquad = sanitizeText(document.getElementById('thriveSquad').value.trim());
  
  let queryParts = [];
  
  if (project) queryParts.push(`project = "${project}"`);
  if (startDate) queryParts.push(`created >= "${startDate}"`);
  if (endDate) queryParts.push(`created <= "${endDate}"`);
  queryParts.push('type = Support');
  if (thriveSquad) queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  
  let jql = queryParts.join(' AND ');
  if (jql) {
    jql += ' ORDER BY created DESC';
  } else {
    jql = 'ORDER BY created DESC';
  }
  
  return jql;
}

// Fetch tickets - uses cookie authentication
async function fetchTickets() {
  let jqlQuery;
  
  if (currentTemplate === 'teg') {
    jqlQuery = buildTegQuery();
  } else {
    jqlQuery = sanitizeText(document.getElementById('jqlQuery').value);
  }
  
  const loadingEl = document.getElementById('loading');
  const resultsEl = document.getElementById('results');
  const errorEl = document.getElementById('error');
  
  loadingEl.classList.remove('hidden');
  resultsEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  
  try {
    const settings = localStorage.getItem('userPreferences') 
      ? JSON.parse(localStorage.getItem('userPreferences')) 
      : {};
    
    // Call with cookie authentication
    const response = await fetch(`${API_BASE_URL}/fetch-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',  // Include auth cookie
      body: JSON.stringify({
        jqlQuery: jqlQuery,
        scoringMethod: settings.scoringMethod || 'priority',
        customField: settings.customField,
        priorityWeights: settings.priorityWeights
      })
    });
    
    const result = await response.json();
    
    loadingEl.classList.add('hidden');
    
    if (response.status === 401) {
      // Session expired, redirect to settings
      showError('Session expired. Please reconfigure your credentials in settings.');
      setTimeout(() => {
        window.location.href = 'settings.html';
      }, 2000);
      return;
    }
    
    if (result.success) {
      displayResults(result.data);
      
      // Fetch support tickets
      if (currentTemplate === 'teg') {
        try {
          const supportJqlQuery = buildSupportTicketsQuery();
          const supportResponse = await fetch(`${API_BASE_URL}/fetch-support-tickets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              jqlQuery: supportJqlQuery
            })
          });
          
          if (supportResponse.ok) {
            const supportResult = await supportResponse.json();
            if (supportResult.success) {
              displaySupportTickets(supportResult.data);
            }
          }
        } catch (supportError) {
          // Silently fail for support tickets
        }
      }
      
      resultsEl.classList.remove('hidden');
    } else {
      showError(result.error || 'Unknown error occurred');
    }
  } catch (error) {
    loadingEl.classList.add('hidden');
    showError(error.message);
  }
}

// Display results with XSS protection
function displayResults(data) {
  // Implementation continues as before with escapeHtml...
  // (keeping the rest of the function the same)
  const statusEl = document.getElementById('status');
  if (data.tickets && data.tickets.length > 0) {
    let message = `✓ Loaded ${data.tickets.length} ticket${data.tickets.length !== 1 ? 's' : ''}`;
    if (data.paginationInfo && data.paginationInfo.hadMultiplePages) {
      message += ` (${data.paginationInfo.pagesFetched} pages)`;
    }
    statusEl.textContent = message;
    statusEl.className = 'status-message';
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status-message hidden';
    }, 3000);
  }
  
  if (data.qualityScore) {
    document.getElementById('qualityPercentage').textContent = escapeHtml(data.qualityScore.qualityScorePercentage) + '%';
    document.getElementById('fixedTickets').textContent = escapeHtml(data.qualityScore.fixedTickets);
    document.getElementById('totalTicketsQuality').textContent = escapeHtml(data.qualityScore.totalTickets);
    document.getElementById('fixedScore').textContent = escapeHtml(data.qualityScore.overallFixedScore);
    document.getElementById('totalScoreQuality').textContent = escapeHtml(data.qualityScore.overallTotalScore);
    
    const jiraUrl = data.tickets && data.tickets.length > 0 
      ? data.tickets[0].url.split('/browse/')[0]
      : 'https://surveysparrow.atlassian.net';
    
    const breakdownBody = document.getElementById('breakdownBody');
    breakdownBody.innerHTML = '';
    
    // Calculate totals
    let totalCount = 0;
    let totalScore = 0;
    let fixedCount = 0;
    let fixedScore = 0;
    let openCount = 0;
    
    data.qualityScore.breakdown.forEach(item => {
      const row = document.createElement('tr');
      
      const totalJql = buildJqlForPriority(item.priority, 'all');
      const fixedJql = buildJqlForPriority(item.priority, 'fixed');
      const openJql = buildJqlForPriority(item.priority, 'open');
      
      const itemOpenCount = item.totalCount - item.fixedCount;
      
      // Add to totals
      totalCount += item.totalCount;
      totalScore += item.totalScore;
      fixedCount += item.fixedCount;
      fixedScore += item.fixedScore;
      openCount += itemOpenCount;
      
      row.innerHTML = `
        <td class="priority-cell priority-${escapeHtml(item.priority.toLowerCase())}">${escapeHtml(item.priority)}</td>
        <td>${escapeHtml(item.points)}</td>
        <td>
          <div class="cell-with-link">
            <span>${escapeHtml(item.totalCount)}</span>
            <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(totalJql)}" target="_blank" class="jira-link">↗</a>
          </div>
        </td>
        <td>${escapeHtml(item.totalScore)}</td>
        <td>
          <div class="cell-with-link">
            <span>${escapeHtml(item.fixedCount)}</span>
            <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(fixedJql)}" target="_blank" class="jira-link">↗</a>
          </div>
        </td>
        <td>${escapeHtml(item.fixedScore)}</td>
        <td>
          <div class="cell-with-link">
            <span>${escapeHtml(itemOpenCount)}</span>
            <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(openJql)}" target="_blank" class="jira-link">↗</a>
          </div>
        </td>
      `;
      breakdownBody.appendChild(row);
    });
    
    // Add totals row
    const totalJqlAll = buildJqlForPriority('all', 'all');
    const totalJqlFixed = buildJqlForPriority('all', 'fixed');
    const totalJqlOpen = buildJqlForPriority('all', 'open');
    
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.innerHTML = `
      <td style="font-weight: bold;">Total</td>
      <td></td>
      <td style="font-weight: bold;">
        <div class="cell-with-link">
          <span>${escapeHtml(totalCount)}</span>
          <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(totalJqlAll)}" target="_blank" class="jira-link">↗</a>
        </div>
      </td>
      <td style="font-weight: bold;">${escapeHtml(totalScore)}</td>
      <td style="font-weight: bold;">
        <div class="cell-with-link">
          <span>${escapeHtml(fixedCount)}</span>
          <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(totalJqlFixed)}" target="_blank" class="jira-link">↗</a>
        </div>
      </td>
      <td style="font-weight: bold;">${escapeHtml(fixedScore)}</td>
      <td style="font-weight: bold;">
        <div class="cell-with-link">
          <span>${escapeHtml(openCount)}</span>
          <a href="${escapeHtml(jiraUrl)}/issues/?jql=${encodeURIComponent(totalJqlOpen)}" target="_blank" class="jira-link">↗</a>
        </div>
      </td>
    `;
    breakdownBody.appendChild(totalsRow);
  }
  
  const ticketListEl = document.getElementById('ticketList');
  ticketListEl.innerHTML = '';
  
  const openTickets = data.tickets.filter(ticket => !ticket.isFixed);
  
  if (openTickets.length === 0) {
    ticketListEl.innerHTML = '<p class="no-tickets">No open tickets found</p>';
    return;
  }
  
  const priorityOrder = { 'Urgent': 1, 'Highest': 1, 'High': 2, 'Medium': 3, 'Low': 4, 'Lowest': 4, 'None': 5 };
  
  const sortedTickets = openTickets.sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 5;
    const priorityB = priorityOrder[b.priority] || 5;
    return priorityA - priorityB;
  });
  
  sortedTickets.forEach(ticket => {
    const ticketEl = document.createElement('div');
    ticketEl.className = 'ticket-item ticket-open';
    ticketEl.innerHTML = `
      <div class="ticket-header">
        <a href="${escapeHtml(ticket.url)}" target="_blank" class="ticket-key">${escapeHtml(ticket.key)}</a>
        <span class="ticket-score">Score: ${escapeHtml(ticket.score)}</span>
        <span class="open-badge">● Open</span>
      </div>
      <div class="ticket-summary">${escapeHtml(ticket.summary)}</div>
      <div class="ticket-meta">
        <span class="ticket-status">${escapeHtml(ticket.status)}</span>
        <span class="ticket-priority priority-badge-${escapeHtml(ticket.priority.toLowerCase())}">${escapeHtml(ticket.priority)}</span>
        <span class="ticket-assignee">${escapeHtml(ticket.assignee)}</span>
      </div>
    `;
    ticketListEl.appendChild(ticketEl);
  });
}

function displaySupportTickets(data) {
  const supportSection = document.getElementById('supportSection');
  const supportTotal = document.getElementById('supportTotal');
  const supportTableHeader = document.getElementById('supportTableHeader');
  const supportTableBody = document.getElementById('supportTableBody');
  
  supportSection.classList.remove('hidden');
  supportTotal.textContent = escapeHtml(data.total);
  
  supportTableHeader.innerHTML = '';
  supportTableBody.innerHTML = '';
  
  const statuses = Object.keys(data.statusCounts).sort();
  
  if (statuses.length === 0) {
    supportSection.classList.add('hidden');
    return;
  }
  
  statuses.forEach(status => {
    const th = document.createElement('th');
    th.textContent = escapeHtml(status);
    supportTableHeader.appendChild(th);
  });
  
  const row = document.createElement('tr');
  statuses.forEach(status => {
    const td = document.createElement('td');
    td.textContent = escapeHtml(data.statusCounts[status]);
    td.style.textAlign = 'center';
    td.style.fontWeight = '600';
    row.appendChild(td);
  });
  supportTableBody.appendChild(row);
}

function buildJqlForPriority(priority, statusType) {
  const project = sanitizeText(document.getElementById('projectName').value.trim());
  const issueType = sanitizeText(document.getElementById('issueType').value);
  const startDate = sanitizeText(document.getElementById('startDate').value);
  const endDate = sanitizeText(document.getElementById('endDate').value);
  const thriveSquad = sanitizeText(document.getElementById('thriveSquad').value.trim());
  
  let queryParts = [];
  
  if (project) queryParts.push(`project = "${project}"`);
  if (startDate) queryParts.push(`created >= "${startDate}"`);
  if (endDate) queryParts.push(`created <= "${endDate}"`);
  if (issueType) queryParts.push(`type = ${issueType}`);
  if (thriveSquad) queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  
  if (priority !== 'all') {
    queryParts.push(`priority = ${priority}`);
  }
  
  if (statusType === 'fixed') {
    queryParts.push(`status IN ("Ready for Release", Done, "Ready to Test", Testing, Closed)`);
  } else if (statusType === 'open') {
    queryParts.push(`status NOT IN ("Ready for Release", Done, "Ready to Test", Testing, Closed, DEFERRED, Invalid)`);
  } else {
    const excludedStatuses = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
      .map(cb => cb.value);
    if (excludedStatuses.length > 0) {
      queryParts.push(`status NOT IN (${excludedStatuses.join(', ')})`);
    }
  }
  
  let jql = queryParts.length > 0 ? queryParts.join(' AND ') : '';
  jql += ' ORDER BY created DESC';
  
  return jql;
}

function showError(message) {
  const errorEl = document.getElementById('error');
  errorEl.textContent = escapeHtml(message);
  errorEl.classList.remove('hidden');
}

function openSettings() {
  window.location.href = 'settings.html';
}
