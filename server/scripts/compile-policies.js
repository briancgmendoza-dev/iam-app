#!/usr/bin/env node

/**
 * Policy Compilation Script
 * Compiles Rego policies to WASM bundles for production use
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const POLICIES_DIR = path.join(__dirname, '../src/policies');
const OUTPUT_DIR = path.join(__dirname, '../dist/policies');
const BUNDLE_FILE = path.join(OUTPUT_DIR, 'bundle.tar.gz');

console.log('🔨 Compiling OPA policies to WASM...');

// Check if OPA CLI is available
function checkOpaCliAvailable() {
    try {
        // First try local binary in server directory
        const localOpa = path.join(__dirname, '../opa');
        execSync(`${localOpa} version`, { stdio: 'pipe' });
        return localOpa;
    } catch (error) {
        try {
            // Then try system binary
            execSync('opa version', { stdio: 'pipe' });
            return 'opa';
        } catch (systemError) {
            console.log('❌ OPA CLI not found. Installing OPA...');
            console.log('Please install OPA CLI: https://www.openpolicyagent.org/docs/latest/get-started/');
            console.log('Or use: curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static');
            return false;
        }
    }
}

try {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if OPA CLI is available
  const opaCommand = checkOpaCliAvailable();
  if (!opaCommand) {
    console.log('❌ Compilation script failed: OPA CLI required for policy compilation');
    process.exit(1);
  }

  // Build the policy bundle
  console.log('📦 Building policy bundle...');

  const buildCommand = `${opaCommand} build -t wasm -e rbac/allow -e rbac/violations -e rbac/deny_reasons ${POLICIES_DIR}`;

  try {
    execSync(buildCommand, {
      stdio: 'inherit',
      cwd: path.dirname(POLICIES_DIR)
    });

    // Move the bundle to our output directory
    const defaultBundle = path.join(path.dirname(POLICIES_DIR), 'bundle.tar.gz');
    if (fs.existsSync(defaultBundle)) {
      fs.renameSync(defaultBundle, BUNDLE_FILE);
    }

    console.log('✅ Policy compilation completed successfully!');
    console.log(`📄 Bundle created: ${BUNDLE_FILE}`);

  } catch (error) {
    console.error('❌ Policy compilation failed:', error.message);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Compilation script failed:', error.message);
  process.exit(1);
}
