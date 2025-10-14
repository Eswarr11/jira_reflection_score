#!/bin/bash

# Toggle Default Credentials Script
# Usage: ./toggle-credentials.sh [comment|uncomment]

FILES=("options.js" "background.js" "popup.js")
ACTION="${1:-}"

show_help() {
    echo "Usage: ./toggle-credentials.sh [comment|uncomment]"
    echo ""
    echo "Options:"
    echo "  comment     - Comment out credentials (before git push)"
    echo "  uncomment   - Uncomment credentials (for local development)"
    echo ""
    echo "Example:"
    echo "  ./toggle-credentials.sh comment     # Before pushing to git"
    echo "  ./toggle-credentials.sh uncomment   # After pulling from git"
}

comment_credentials() {
    echo "🔒 Commenting out credentials in 3 files..."
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            sed -i '' 's/^const DEFAULT_CREDENTIALS/\/\/ const DEFAULT_CREDENTIALS/' "$file"
            sed -i '' 's/^  jiraUrl:/\/\/   jiraUrl:/' "$file"
            sed -i '' 's/^  jiraEmail:/\/\/   jiraEmail:/' "$file"
            sed -i '' 's/^  jiraApiToken:/\/\/   jiraApiToken:/' "$file"
            sed -i '' 's/^};$/\/\/ };/' "$file"
            echo "  ✅ $file - credentials commented out"
        else
            echo "  ⚠️  $file not found"
        fi
    done
    echo ""
    echo "✨ Done! Credentials are now commented out. Safe to push to git."
}

uncomment_credentials() {
    echo "🔓 Uncommenting credentials in 3 files..."
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            sed -i '' 's/^\/\/ const DEFAULT_CREDENTIALS/const DEFAULT_CREDENTIALS/' "$file"
            sed -i '' 's/^\/\/   jiraUrl:/  jiraUrl:/' "$file"
            sed -i '' 's/^\/\/   jiraEmail:/  jiraEmail:/' "$file"
            sed -i '' 's/^\/\/   jiraApiToken:/  jiraApiToken:/' "$file"
            sed -i '' 's/^\/\/ };$/};/' "$file"
            echo "  ✅ $file - credentials uncommented"
        else
            echo "  ⚠️  $file not found"
        fi
    done
    echo ""
    echo "✨ Done! Credentials are now active for local development."
}

check_status() {
    echo "📋 Current credential status:"
    echo ""
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "^const DEFAULT_CREDENTIALS" "$file"; then
                echo "  🔓 $file - ACTIVE (credentials uncommented)"
            elif grep -q "^// const DEFAULT_CREDENTIALS" "$file"; then
                echo "  🔒 $file - SAFE (credentials commented out)"
            else
                echo "  ❓ $file - UNKNOWN (pattern not found)"
            fi
        else
            echo "  ⚠️  $file not found"
        fi
    done
    echo ""
}

# Main script logic
case "$ACTION" in
    comment)
        comment_credentials
        ;;
    uncomment)
        uncomment_credentials
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        echo "❌ Error: No action specified"
        echo ""
        show_help
        exit 1
        ;;
    *)
        echo "❌ Error: Unknown action '$ACTION'"
        echo ""
        show_help
        exit 1
        ;;
esac

# Show status after any change
if [ "$ACTION" = "comment" ] || [ "$ACTION" = "uncomment" ]; then
    echo ""
    check_status
fi

