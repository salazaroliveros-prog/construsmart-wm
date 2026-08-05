#!/usr/bin/env node

/**
 * Configuration Validation Script
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 *
 * Validates that all configuration files are properly set up
 * and that required environment variables are present.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, colors.green);
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, colors.red);
    return false;
  }
}

function checkEnvVar(varName, isRequired = true) {
  const value = process.env[varName];
  if (value) {
    log(`✓ ${varName} is set`, colors.green);
    return true;
  } else if (isRequired) {
    log(`✗ ${varName} is NOT set (REQUIRED)`, colors.red);
    return false;
  } else {
    log(`⚠ ${varName} is not set (OPTIONAL)`, colors.yellow);
    return true;
  }
}

function checkPackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    log(`✓ package.json exists`, colors.green);
    log(`  - Name: ${pkg.name}`, colors.cyan);
    log(`  - Version: ${pkg.version}`, colors.cyan);
    log(`  - Node: ${pkg.engines?.node || 'not specified'}`, colors.cyan);
    return true;
  } catch (error) {
    log(`✗ package.json is invalid`, colors.red);
    return false;
  }
}

function checkVercelJson() {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    log(`✓ vercel.json exists`, colors.green);
    
    // Check for invalid properties
    const invalidProps = ['domains', 'name'];
    const foundInvalid = invalidProps.filter(prop => vercelConfig[prop]);
    
    if (foundInvalid.length > 0) {
      log(`  ⚠ Contains invalid properties: ${foundInvalid.join(', ')}`, colors.yellow);
      return false;
    }
    
    log(`  - Build Command: ${vercelConfig.buildCommand}`, colors.cyan);
    log(`  - Framework: ${vercelConfig.framework}`, colors.cyan);
    return true;
  } catch (error) {
    log(`✗ vercel.json is invalid or missing`, colors.red);
    return false;
  }
}

function checkGitignore() {
  try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    log(`✓ .gitignore exists`, colors.green);
    
    // Check for security issues
    if (gitignore.includes('components.json')) {
      log(`  ⚠ components.json is in .gitignore (needed for shadcn)`, colors.yellow);
      return false;
    }
    
    // Check for critical ignores
    const criticalIgnores = ['.env', '.env.local', '.env.production', 'node_modules', '.next'];
    const missingIgnores = criticalIgnores.filter(ign => !gitignore.includes(ign));
    
    if (missingIgnores.length > 0) {
      log(`  ⚠ Missing critical ignores: ${missingIgnores.join(', ')}`, colors.yellow);
      return false;
    }
    
    return true;
  } catch (error) {
    log(`✗ .gitignore is invalid or missing`, colors.red);
    return false;
  }
}

function checkEnvLocal() {
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    log(`✓ .env.local exists`, colors.green);
    
    // Check for security issues
    if (envLocal.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')) {
      log(`  ✗ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is exposed (SECURITY RISK)`, colors.red);
      return false;
    }
    
    if (envLocal.includes('NEXT_PUBLIC_') && envLocal.includes('SERVICE_ROLE')) {
      log(`  ⚠ Contains NEXT_PUBLIC_* with SERVICE_ROLE (check for exposed keys)`, colors.yellow);
    }
    
    return true;
  } catch (error) {
    log(`⚠ .env.local not found (not required for production)`, colors.yellow);
    return true;
  }
}

function main() {
  log('\n=== Configuration Validation ===', colors.blue);
  log('CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"\n', colors.cyan);
  
  let allPassed = true;
  
  // Check core configuration files
  log('\n--- Core Configuration Files ---', colors.blue);
  allPassed &= checkFile('package.json', 'package.json');
  allPassed &= checkPackageJson();
  allPassed &= checkFile('next.config.ts', 'Next.js config');
  allPassed &= checkFile('tsconfig.json', 'TypeScript config');
  allPassed &= checkFile('tailwind.config.ts', 'Tailwind config');
  allPassed &= checkFile('postcss.config.js', 'PostCSS config');
  allPassed &= checkFile('components.json', 'Shadcn components config');
  
  // Check deployment configuration
  log('\n--- Deployment Configuration ---', colors.blue);
  allPassed &= checkFile('vercel.json', 'Vercel config');
  allPassed &= checkVercelJson();
  allPassed &= checkFile('.vercelignore', 'Vercel ignore');
  allPassed &= checkFile('.gitignore', 'Git ignore');
  allPassed &= checkGitignore();
  
  // Check environment files
  log('\n--- Environment Configuration ---', colors.blue);
  allPassed &= checkFile('.env.local', 'Local environment');
  allPassed &= checkEnvLocal();
  allPassed &= checkFile('.env.production', 'Production environment');
  
  // Check proxy
  log('\n--- Routing Configuration ---', colors.blue);
  const hasProxy = checkFile('proxy.ts', 'Proxy (Next.js modern)');
  
  // Check public files
  log('\n--- Public Files ---', colors.blue);
  allPassed &= checkFile('public/manifest.json', 'PWA manifest');
  allPassed &= checkFile('public/sw.js', 'Service Worker');
  
  // Check Supabase config
  log('\n--- Supabase Configuration ---', colors.blue);
  allPassed &= checkFile('supabase/config.toml', 'Supabase CLI config');
  allPassed &= checkFile('lib/supabase/client.ts', 'Supabase client');
  
  // Final result
  log('\n=== Validation Result ===', colors.blue);
  if (allPassed) {
    log('✓ All configurations are valid!', colors.green);
    process.exit(0);
  } else {
    log('✗ Some configurations need attention', colors.red);
    process.exit(1);
  }
}

main();