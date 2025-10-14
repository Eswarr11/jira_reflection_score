// Options/Settings script for Jira Score Calculator

// ============================================================================
// DEFAULT JIRA CREDENTIALS (COMMENT OUT BEFORE PUSHING TO GIT)
// ============================================================================
const DEFAULT_CREDENTIALS = {
  jiraUrl: 'https://yourdomain.atlassian.net',
  jiraEmail: 'abc@company.com',
  jiraApiToken: 'Your API token'
};
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize default credentials if not already set
  await initializeDefaultCredentials();
  
  // Load saved settings
  await loadSettings();
  
  // Event listeners
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
  document.getElementById('scoringMethod').addEventListener('change', handleScoringMethodChange);
});

// Initialize default credentials (priority: saved credentials > default credentials)
async function initializeDefaultCredentials() {
  const settings = await chrome.storage.sync.get([
    'jiraUrl',
    'jiraEmail',
    'jiraApiToken'
  ]);
  
  // Only set defaults if credentials are not already saved
  // This ensures saved credentials always take priority
  const needsInitialization = !settings.jiraUrl || !settings.jiraEmail || !settings.jiraApiToken;
  
  if (needsInitialization && DEFAULT_CREDENTIALS) {
    await chrome.storage.sync.set({
      jiraUrl: DEFAULT_CREDENTIALS.jiraUrl,
      jiraEmail: DEFAULT_CREDENTIALS.jiraEmail,
      jiraApiToken: DEFAULT_CREDENTIALS.jiraApiToken
    });
    console.log('Default credentials initialized');
  }
}

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'jiraUrl',
    'jiraEmail',
    'jiraApiToken',
    'scoringMethod',
    'customField',
    'priorityWeights',
    'credentialsInitialized'
  ]);
  
  // Populate form fields with saved settings
  document.getElementById('jiraUrl').value = settings.jiraUrl || '';
  document.getElementById('jiraEmail').value = settings.jiraEmail || '';
  document.getElementById('jiraApiToken').value = settings.jiraApiToken || '';
  
  const scoringMethod = settings.scoringMethod || 'priority';
  document.getElementById('scoringMethod').value = scoringMethod;
  handleScoringMethodChange({ target: { value: scoringMethod } });
  
  if (settings.customField) {
    document.getElementById('customField').value = settings.customField;
  }
  
  // Load priority weights
  const defaultWeights = {
    'Highest': 5,
    'High': 4,
    'Medium': 3,
    'Low': 2,
    'Lowest': 1
  };
  const weights = settings.priorityWeights || defaultWeights;
  
  document.getElementById('weightHighest').value = weights['Highest'] || 5;
  document.getElementById('weightHigh').value = weights['High'] || 4;
  document.getElementById('weightMedium').value = weights['Medium'] || 3;
  document.getElementById('weightLow').value = weights['Low'] || 2;
  document.getElementById('weightLowest').value = weights['Lowest'] || 1;
}

// Save settings to storage
async function saveSettings() {
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  const scoringMethod = document.getElementById('scoringMethod').value;
  const customField = document.getElementById('customField').value.trim();
  
  // Validate inputs
  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    showMessage('Please fill in all Jira configuration fields', 'error');
    return;
  }
  
  // Validate and clean URL format
  try {
    let url = jiraUrl;
    // Remove trailing slash if present
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    new URL(url);
    // Update the input with cleaned URL
    document.getElementById('jiraUrl').value = url;
  } catch (e) {
    showMessage('Please enter a valid URL', 'error');
    return;
  }
  
  // Collect priority weights
  const priorityWeights = {
    'Highest': parseInt(document.getElementById('weightHighest').value) || 5,
    'High': parseInt(document.getElementById('weightHigh').value) || 4,
    'Medium': parseInt(document.getElementById('weightMedium').value) || 3,
    'Low': parseInt(document.getElementById('weightLow').value) || 2,
    'Lowest': parseInt(document.getElementById('weightLowest').value) || 1
  };
  
  // Save to storage
  await chrome.storage.sync.set({
    jiraUrl,
    jiraEmail,
    jiraApiToken,
    scoringMethod,
    customField,
    priorityWeights
  });
  
  showMessage('Settings saved successfully!', 'success');
}

// Test Jira connection
async function testConnection() {
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  
  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    showMessage('Please fill in all Jira configuration fields', 'error');
    return;
  }
  
  showMessage('Testing connection...', 'info');
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: 'testConnection',
          data: { jiraUrl, jiraEmail, jiraApiToken }
        },
        resolve
      );
    });
    
    if (response.success) {
      showMessage(response.message, 'success');
    } else {
      showMessage(response.error, 'error');
    }
  } catch (error) {
    showMessage('Connection test failed: ' + error.message, 'error');
  }
}

// Handle scoring method change
function handleScoringMethodChange(event) {
  const customFieldGroup = document.getElementById('customFieldGroup');
  if (event.target.value === 'custom') {
    customFieldGroup.style.display = 'block';
  } else {
    customFieldGroup.style.display = 'none';
  }
}

// Show message to user
function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.classList.remove('hidden');
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 5000);
  }
}