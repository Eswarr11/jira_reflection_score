# Jira Ticket Score Calculator - Chrome Extension

A Chrome extension that integrates with Jira API to calculate scores based on tickets. This tool helps teams track and quantify work by analyzing Jira tickets with customizable scoring methods.

## Features

- 📊 **Quality Score Calculation**: Priority-weighted scoring (Urgent=4, High=3, Medium=2, Low=1)
- 🎛️ **Smart Query Builder**: Form-based interface with optional filters
- 📈 **Priority Breakdown**: Detailed table showing total vs fixed tickets by priority
- 🎯 **Fixed Ticket Detection**: Automatically identifies completed tickets (Ready for Release, Done, Ready to Test, Testing)
- 💾 **Auto-Save**: Filter values persist between sessions
- 🔗 **Support Tickets**: Track support ticket statuses separately

## Quick Start

1. **Load the Extension:**
   ```
   Chrome → chrome://extensions/
   Enable "Developer mode"
   Click "Load unpacked"
   Select this folder
   ```

2. **Configure Jira Credentials:**
   - Click extension icon
   - Click "⚙️ Settings"
   - Enter your Jira URL (e.g., https://your-domain.atlassian.net)
   - Enter your Jira email
   - Generate and enter your API token from [Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Save Settings"
   - Click "Test Connection" to verify

3. **Start Using:**
   - Return to main popup
   - Click "Fetch Tickets"
   - View quality score and analytics!

## Query Builder

All fields are optional - leave empty to exclude from query:

- **Project**: TEG (or empty for all projects)
- **Type**: Bug, Story, Task, Epic, or All Types
- **Date Range**: Use × button to clear dates
- **Thrive Squad**: OKR (or empty for all squads)
- **Exclude Statuses**: Closed, DEFERRED, Invalid (uncheck to include)

## Quality Score Formula

```
For each priority:
  Total Score = Priority Points × Total Ticket Count
  Fixed Score = Priority Points × Fixed Ticket Count

Quality Score = (Sum of Fixed Scores / Sum of Total Scores) × 100%
```

### Priority Points
- Urgent/Highest: 4 points
- High: 3 points
- Medium: 2 points
- Low/Lowest: 1 point

### Fixed Status Definition
Tickets with these statuses count as "fixed":
- Ready for Release
- Done
- Ready to Test
- Testing

## Example

```
Priority | Points | Total | Fixed | Total Score | Fixed Score
---------|--------|-------|-------|-------------|------------
Urgent   |   4    |  34   |  34   |    136      |    136
High     |   3    | 103   | 102   |    309      |    306
Medium   |   2    | 106   |  78   |    212      |    156
Low      |   1    |  28   |  11   |     28      |     11
---------|--------|-------|-------|-------------|------------
Total    |        | 271   | 225   |    685      |    609

Quality Score = 609 / 685 = 88.91%
```

## Configuration

### Settings
Click ⚙️ Settings to configure:
- Jira URL (e.g., https://your-domain.atlassian.net)
- Email (your Jira account email)
- API Token (generate from Atlassian)
- Scoring Method (default: Priority Based)
- Priority Weights (for priority-based scoring)

### Custom Field IDs
If your Jira uses different custom fields, edit `background.js`:
- Story Points: `customfield_10016` (line 103)
- Thrive Squad: `thrive-squad[dropdown]` (line 138)

## Files

**Essential:**
- `manifest.json` - Extension config
- `background.js` - API integration
- `popup.html/js` - Main UI
- `options.html/js` - Settings page
- `content.js` - Content script for Jira pages
- `styles/*.css` - Styling
- `icons/*.png` - Extension icons

**Documentation:**
- `README.md` - This file
- `LICENSE` - MIT License

## 🔒 Security

Your Jira credentials are:
- ✅ Stored securely in Chrome's sync storage (encrypted by Chrome)
- ✅ Never sent to any server except your Jira instance
- ⚠️ **Important**: Keep your API token secure and never commit it to version control

Generate your API token at: https://id.atlassian.com/manage-profile/security/api-tokens

### Default Credentials (For Development)

The extension includes support for default credentials that can be set for local development. To use this feature:

1. **Adding Default Credentials**: Look for the `DEFAULT_CREDENTIALS` section (marked with clear comments) at the top of these files:
   - `options.js` (lines 3-11)
   - `background.js` (lines 3-11)
   - `popup.js` (lines 3-11)

2. **Before Pushing to Git**: Comment out or remove the `DEFAULT_CREDENTIALS` object:
   ```javascript
   // const DEFAULT_CREDENTIALS = {
   //   jiraUrl: 'your-url',
   //   jiraEmail: 'your-email',
   //   jiraApiToken: 'your-token'
   // };
   ```

3. **Restoring for Local Use**: Simply uncomment the credentials when working locally.

**Priority System**: The extension uses a priority-based system:
- Saved credentials (from Settings page) always take precedence
- Default credentials only load if no saved credentials exist
- This ensures your saved settings are never overwritten

## Troubleshooting

### Extension won't load
- Ensure icons exist in `icons/` folder (icon16.png, icon48.png, icon128.png)

### Connection fails
- Check Jira URL format (no trailing slash)
- Verify API token is valid
- Regenerate token if expired

### No tickets found
- Broaden your query (clear some filters)
- Check JQL preview for syntax
- Verify you have access to the project

### Scores are all 0
- Tickets might not have the required fields
- Try different scoring method in Settings

## Support

For issues:
1. Check browser console (F12) for errors
2. Verify Jira API token is valid
3. Test connection in Settings page

## License

MIT License - See LICENSE file

---

**Version**: 1.2.0  
**Last Updated**: October 14, 2025  
**Status**: Production Ready - Clean Codebase
