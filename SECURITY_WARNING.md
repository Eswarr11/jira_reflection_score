# ⚠️ SECURITY WARNING ⚠️

## Critical Security Notice

This Chrome extension contains **hardcoded credentials** in `options.html` for convenience. This is **NOT recommended for production** or shared use.

## Hardcoded Credentials Location

**File:** `options.html`

Contains:
- Jira URL: `https://surveysparrow.atlassian.net`
- Email: `eswar.a@surveysparrow.com`
- API Token: `ATATT3xF...` (full token in file)

## ⚠️ DO NOT:

1. ❌ **DO NOT** commit this to public GitHub/GitLab repositories
2. ❌ **DO NOT** share this folder with others
3. ❌ **DO NOT** upload to Chrome Web Store with credentials
4. ❌ **DO NOT** store in cloud sync folders (Dropbox, Google Drive, etc.)
5. ❌ **DO NOT** share screenshots showing the API token

## ✅ Safe Usage:

1. ✅ Keep this extension folder **private on your local machine**
2. ✅ Use `.gitignore` to prevent accidental commits
3. ✅ Regenerate API token if accidentally exposed
4. ✅ For team use, remove credentials from `options.html` and have each user enter their own

## How to Remove Hardcoded Credentials

If you need to share this extension or make it safer:

### Step 1: Edit `options.html`

Change these lines (around line 23-35):

```html
<!-- Before (with credentials) -->
<input type="text" id="jiraUrl" value="https://surveysparrow.atlassian.net" />
<input type="email" id="jiraEmail" value="eswar.a@surveysparrow.com" />
<input type="password" id="jiraApiToken" value="ATATT3xF..." />

<!-- After (without credentials) -->
<input type="text" id="jiraUrl" placeholder="https://your-domain.atlassian.net" />
<input type="email" id="jiraEmail" placeholder="your-email@example.com" />
<input type="password" id="jiraApiToken" placeholder="Your Jira API token" />
```

### Step 2: Save Settings in Extension

After removing hardcoded values:
1. Open extension → Settings
2. Enter your credentials manually
3. Click "Save Settings"
4. Credentials are stored in Chrome's encrypted storage

## If Token is Compromised

If your API token is accidentally exposed:

1. **Immediately revoke it:**
   - Go to: https://id.atlassian.com/manage-profile/security/api-tokens
   - Find the token and click "Revoke"

2. **Create a new token:**
   - Click "Create API token"
   - Name it appropriately
   - Copy the new token

3. **Update the extension:**
   - Open Settings
   - Enter the new token
   - Save

## Best Practices

### For Personal Use (Current Setup)
- ✅ Keep folder private
- ✅ Don't sync to cloud
- ✅ Use `.gitignore`

### For Team/Shared Use (Recommended)
- ✅ Remove credentials from `options.html`
- ✅ Each user enters their own credentials
- ✅ Add instructions in README
- ✅ Safe to commit to private repository

### For Public Distribution
- ✅ Remove ALL credentials
- ✅ Remove company-specific defaults
- ✅ Add setup instructions
- ✅ Add security documentation

## Data Storage

Credentials are stored in two places:

1. **HTML defaults** (options.html)
   - Hardcoded in file
   - Visible in source code
   - ⚠️ Security risk

2. **Chrome Storage** (after saving)
   - Encrypted by Chrome
   - User-specific
   - ✅ More secure

## Recommended Setup for Production

Remove hardcoded credentials and use environment-based configuration:

```javascript
// Example: Load from secure storage only
const defaults = {
  jiraUrl: '', // Empty by default
  jiraEmail: '',
  jiraApiToken: '',
  scoringMethod: 'priority' // Only non-sensitive defaults
};
```

## Questions?

- **Q: Why are credentials hardcoded?**
  - A: For personal convenience. This is a personal-use extension.

- **Q: Is this secure?**
  - A: Only if the folder stays private on your machine.

- **Q: Can I share this with my team?**
  - A: Remove credentials first, then share.

- **Q: What if I accidentally commit to GitHub?**
  - A: Immediately revoke the token and delete the repository.

---

**Last Updated:** October 14, 2025  
**Status:** Contains hardcoded credentials - Use with caution  
**Intended Use:** Personal use only

