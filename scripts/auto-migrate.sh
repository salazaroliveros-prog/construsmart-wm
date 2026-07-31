#!/bin/bash

# ============================================================================
# Automatic Database Migration Script for CONSTRUCTORA WM/M&S
# Uses Supabase CLI if available, otherwise provides manual instructions
# ============================================================================

set -e

echo "🔍 Checking for Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    echo "🚀 Applying APU integration migration..."
    supabase db push --db-url="$NEXT_PUBLIC_SUPABASE_URL" 2>/dev/null || {
        echo "⚠️  CLI push failed, trying direct SQL execution..."
        supabase db execute --file supabase/migrations/add_apu_integration.sql
    }
    
    echo "✅ Migration completed successfully"
else
    echo "❌ Supabase CLI not found"
    echo ""
    echo "📋 MANUAL MIGRATION REQUIRED:"
    echo "1. Install Supabase CLI: npm install -g supabase"
    echo "2. Or use the SQL Editor in Supabase Dashboard"
    echo ""
    echo "📝 SQL to execute in Supabase SQL Editor:"
    echo "---"
    cat supabase/migrations/add_apu_integration.sql
    echo "---"
fi

echo ""
echo "🔍 Verifying migration..."
node scripts/sync-database.js
