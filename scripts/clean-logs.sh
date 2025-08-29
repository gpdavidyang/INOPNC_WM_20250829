#!/bin/bash

# Server Log Cleanup and Configuration Script
# This script cleans up excessive logs and optimizes logging configuration

echo "🧹 Starting log cleanup and optimization..."

# Function to clean Next.js logs
clean_nextjs_logs() {
    echo "Cleaning Next.js logs..."
    
    # Clear .next build cache if it's too large
    if [ -d ".next" ]; then
        NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        echo "Current .next folder size: $NEXT_SIZE"
        
        # Remove trace files (they can get very large)
        find .next -name "*.trace" -type f -delete 2>/dev/null
        find .next -name "trace" -type d -exec rm -rf {} + 2>/dev/null
        
        echo "✅ Next.js trace files cleaned"
    fi
}

# Function to clean npm/yarn logs
clean_package_logs() {
    echo "Cleaning package manager logs..."
    
    # Clean npm logs
    npm cache clean --force 2>/dev/null
    
    # Clean yarn logs if yarn is used
    if command -v yarn &> /dev/null; then
        yarn cache clean 2>/dev/null
    fi
    
    # Remove log files
    rm -f npm-debug.log* yarn-error.log* pnpm-debug.log* 2>/dev/null
    
    echo "✅ Package manager logs cleaned"
}

# Function to clean system logs (macOS specific)
clean_system_logs() {
    echo "Cleaning system logs..."
    
    # Clear user logs (safe to delete)
    rm -rf ~/Library/Logs/com.apple.* 2>/dev/null
    
    # Clear diagnostic reports (they can accumulate)
    rm -rf ~/Library/Logs/DiagnosticReports/* 2>/dev/null
    
    echo "✅ System logs cleaned"
}

# Function to clean application logs
clean_app_logs() {
    echo "Cleaning application logs..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Rotate and compress old logs
    for log in logs/*.log; do
        if [ -f "$log" ]; then
            # Keep only last 1000 lines of each log
            tail -n 1000 "$log" > "${log}.tmp"
            mv "${log}.tmp" "$log"
        fi
    done
    
    # Remove old compressed logs (older than 7 days)
    find logs -name "*.gz" -mtime +7 -delete 2>/dev/null
    
    echo "✅ Application logs cleaned"
}

# Function to show disk usage
show_disk_usage() {
    echo ""
    echo "📊 Current disk usage:"
    df -h . | grep -v Filesystem
    echo ""
    echo "Top 10 largest directories:"
    du -sh * 2>/dev/null | sort -rh | head -10
}

# Function to optimize logging configuration
optimize_logging_config() {
    echo "Optimizing logging configuration..."
    
    # Update .env file if it exists
    if [ -f ".env" ]; then
        echo "📝 Updating .env file with optimized logging settings..."
        
        # Backup current .env
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update or add logging settings
        if grep -q "DEBUG_LEVEL" .env; then
            sed -i.bak 's/DEBUG_LEVEL=.*/DEBUG_LEVEL=error/' .env
        else
            echo "DEBUG_LEVEL=error" >> .env
        fi
        
        if grep -q "DEBUG_MODULES" .env; then
            sed -i.bak 's/DEBUG_MODULES=.*/DEBUG_MODULES=none/' .env
        else
            echo "DEBUG_MODULES=none" >> .env
        fi
        
        if grep -q "ENABLE_PERFORMANCE_MONITORING" .env; then
            sed -i.bak 's/ENABLE_PERFORMANCE_MONITORING=.*/ENABLE_PERFORMANCE_MONITORING=false/' .env
        else
            echo "ENABLE_PERFORMANCE_MONITORING=false" >> .env
        fi
        
        # Add new debug flags if not present
        for flag in DEBUG_SITE_INFO DEBUG_DATABASE DEBUG_REALTIME; do
            if ! grep -q "$flag" .env; then
                echo "$flag=false" >> .env
            else
                sed -i.bak "s/${flag}=.*/${flag}=false/" .env
            fi
        done
        
        echo "✅ Updated .env file with optimized settings"
    fi
}

# Main execution
main() {
    echo "================================================"
    echo "     Log Cleanup & Optimization for INOPNC_WM"
    echo "================================================"
    echo ""
    
    # Show initial disk usage
    echo "📊 Initial disk usage:"
    df -h . | grep -v Filesystem
    echo ""
    
    # Run cleanup functions
    clean_nextjs_logs
    clean_package_logs
    clean_system_logs
    clean_app_logs
    
    # Optimize logging configuration
    optimize_logging_config
    
    # Show final disk usage
    echo ""
    show_disk_usage
    
    echo ""
    echo "✅ Log cleanup and optimization completed!"
    echo ""
    echo "📋 What was changed:"
    echo "  • Cleaned Next.js trace files and cache"
    echo "  • Cleared package manager logs"
    echo "  • Rotated application logs"
    echo "  • DEBUG_LEVEL set to 'error' (only show errors)"
    echo "  • DEBUG_MODULES set to 'none' (disable module debugging)"
    echo "  • ENABLE_PERFORMANCE_MONITORING set to false"
    echo "  • All specific debug flags disabled"
    echo ""
    echo "💡 To temporarily enable debugging:"
    echo "  • Set DEBUG_LEVEL=debug for detailed logs"
    echo "  • Set DEBUG_MODULES=* to debug all modules"
    echo "  • Set specific flags like DEBUG_DATABASE=true"
    echo ""
    echo "🚀 Please restart your development server for changes to take effect:"
    echo "  npm run dev"
}

# Run main function
main