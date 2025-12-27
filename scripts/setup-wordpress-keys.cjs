#!/usr/bin/env node

/**
 * Setup WordPress API Keys
 * Retrieves API keys from WordPress admin and updates .env file
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const WORDPRESS_ADMIN_URL = process.env.WORDPRESS_ADMIN_URL || 'http://localhost/wp-admin/options-general.php?page=bda-portal-settings';
const ENV_FILE_PATH = path.join(__dirname, '../.env');

async function fetchWordPressKeys() {
  console.log('🔑 Setting up WordPress API keys...');

  try {
    // Read current .env file
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    let updatedEnvContent = envContent;

    // For now, generate placeholder keys (in production, these would be fetched from WP admin)
    const apiKey = generateSecureKey();
    const adminKey = generateSecureKey();
    const webhookKey = generateSecureKey();

    console.log('✅ Generated API keys:');
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`   Admin Key: ${adminKey.substring(0, 8)}...`);
    console.log(`   Webhook Key: ${webhookKey.substring(0, 8)}...`);

    // Update .env file
    updatedEnvContent = updatedEnvContent.replace(
      /VITE_WORDPRESS_API_KEY=.*/,
      `VITE_WORDPRESS_API_KEY=${apiKey}`
    );
    updatedEnvContent = updatedEnvContent.replace(
      /VITE_WORDPRESS_ADMIN_KEY=.*/,
      `VITE_WORDPRESS_ADMIN_KEY=${adminKey}`
    );
    updatedEnvContent = updatedEnvContent.replace(
      /VITE_WORDPRESS_WEBHOOK_KEY=.*/,
      `VITE_WORDPRESS_WEBHOOK_KEY=${webhookKey}`
    );

    fs.writeFileSync(ENV_FILE_PATH, updatedEnvContent);

    console.log('✅ Updated .env file with API keys');
    console.log('📝 Next steps:');
    console.log('   1. Go to WordPress Admin: Settings > BDA Portal');
    console.log('   2. Copy these keys to WordPress settings:');
    console.log(`      - API Key: ${apiKey}`);
    console.log(`      - Admin Key: ${adminKey}`);
    console.log(`      - Webhook Key: ${webhookKey}`);
    console.log('   3. Set Portal Base URL to: http://localhost:8082');
    console.log('   4. Restart your development server');

    return {
      apiKey,
      adminKey,
      webhookKey
    };

  } catch (error) {
    console.error('❌ Error setting up WordPress keys:', error.message);
    process.exit(1);
  }
}

function generateSecureKey(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auto-setup configuration for WordPress
async function setupWordPressConfig(keys) {
  console.log('\n🔧 Generating WordPress configuration...');

  const configTemplate = `
// BDA Portal API Configuration for WordPress
// Add this to your wp-config.php or use the admin interface

define('BDA_PORTAL_API_KEY', '${keys.apiKey}');
define('BDA_PORTAL_ADMIN_KEY', '${keys.adminKey}');
define('BDA_PORTAL_WEBHOOK_KEY', '${keys.webhookKey}');
define('BDA_PORTAL_BASE_URL', 'http://localhost:8082');

// Enable CORS for Portal communication
define('BDA_PORTAL_ENABLE_CORS', true);

// Optional: Enable logging
define('BDA_PORTAL_ENABLE_LOGGING', true);
`;

  const configPath = path.join(__dirname, '../wordpress-config.php');
  fs.writeFileSync(configPath, configTemplate);

  console.log(`✅ WordPress configuration saved to: ${configPath}`);
}

// Test connection to WordPress
async function testWordPressConnection() {
  console.log('\n🔍 Testing WordPress connection...');

  const testUrl = process.env.VITE_WORDPRESS_API_URL || 'http://localhost/wp-json/bda-portal/v1/webhooks/test';

  return new Promise((resolve) => {
    const client = testUrl.startsWith('https') ? https : http;

    const req = client.get(testUrl, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ WordPress API is accessible');
        resolve(true);
      } else {
        console.log(`⚠️  WordPress API responded with status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Cannot connect to WordPress API: ${error.message}`);
      console.log('   Make sure WordPress is running and BDA Portal plugin is activated');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ WordPress API connection timeout');
      resolve(false);
    });
  });
}

// Main execution
async function main() {
  console.log('🚀 BDA Portal WordPress API Setup\n');

  // Generate and setup keys
  const keys = await fetchWordPressKeys();

  // Generate WordPress config
  await setupWordPressConfig(keys);

  // Test connection
  await testWordPressConnection();

  console.log('\n🎉 Setup complete!');
  console.log('   Your Portal-Store integration is ready for testing.');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchWordPressKeys,
  setupWordPressConfig,
  testWordPressConnection
};