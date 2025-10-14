// Popup script for Jira Score Calculator

let currentTemplate = 'teg';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if opened in tab (full screen mode)
  const urlParams = new URLSearchParams(window.location.search);
  const isFullScreen = window.location.pathname.includes('popup.html') && !chrome.extension.getViews({type: 'popup'}).length;
  
  if (isFullScreen) {
    document.body.classList.add('fullscreen-mode');
    // Hide expand button in full screen mode
    const expandBtn = document.getElementById('expandBtn');
    if (expandBtn) {
      expandBtn.style.display = 'none';
    }
  }
  
  // Initialize UI
  await checkConnectionStatus();
  await loadSavedFilters();
  
  // Update JQL preview after loading filters
  updateJqlPreview();
  
  // Event listeners
  document.getElementById('fetchTickets').addEventListener('click', fetchTickets);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('expandBtn').addEventListener('click', openFullScreen);
  
  // Template switching
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      switchTemplate(e.target.dataset.template);
    });
  });
  
  // Query builder inputs - update JQL preview on change
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
  
  // Initial JQL preview
  updateJqlPreview();
});

// Check if Jira credentials are configured
async function checkConnectionStatus() {
  const settings = await chrome.storage.sync.get(['jiraUrl', 'jiraEmail', 'jiraApiToken']);
  
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  if (settings.jiraUrl && settings.jiraEmail && settings.jiraApiToken) {
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    statusIndicator.classList.add('disconnected');
    statusText.textContent = 'Not Configured';
  }
}

// Switch between templates
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

// Build JQL query from TEG template
function buildTegQuery() {
  const project = document.getElementById('projectName').value.trim();
  const issueType = document.getElementById('issueType').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const thriveSquad = document.getElementById('thriveSquad').value.trim();
  
  // Get excluded statuses
  const excludedStatuses = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => cb.value);
  
  // Build query parts - only add non-empty values
  let queryParts = [];
  
  // Project (optional)
  if (project) {
    queryParts.push(`project = "${project}"`);
  }
  
  // Start date (optional)
  if (startDate) {
    queryParts.push(`created >= "${startDate}"`);
  }
  
  // End date (optional)
  if (endDate) {
    queryParts.push(`created <= "${endDate}"`);
  }
  
  // Issue type (optional)
  if (issueType) {
    queryParts.push(`type = ${issueType}`);
  }
  
  // Thrive squad (optional)
  if (thriveSquad) {
    queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  }
  
  // Excluded statuses (optional)
  if (excludedStatuses.length > 0) {
    queryParts.push(`status NOT IN (${excludedStatuses.join(', ')})`);
  }
  
  // Build final query
  let jql;
  if (queryParts.length > 0) {
    jql = queryParts.join(' AND ');
    jql += ' ORDER BY created DESC';
  } else {
    // If all fields are empty, just order by created
    jql = 'ORDER BY created DESC';
  }
  
  return jql;
}

// Update JQL preview
function updateJqlPreview() {
  if (currentTemplate === 'teg') {
    const jql = buildTegQuery();
    // Display with newlines for readability (but actual query uses spaces)
    const displayJql = jql.replace(/ AND /g, '\nAND ').replace(' ORDER BY', '\nORDER BY');
    document.getElementById('generatedJql').textContent = displayJql;
    saveFilters();
  }
}

// Save filter values
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
  
  await chrome.storage.local.set({ savedFilters: filters });
}

// Load saved filter values
async function loadSavedFilters() {
  const { savedFilters } = await chrome.storage.local.get('savedFilters');
  
  if (savedFilters) {
    // Always set values if they exist in saved filters (even if empty)
    // This ensures that cleared fields stay cleared
    if (savedFilters.projectName !== undefined) document.getElementById('projectName').value = savedFilters.projectName;
    if (savedFilters.issueType !== undefined) document.getElementById('issueType').value = savedFilters.issueType;
    if (savedFilters.startDate !== undefined) document.getElementById('startDate').value = savedFilters.startDate;
    if (savedFilters.endDate !== undefined) document.getElementById('endDate').value = savedFilters.endDate;
    if (savedFilters.thriveSquad !== undefined) document.getElementById('thriveSquad').value = savedFilters.thriveSquad;
    
    // Update checkboxes
    if (savedFilters.excludedStatuses) {
      document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = savedFilters.excludedStatuses.includes(cb.value);
      });
    }
  }
}

// Reset to default values
async function resetToDefaults() {
  // Clear saved filters
  await chrome.storage.local.remove('savedFilters');
  
  // Reset to HTML defaults
  document.getElementById('projectName').value = 'TEG';
  document.getElementById('issueType').value = 'Bug';
  document.getElementById('startDate').value = '2025-08-25';
  document.getElementById('endDate').value = '2025-10-13';
  document.getElementById('thriveSquad').value = 'OKR';
  
  // Reset checkboxes to default (all checked)
  document.querySelectorAll('.checkbox-group input').forEach(cb => {
    cb.checked = true;
  });
  
  // Update preview and save
  updateJqlPreview();
  
  // Show feedback
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Filters reset to defaults';
  statusEl.className = 'status-message';
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status-message hidden';
  }, 2000);
}

// Build JQL query for support tickets (type = Support instead of Bug)
function buildSupportTicketsQuery() {
  const project = document.getElementById('projectName').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const thriveSquad = document.getElementById('thriveSquad').value.trim();
  
  // Build query parts - only add non-empty values
  let queryParts = [];
  
  if (project) {
    queryParts.push(`project = "${project}"`);
  }
  
  if (startDate) {
    queryParts.push(`created >= "${startDate}"`);
  }
  
  if (endDate) {
    queryParts.push(`created <= "${endDate}"`);
  }
  
  // Always use type = Support for support tickets
  queryParts.push('type = Support');
  
  if (thriveSquad) {
    queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  }
  
  // Build final JQL
  let jql = queryParts.join(' AND ');
  
  // Add ORDER BY
  if (jql) {
    jql += ' ORDER BY created DESC';
  } else {
    jql = 'ORDER BY created DESC';
  }
  
  return jql;
}

// Fetch tickets from Jira
async function fetchTickets() {
  let jqlQuery;
  
  if (currentTemplate === 'teg') {
    jqlQuery = buildTegQuery();
  } else {
    jqlQuery = document.getElementById('jqlQuery').value;
  }
  
  const loadingEl = document.getElementById('loading');
  const resultsEl = document.getElementById('results');
  const errorEl = document.getElementById('error');
  
  // Show loading state
  loadingEl.classList.remove('hidden');
  resultsEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  
  try {
    // Fetch bug tickets
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: 'fetchTickets',
          data: { jqlQuery }
        },
        resolve
      );
    });
    
    loadingEl.classList.add('hidden');
    
    if (response && response.success) {
      displayResults(response.data);
      
      // Also fetch support tickets only in TEG mode
      if (currentTemplate === 'teg') {
        try {
          const supportJqlQuery = buildSupportTicketsQuery();
          const supportResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                action: 'fetchSupportTickets',
                data: { jqlQuery: supportJqlQuery }
              },
              resolve
            );
          });
          
          // Display support tickets data if successful
          if (supportResponse && supportResponse.success) {
            displaySupportTickets(supportResponse.data);
          } else if (supportResponse && supportResponse.error) {
            console.warn('Support tickets fetch failed:', supportResponse.error);
          }
        } catch (supportError) {
          console.warn('Error fetching support tickets:', supportError);
          // Don't show error to user, just log it - support tickets are supplementary
        }
      }
      
      resultsEl.classList.remove('hidden');
    } else {
      showError(response ? response.error : 'Unknown error occurred');
    }
  } catch (error) {
    loadingEl.classList.add('hidden');
    showError(error.message);
  }
}

// Display results
function displayResults(data) {
  // Show total tickets count in status
  const statusEl = document.getElementById('status');
  if (data.tickets && data.tickets.length > 0) {
    statusEl.textContent = `✓ Loaded ${data.tickets.length} ticket${data.tickets.length !== 1 ? 's' : ''}`;
    statusEl.className = 'status-message';
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status-message hidden';
    }, 3000);
  }
  
  // Display quality score
  if (data.qualityScore) {
    document.getElementById('qualityPercentage').textContent = data.qualityScore.qualityScorePercentage + '%';
    document.getElementById('fixedTickets').textContent = data.qualityScore.fixedTickets;
    document.getElementById('totalTicketsQuality').textContent = data.qualityScore.totalTickets;
    document.getElementById('fixedScore').textContent = data.qualityScore.overallFixedScore;
    document.getElementById('totalScoreQuality').textContent = data.qualityScore.overallTotalScore;
    
    // Get current Jira URL from storage
    chrome.storage.sync.get(['jiraUrl'], (settings) => {
      const jiraUrl = settings.jiraUrl || 'https://surveysparrow.atlassian.net';
      
      // Display priority breakdown table with Jira links
      const breakdownBody = document.getElementById('breakdownBody');
      breakdownBody.innerHTML = '';
      
      data.qualityScore.breakdown.forEach(item => {
        const row = document.createElement('tr');
        
        // Build JQL for this priority
        const totalJql = buildJqlForPriority(item.priority, 'all');
        const fixedJql = buildJqlForPriority(item.priority, 'fixed');
        const openJql = buildJqlForPriority(item.priority, 'open');
        
        const openCount = item.totalCount - item.fixedCount;
        
        row.innerHTML = `
          <td class="priority-cell priority-${item.priority.toLowerCase()}">${item.priority}</td>
          <td>${item.points}</td>
          <td>
            <div class="cell-with-link">
              <span>${item.totalCount}</span>
              <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(totalJql)}" target="_blank" class="jira-link" title="View all ${item.priority} tickets in Jira">
                ↗
              </a>
            </div>
          </td>
          <td>${item.totalScore}</td>
          <td>
            <div class="cell-with-link">
              <span>${item.fixedCount}</span>
              <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(fixedJql)}" target="_blank" class="jira-link" title="View fixed ${item.priority} tickets in Jira">
                ↗
              </a>
            </div>
          </td>
          <td>${item.fixedScore}</td>
          <td>
            <div class="cell-with-link">
              <span>${openCount}</span>
              <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(openJql)}" target="_blank" class="jira-link" title="View open ${item.priority} tickets in Jira">
                ↗
              </a>
            </div>
          </td>
        `;
        breakdownBody.appendChild(row);
      });
      
      // Add overall row with links
      const overallTotalJql = buildJqlForPriority('all', 'all');
      const overallFixedJql = buildJqlForPriority('all', 'fixed');
      const overallOpenJql = buildJqlForPriority('all', 'open');
      
      const overallOpenCount = data.qualityScore.totalTickets - data.qualityScore.fixedTickets;
      
      const overallRow = document.createElement('tr');
      overallRow.style.borderTop = '2px solid #667eea';
      overallRow.style.fontWeight = '600';
      overallRow.innerHTML = `
        <td colspan="2">Overall</td>
        <td>
          <div class="cell-with-link">
            <span>${data.qualityScore.totalTickets}</span>
            <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(overallTotalJql)}" target="_blank" class="jira-link" title="View all tickets in Jira">
              ↗
            </a>
          </div>
        </td>
        <td>${data.qualityScore.overallTotalScore}</td>
        <td>
          <div class="cell-with-link">
            <span>${data.qualityScore.fixedTickets}</span>
            <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(overallFixedJql)}" target="_blank" class="jira-link" title="View all fixed tickets in Jira">
              ↗
            </a>
          </div>
        </td>
        <td>${data.qualityScore.overallFixedScore}</td>
        <td>
          <div class="cell-with-link">
            <span>${overallOpenCount}</span>
            <a href="${jiraUrl}/issues/?jql=${encodeURIComponent(overallOpenJql)}" target="_blank" class="jira-link" title="View all open tickets in Jira">
              ↗
            </a>
          </div>
        </td>
      `;
      breakdownBody.appendChild(overallRow);
    });
  }
  
  // Display ticket list - only show OPEN tickets, sorted by priority
  const ticketListEl = document.getElementById('ticketList');
  ticketListEl.innerHTML = '';
  
  // Filter to show only open tickets (not fixed)
  const openTickets = data.tickets.filter(ticket => !ticket.isFixed);
  
  if (openTickets.length === 0) {
    ticketListEl.innerHTML = '<p class="no-tickets">No open tickets found</p>';
    return;
  }
  
  // Sort by priority: Urgent/Highest > High > Medium > Low/Lowest
  const priorityOrder = {
    'Urgent': 1,
    'Highest': 1,
    'High': 2,
    'Medium': 3,
    'Low': 4,
    'Lowest': 4,
    'None': 5
  };
  
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
        <a href="${ticket.url}" target="_blank" class="ticket-key">${ticket.key}</a>
        <span class="ticket-score">Score: ${ticket.score}</span>
        <span class="open-badge">● Open</span>
      </div>
      <div class="ticket-summary">${ticket.summary}</div>
      <div class="ticket-meta">
        <span class="ticket-status">${ticket.status}</span>
        <span class="ticket-priority priority-badge-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
        <span class="ticket-assignee">${ticket.assignee}</span>
      </div>
    `;
    ticketListEl.appendChild(ticketEl);
  });
}

// Display support tickets status breakdown
function displaySupportTickets(data) {
  const supportSection = document.getElementById('supportSection');
  const supportTotal = document.getElementById('supportTotal');
  const supportTableHeader = document.getElementById('supportTableHeader');
  const supportTableBody = document.getElementById('supportTableBody');
  
  // Show the section
  supportSection.classList.remove('hidden');
  
  // Update total
  supportTotal.textContent = data.total;
  
  // Clear existing table
  supportTableHeader.innerHTML = '';
  supportTableBody.innerHTML = '';
  
  // Get all statuses and sort them
  const statuses = Object.keys(data.statusCounts).sort();
  
  if (statuses.length === 0) {
    // No support tickets found
    supportSection.classList.add('hidden');
    return;
  }
  
  // Build header row with status names
  statuses.forEach(status => {
    const th = document.createElement('th');
    th.textContent = status;
    supportTableHeader.appendChild(th);
  });
  
  // Build body row with counts
  const row = document.createElement('tr');
  statuses.forEach(status => {
    const td = document.createElement('td');
    td.textContent = data.statusCounts[status];
    td.style.textAlign = 'center';
    td.style.fontWeight = '600';
    row.appendChild(td);
  });
  supportTableBody.appendChild(row);
}

// Build JQL query for a specific priority and status type
function buildJqlForPriority(priority, statusType) {
  // Get base filters from current query
  const project = document.getElementById('projectName').value.trim();
  const issueType = document.getElementById('issueType').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const thriveSquad = document.getElementById('thriveSquad').value.trim();
  
  let queryParts = [];
  
  // Add base filters
  if (project) {
    queryParts.push(`project = "${project}"`);
  }
  
  if (startDate) {
    queryParts.push(`created >= "${startDate}"`);
  }
  
  if (endDate) {
    queryParts.push(`created <= "${endDate}"`);
  }
  
  if (issueType) {
    queryParts.push(`type = ${issueType}`);
  }
  
  if (thriveSquad) {
    queryParts.push(`"thrive-squad[dropdown]" = ${thriveSquad}`);
  }
  
  // Add priority filter (unless it's 'all')
  if (priority !== 'all') {
    queryParts.push(`priority = ${priority}`);
  }
  
  // Add status filter based on type
  if (statusType === 'fixed') {
    // Fixed/Done tickets
    queryParts.push(`status IN ("Ready for Release", Done, "Ready to Test", Testing)`);
  } else if (statusType === 'open') {
    // Open tickets (not fixed, not excluded)
    queryParts.push(`status NOT IN ("Ready for Release", Done, "Ready to Test", Testing, Closed, DEFERRED, Invalid)`);
  } else {
    // All tickets (just exclude the standard excluded statuses)
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

// Show error message
function showError(message) {
  const errorEl = document.getElementById('error');
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Open extension in full screen tab
function openFullScreen() {
  const url = chrome.runtime.getURL('popup.html');
  chrome.tabs.create({ url: url });
}