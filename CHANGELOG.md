# Changelog

All notable changes to the Jira Score Calculator extension will be documented here.

## [1.1.1] - 2025-10-14

### Fixed - API Method Update

#### 🔧 Changed to New API Endpoint
- Updated to `/rest/api/3/search/jql` (migration from deprecated `/search` endpoint)
- Fixed 410 Gone error by following Atlassian migration guide (CHANGE-2046)
- Changed from GET to POST method (recommended approach)
- Added explicit field selection for better performance
- Increased default maxResults from 50 to 100

#### 🐛 Bug Fixes
- Fixed JQL syntax: removed newlines, proper ORDER BY placement
- Fixed double slash in API URLs (trailing slash cleanup)
- Enhanced error messages with Jira-specific error details
- Improved URL validation and cleaning

#### 📝 Documentation
- Added `API_UPDATE.md` with details about the POST method
- Updated error handling documentation

---

## [1.1.0] - 2025-10-14

### Added - Query Builder Feature

#### 🎛️ TEG Query Builder
- Added pre-configured query template for TEG project
- Smart form-based query builder with the following fields:
  - **Project Name** (text input, default: TEG)
  - **Issue Type** (dropdown: Bug, Story, Task, Epic, All Types)
  - **Date Range** (date pickers for start and end dates)
  - **Thrive Squad** (text input for custom field)
  - **Status Exclusions** (checkboxes for Closed, DEFERRED, Invalid)

#### 📋 Enhanced UI
- Quick filter buttons to switch between TEG template and custom query
- Real-time JQL preview that updates as you type
- Auto-save functionality - filter values persist between sessions
- Expanded popup width (450px → 520px) for better form layout
- Improved form styling with grid layout

#### 📖 Documentation
- Added `QUERY_BUILDER_GUIDE.md` - Complete guide to using the query builder
- Updated `README.md` with query builder usage
- Added `CHANGELOG.md` to track version history

#### 🔧 Technical Changes
- Added `buildTegQuery()` function to generate JQL from form inputs
- Added `updateJqlPreview()` for real-time JQL display
- Added `saveFilters()` and `loadSavedFilters()` for persistence
- Added template switching functionality
- Enhanced popup.js with new event handlers
- Added CSS styling for query builder components

### Default Query Template
```jql
project = "TEG"
AND created >= "2025-08-25"
AND created <= "2025-10-13"
AND type = Bug
AND "thrive-squad[dropdown]" = OKR
AND status NOT IN (Closed, DEFERRED, Invalid)
ORDER BY created DESC
```

### Modified Files
- `popup.html` - Added query builder UI
- `popup.js` - Added query builder logic
- `styles/popup.css` - Added query builder styles
- `README.md` - Updated with new features

### Backward Compatibility
- Custom JQL query input still available
- All existing features remain functional
- No breaking changes to settings or API integration

---

## [1.0.0] - 2025-10-14

### Initial Release

#### Core Features
- ✅ Chrome Extension (Manifest V3)
- ✅ Jira API integration via REST API v3
- ✅ Multiple scoring methods:
  - Story Points based
  - Priority based with customizable weights
  - Custom field based
  - Complexity based (auto-calculated)
- ✅ Modern, beautiful UI with gradient design
- ✅ Settings page for configuration
- ✅ Content script for Jira page integration

#### Documentation
- ✅ Complete README with usage instructions
- ✅ Detailed setup guide
- ✅ Quick start guide (5 minutes)
- ✅ Project overview for developers
- ✅ Troubleshooting documentation

#### Helper Tools
- ✅ HTML-based icon generator
- ✅ Example configuration file
- ✅ Git ignore rules

#### Security
- ✅ Secure API token storage
- ✅ HTTPS-only connections
- ✅ Minimal permissions
- ✅ No external services

#### Files Included
```
manifest.json
background.js
popup.html
popup.js
options.html
options.js
content.js
styles/popup.css
styles/options.css
icons/ (placeholder)
README.md
SETUP_GUIDE.md
QUICK_START.md
PROJECT_OVERVIEW.md
NEXT_STEPS.md
LICENSE
.gitignore
create-icons.html
example-config.json
package.json
```

---

## Future Enhancements (Planned)

### Version 1.2.0 (Tentative)
- [ ] Multiple query templates (save custom templates)
- [ ] Export results to CSV/JSON
- [ ] Historical score tracking
- [ ] Chart visualizations
- [ ] Keyboard shortcuts
- [ ] Dark mode

### Version 1.3.0 (Tentative)
- [ ] Team comparison features
- [ ] Sprint reports
- [ ] Bulk operations
- [ ] Custom report templates
- [ ] Cached results

### Version 2.0.0 (Future)
- [ ] Multiple Jira account support
- [ ] Advanced analytics
- [ ] Slack/Teams integration
- [ ] API webhooks
- [ ] Machine learning score predictions

---

## Contributing

To propose new features or report bugs:
1. Check existing documentation
2. Review this changelog
3. Submit detailed feedback with use cases

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward compatible)
- **PATCH** version for bug fixes (backward compatible)

---

**Current Version**: 1.1.0  
**Last Updated**: October 14, 2025  
**Status**: Active Development

