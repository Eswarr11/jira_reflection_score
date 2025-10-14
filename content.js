// Content script for Jira pages
// This script runs on Jira pages and can interact with the DOM

console.log('Jira Score Calculator content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    // Extract information from the current Jira page
    const pageInfo = extractJiraPageInfo();
    sendResponse({ success: true, data: pageInfo });
  }
});

// Extract Jira page information
function extractJiraPageInfo() {
  const info = {
    url: window.location.href,
    isJiraPage: window.location.hostname.includes('atlassian.net'),
    issueKey: null,
    issueTitle: null
  };
  
  // Try to extract issue key from URL
  const issueKeyMatch = window.location.pathname.match(/\/browse\/([A-Z]+-\d+)/);
  if (issueKeyMatch) {
    info.issueKey = issueKeyMatch[1];
  }
  
  // Try to extract issue title
  const titleElement = document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]');
  if (titleElement) {
    info.issueTitle = titleElement.textContent.trim();
  }
  
  return info;
}

// Add visual indicator when on Jira pages (optional)
function addVisualIndicator() {
  if (window.location.hostname.includes('atlassian.net')) {
    const indicator = document.createElement('div');
    indicator.id = 'jira-score-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0052CC;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      cursor: pointer;
    `;
    indicator.textContent = '📊 Score Calculator Active';
    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      indicator.style.transition = 'opacity 0.5s';
      setTimeout(() => indicator.remove(), 500);
    }, 3000);
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addVisualIndicator);
} else {
  addVisualIndicator();
}