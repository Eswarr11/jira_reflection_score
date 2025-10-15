# Jira Ticket Score Calculator

A secure, full-stack web application that integrates with Jira API to calculate quality scores based on tickets.

## 🔒 Security Architecture

**Hybrid Secure Model:**
- ✅ **First-time setup**: User enters credentials in UI → Saved to backend in-memory store
- ✅ **Credentials sent ONLY during**:
  - `/api/save-credentials` - Initial save
  - `/api/test-connection` - Testing
- ✅ **All other API calls**: Backend uses stored credentials (NO credentials in payload)
- ✅ **Local storage**: Only for displaying credentials in settings (not used in API calls)

## ✨ Features

- 📊 **Quality Score Calculation**: Priority-weighted scoring
- 🎛️ **Smart Query Builder**: Form-based interface with optional filters
- 📈 **Priority Breakdown**: Detailed table showing total vs fixed tickets
- 🎯 **Fixed Ticket Detection**: Automatically identifies completed tickets
- 💾 **Secure Credentials**: Stored on backend, not exposed in API requests
- 🔗 **Support Tickets**: Track support ticket statuses separately

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Configure in Browser
1. Open http://localhost:3000
2. Click "⚙️ Settings"
3. Enter your Jira credentials:
   - Jira URL: https://your-domain.atlassian.net
   - Email: your-email@example.com
   - API Token: [Get from Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens)
4. Click "Save Settings"

**That's it!** Credentials are now stored securely on the backend.

## 📁 Project Structure

```
jira_reflection_score/
├── backend/                 # Backend application
│   ├── config/
│   │   └── env.js          # Environment configuration
│   ├── controllers/
│   │   └── jiraController.js   # Request handlers
│   ├── services/
│   │   ├── jiraService.js      # Jira API integration
│   │   └── credentialStore.js  # In-memory credential storage
│   ├── routes/
│   │   └── jiraRoutes.js       # API routes
│   ├── middleware/
│   │   ├── validation.js       # Request validation
│   │   └── errorHandler.js     # Error handling
│   └── server.js               # Main entry point
│
├── frontend/                # Frontend application
│   ├── index.html          # Main page
│   ├── settings.html       # Settings page
│   ├── app.js              # Application logic
│   ├── settings.js         # Settings logic
│   └── styles/             # CSS files
│
├── .env.example            # Environment template (optional)
├── package.json
└── README.md
```

## 🔌 API Endpoints

### `POST /api/save-credentials`
Save Jira credentials to backend store (credentials IN payload)
```json
{
  "jiraUrl": "https://your-domain.atlassian.net",
  "jiraEmail": "your-email@example.com",
  "jiraApiToken": "your_token"
}
```

### `POST /api/test-connection`
Test Jira connection (credentials IN payload)
```json
{
  "jiraUrl": "https://your-domain.atlassian.net",
  "jiraEmail": "your-email@example.com",
  "jiraApiToken": "your_token"
}
```

### `POST /api/fetch-tickets`
Fetch tickets with scoring (NO credentials in payload - uses stored)
```json
{
  "jqlQuery": "project = TEG AND type = Bug",
  "scoringMethod": "priority",
  "priorityWeights": { "Highest": 5, "High": 4, ... }
}
```

### `POST /api/fetch-support-tickets`
Fetch support tickets (NO credentials in payload - uses stored)
```json
{
  "jqlQuery": "project = TEG AND type = Support"
}
```

## 🔐 Credential Flow

```
1. User enters credentials in Settings page
   ↓
2. Frontend stores locally (for display only)
   ↓
3. Frontend sends to /api/save-credentials
   ↓
4. Backend saves to in-memory credential store
   ↓
5. All future API calls use stored credentials
   - fetch-tickets: NO credentials in payload ✓
   - fetch-support-tickets: NO credentials in payload ✓
```

## 📊 Quality Score Formula

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

## 🔧 Development

### Development Mode
```bash
npm run dev
```

### Optional: Environment Variables
You can also configure credentials via `.env` file (loaded on server startup):
```bash
cp .env.example .env
# Edit .env with credentials
```

## 🐛 Troubleshooting

### "Credentials not configured" Error
**Solution**: Go to Settings page and save your Jira credentials

### Connection Failed: 401
**Solution**: 
1. Generate new API token at https://id.atlassian.com/manage-profile/security/api-tokens
2. Update credentials in Settings page
3. Click "Test Connection"

### Port Already in Use
**Solution**: Change port in `.env` file:
```env
PORT=3001
```

## 📝 Configuration Options

### Scoring Methods
- **Priority Based** (default): Uses priority weights
- **Story Points**: Uses Jira story points field
- **Custom Field**: Use any custom Jira field
- **Complexity Based**: Calculated from comments, subtasks, and priority

### Priority Weights
Customize in Settings page (default: Highest=5, High=4, Medium=3, Low=2, Lowest=1)

## 🚀 Deployment

The application can be deployed to any Node.js hosting platform:
- Heroku
- DigitalOcean
- AWS EC2
- Google Cloud
- Your own server

Just ensure Node.js >= 18.0.0 is installed and run `npm start`.

## 📄 License

MIT License

---

**Version**: 3.0.0  
**Last Updated**: October 15, 2025  
**Status**: Production Ready
