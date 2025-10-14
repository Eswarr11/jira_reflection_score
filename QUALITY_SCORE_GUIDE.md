# Quality Score Calculation Guide

## Overview

The Quality Score is a metric that measures the percentage of tickets that have been fixed (completed/resolved) weighted by their priority. Higher priority tickets have more impact on the overall quality score.

## Formula

The quality score is calculated using the following formula:

```
Priority Points:
- Urgent/Highest = 4 points
- High = 3 points
- Medium = 2 points
- Low/Lowest = 1 point

For each priority level:
  Total Score = Priority Points × Total Ticket Count
  Fixed Score = Priority Points × Fixed Ticket Count

Overall Quality Score = (Sum of all Fixed Scores / Sum of all Total Scores) × 100%
```

## Example Calculation

### Sample Data

| Priority | Points | Total | Total Score | Fixed | Fixed Score |
|----------|--------|-------|-------------|-------|-------------|
| Urgent   | 4      | 34    | 136         | 34    | 136         |
| High     | 3      | 103   | 309         | 102   | 306         |
| Medium   | 2      | 106   | 212         | 78    | 156         |
| Low      | 1      | 28    | 28          | 11    | 11          |
| **Total**|        | **271** | **685**   | **225** | **609**   |

### Calculation

```
Quality Score = (609 / 685) × 100%
Quality Score = 88.91%
```

This means 88.91% of the weighted work (by priority) has been completed.

## How It Works in the Extension

### 1. Ticket Classification

When tickets are fetched from Jira, they are automatically classified as:

**Fixed (Completed):** Tickets with these exact statuses:
- **Ready for Release**
- **Done**
- **Ready to Test**
- **Testing**

**Not Fixed:** All other statuses (In Progress, To Do, etc.)

**Excluded from Count:** These statuses are filtered out in the query:
- Closed
- DEFERRED
- Invalid

### 2. Priority Grouping

Tickets are grouped by their Jira priority:
- **Urgent** or **Highest** → 4 points
- **High** → 3 points
- **Medium** → 2 points
- **Low** or **Lowest** → 1 point
- **None** (no priority) → 1 point

### 3. Score Calculation

For each priority group:
```javascript
totalScore = priorityPoints × totalCount
fixedScore = priorityPoints × fixedCount
```

Then summed across all priorities:
```javascript
qualityScore = (totalFixedScore / totalTotalScore) × 100
```

## Display

The extension displays:

### Quality Score Card
- **Large percentage** - Your overall quality score
- **Fixed Tickets** - Total number of fixed tickets
- **Total Tickets** - Total number of tickets
- **Fixed Score** - Weighted score of fixed tickets
- **Total Score** - Weighted score of all tickets

### Priority Breakdown Table
Shows for each priority level:
- Priority name
- Points per ticket
- Total ticket count
- Total score (points × count)
- Fixed ticket count
- Fixed score (points × fixed count)

### Ticket List
- All tickets displayed
- Fixed tickets highlighted with green border
- "✓ Fixed" badge on completed tickets

## Interpreting the Score

### Score Ranges

- **90-100%** - Excellent quality! Most work is completed
- **80-89%** - Good quality, on track
- **70-79%** - Moderate quality, some work pending
- **Below 70%** - Needs attention, significant work incomplete

### Important Notes

1. **Priority Matters**: One urgent ticket has the same weight as four low priority tickets
2. **Incomplete High Priority**: A few incomplete urgent/high priority tickets can significantly lower the score
3. **Status Accuracy**: Ensure Jira statuses accurately reflect completion

## Use Cases

### Sprint Review
```
Use this to measure sprint completion quality:
- High score = Most committed work completed
- Low score = Many items incomplete
```

### Release Readiness
```
Check quality score before release:
- 95%+ = Release ready (only minor items pending)
- 85-95% = Review incomplete items
- <85% = Consider delaying release
```

### Team Performance
```
Track quality score trends:
- Increasing trend = Team improving
- Stable high score = Consistent quality
- Decreasing trend = Investigate blockers
```

### Bug Tracking
```
For bug queries:
- High score = Most bugs fixed
- Low score = Bug backlog needs attention
- Priority breakdown shows which severity needs focus
```

## Customization

### Changing "Fixed" Status Detection

The extension is configured for TEG project workflow. Edit `background.js` around line 118 if you need different statuses:

```javascript
function isTicketFixed(status) {
  const fixedStatuses = [
    'Ready for Release',
    'Done',
    'Ready to Test',
    'Testing'
    // Add your custom statuses here
  ];
  return fixedStatuses.some(s => status.toLowerCase() === s.toLowerCase());
}
```

**Note:** The current configuration matches TEG's workflow where tickets move through:
`To Do → In Progress → Testing → Ready to Test → Ready for Release → Done`

### Changing Priority Points

Edit `background.js` around line 120:

```javascript
const priorityPoints = {
  'Urgent': 5,      // Change from 4 to 5
  'Highest': 5,
  'High': 3,
  'Medium': 2,
  'Low': 1,
  'Lowest': 1,
  'None': 0         // Change from 1 to 0
};
```

## Examples

### Example 1: All Fixed
```
Priority | Points | Total | Fixed | Total Score | Fixed Score
Urgent   | 4      | 10    | 10    | 40          | 40
High     | 3      | 20    | 20    | 60          | 60
Medium   | 2      | 30    | 30    | 60          | 60
Low      | 1      | 40    | 40    | 40          | 40
Total    |        | 100   | 100   | 200         | 200

Quality Score = 200/200 = 100% ✨
```

### Example 2: Only Low Priority Fixed
```
Priority | Points | Total | Fixed | Total Score | Fixed Score
Urgent   | 4      | 10    | 0     | 40          | 0
High     | 3      | 20    | 0     | 60          | 0
Medium   | 2      | 30    | 0     | 60          | 0
Low      | 1      | 40    | 40    | 40          | 40
Total    |        | 100   | 40    | 200         | 40

Quality Score = 40/200 = 20% ⚠️
(Even though 40% of tickets are fixed, the score is low because 
 they're all low priority)
```

### Example 3: Only High Priority Fixed
```
Priority | Points | Total | Fixed | Total Score | Fixed Score
Urgent   | 4      | 10    | 10    | 40          | 40
High     | 3      | 20    | 20    | 60          | 60
Medium   | 2      | 30    | 0     | 60          | 0
Low      | 1      | 40    | 0     | 40          | 0
Total    |        | 100   | 30    | 200         | 100

Quality Score = 100/200 = 50% ✓
(Only 30% of tickets fixed, but score is 50% because 
 they're high priority)
```

## Best Practices

### 1. Keep Status Updated
Ensure tickets move to "Done", "Closed", or "Resolved" when complete.

### 2. Set Priorities Correctly
Accurate priority assignment ensures meaningful quality scores.

### 3. Regular Reviews
Check quality score regularly:
- Daily during sprints
- Before releases
- After major milestones

### 4. Focus on High Priority
If score is low, focus on completing high-priority items first for biggest impact.

### 5. Track Trends
Monitor quality score over time to identify patterns.

## FAQ

**Q: Why is my score low even though many tickets are fixed?**
A: Low priority tickets have less weight. Check if your high priority tickets are incomplete.

**Q: What statuses count as "fixed"?**
A: By default: Done, Closed, Resolved, Fixed, Complete, Completed. You can customize this.

**Q: Can I change the priority points?**
A: Yes! Edit the `priorityPoints` object in `background.js`.

**Q: Does the score include sub-tasks?**
A: Yes, if they're returned by your JQL query and have a priority.

**Q: What if a ticket has no priority?**
A: It's assigned 1 point (same as Low priority).

**Q: How often should I check the quality score?**
A: Daily during active development, or before major milestones.

## Integration with Spreadsheet

The extension uses the same formula as your spreadsheet:

| Spreadsheet Cell | Extension Display |
|------------------|-------------------|
| D = B × C | Total Score (in table) |
| F = E × B | Fixed Score (in table) |
| G = F / D | Quality Score % (large number) |

The breakdown table matches your spreadsheet structure exactly!

---

**Need Help?** See `README.md` for troubleshooting or `SETUP_GUIDE.md` for configuration options.

