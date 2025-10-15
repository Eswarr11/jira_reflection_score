// Settings script for Jira Score Calculator
// Handles credential input and user preferences

const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  await loadSettings();
  
  // Event listeners
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
  document.getElementById('scoringMethod').addEventListener('change', handleScoringMethodChange);
  document.getElementById('backToMain').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});

// Get settings from localStorage
function getStoredSettings() {
  const stored = localStorage.getItem('jiraSettings');
  return stored ? JSON.parse(stored) : {};
}

// Load settings from localStorage
async function loadSettings() {
  const settings = getStoredSettings();
  
  // Load Jira credentials
  if (settings.jiraUrl) document.getElementById('jiraUrl').value = settings.jiraUrl;
  if (settings.jiraEmail) document.getElementById('jiraEmail').value = settings.jiraEmail;
  if (settings.jiraApiToken) document.getElementById('jiraApiToken').value = settings.jiraApiToken;
  
  // Load scoring preferences
  const scoringMethod = settings.scoringMethod || 'priority';
  document.getElementById('scoringMethod').value = scoringMethod;
  handleScoringMethodChange({ target: { value: scoringMethod } });
  
  if (settings.customField) {
    document.getElementById('customField').value = settings.customField;
  }
  
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

// Save settings
async function saveSettings() {
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  const scoringMethod = document.getElementById('scoringMethod').value;
  const customField = document.getElementById('customField').value.trim();
  
  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    showMessage('Please fill in all Jira configuration fields', 'error');
    return;
  }
  
  // Validate and clean URL format
  try {
    let url = jiraUrl;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    new URL(url);
    document.getElementById('jiraUrl').value = url;
  } catch (e) {
    showMessage('Please enter a valid URL', 'error');
    return;
  }
  
  const priorityWeights = {
    'Highest': parseInt(document.getElementById('weightHighest').value) || 5,
    'High': parseInt(document.getElementById('weightHigh').value) || 4,
    'Medium': parseInt(document.getElementById('weightMedium').value) || 3,
    'Low': parseInt(document.getElementById('weightLow').value) || 2,
    'Lowest': parseInt(document.getElementById('weightLowest').value) || 1
  };
  
  // Store credentials locally for display
  const settings = {
    jiraUrl,
    jiraEmail,
    jiraApiToken,
    scoringMethod,
    customField,
    priorityWeights
  };
  
  localStorage.setItem('jiraSettings', JSON.stringify(settings));
  
  // Also save user preferences separately (non-credentials)
  localStorage.setItem('userPreferences', JSON.stringify({
    scoringMethod,
    customField,
    priorityWeights
  }));
  
  showMessage('Saving credentials to backend...', 'info');
  
  try {
    // Send credentials to backend and get auth cookie
    const response = await fetch(`${API_BASE_URL}/save-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',  // Important: Include cookies
      body: JSON.stringify({
        jiraUrl,
        jiraEmail,
        jiraApiToken
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showMessage('✅ Settings saved successfully! Auth cookie set. Redirecting...', 'success');
      
      // Redirect to main page after successful save
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showMessage('Failed to save credentials: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error saving credentials: ' + error.message, 'error');
  }
}

// Test Jira connection
async function testConnection() {
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  
  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    showMessage('Please fill in all Jira configuration fields first', 'error');
    return;
  }
  
  showMessage('Testing connection...', 'info');
  
  try {
    // For test connection, we need to send credentials
    const response = await fetch(`${API_BASE_URL}/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ jiraUrl, jiraEmail, jiraApiToken })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showMessage(result.message, 'success');
    } else {
      showMessage(result.error, 'error');
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
  
  if (type === 'success') {
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 5000);
  }
}
