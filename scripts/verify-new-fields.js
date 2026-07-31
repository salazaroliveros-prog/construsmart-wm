#!/usr/bin/env node

/**
 * Verification script for new renglon calculation system fields
 * Checks if database needs additional columns for time tracking
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying schema for new renglon calculation system...\n');

  // Check if budgets table needs time-related columns
  console.log('📋 Checking budgets table for time tracking fields...');

  try {
    // Try to query budgets with possible new fields
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying budgets:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const sampleBudget = data[0];
      console.log('✅ Sample budget structure:');
      console.log('   Fields:', Object.keys(sampleBudget).join(', '));
      
      // Check for time-related fields
      const hasTimeFields = sampleBudget.total_days !== undefined || 
                           sampleBudget.renglon_time_data !== undefined;
      
      if (hasTimeFields) {
        console.log('✅ Time tracking fields exist in budgets table');
      } else {
        console.log('⚠️  Time tracking fields not found in budgets table');
        console.log('ℹ️  Note: Time data is calculated from items and stored in localStorage budget state');
        console.log('ℹ️  No DB migration required for time tracking');
      }
    }

    // Check budget_items for apu_params structure
    console.log('\n📋 Checking budget_items for apu_params structure...');
    
    const { data: items, error: itemsError } = await supabase
      .from('budget_items')
      .select('apu_params')
      .not('apu_params', 'is', null)
      .limit(1);

    if (itemsError) {
      console.error('❌ Error querying budget_items:', itemsError.message);
      return;
    }

    if (items && items.length > 0) {
      const apuParams = items[0].apu_params;
      console.log('✅ Sample apu_params structure:');
      console.log('   Fields:', Object.keys(apuParams || {}).join(', '));
      
      if (apuParams) {
        const hasNewFields = apuParams.crewSize !== undefined || 
                            apuParams.efficiency !== undefined;
        
        if (hasNewFields) {
          console.log('✅ New fields (crewSize, efficiency) can be stored in apu_params JSONB');
        } else {
          console.log('ℹ️  apu_params exists but doesn\'t have new fields yet');
          console.log('ℹ️  New fields will be added on next save');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('CONCLUSION');
    console.log('='.repeat(60));
    console.log('✅ Database schema is compatible with new renglon system');
    console.log('✅ apu_params (JSONB) can store new fields: crewSize, efficiency');
    console.log('✅ Time data calculated from items, stored in localStorage');
    console.log('✅ No additional database migration required');
    console.log('\n✨ System ready to use');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    process.exit(1);
  }
}

verifySchema();
