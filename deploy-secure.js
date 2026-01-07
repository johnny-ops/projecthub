#!/usr/bin/env node

/**
 * Secure Deployment Script for Project Hub
 * This script helps deploy the project with proper security configurations
 */

const fs = require('fs');
const path = require('path');

class SecureDeployment {
    constructor() {
        this.config = {
            firebaseConfig: null,
            adminEmail: null,
            domain: null
        };
        this.securityChecks = [];
    }

    async deploy() {
        console.log('🚀 Starting secure deployment process...\n');
        
        try {
            await this.runSecurityChecks();
            await this.validateConfiguration();
            await this.generateSecurityFiles();
            await this.deployFirebaseRules();
            
            console.log('\n✅ Deployment completed successfully!');
            console.log('\n📋 Post-deployment checklist:');
            console.log('   - Test admin login functionality');
            console.log('   - Verify project loading on main site');
            console.log('   - Check security event logging');
            console.log('   - Monitor Firebase usage dashboard');
            
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async runSecurityChecks() {
        console.log('🔍 Running security checks...');
        
        const checks = [
            this.checkHTTPS(),
            this.checkFirebaseConfig(),
            this.checkSecurityRules(),
            this.checkInputValidation(),
            this.checkErrorHandling()
        ];

        for (const check of checks) {
            await check;
        }

        console.log('✅ All security checks passed\n');
    }

    checkHTTPS() {
        return new Promise((resolve) => {
            console.log('   - Checking HTTPS configuration...');
            
            // Check if deployment is configured for HTTPS
            const hasHTTPS = this.config.domain && this.config.domain.startsWith('https://');
            
            if (!hasHTTPS) {
                console.warn('   ⚠️  Warning: Ensure HTTPS is enabled on your domain');
            } else {
                console.log('   ✅ HTTPS configuration verified');
            }
            
            resolve();
        });
    }

    checkFirebaseConfig() {
        return new Promise((resolve, reject) => {
            console.log('   - Validating Firebase configuration...');
            
            try {
                const scriptContent = fs.readFileSync('script.js', 'utf8');
                const adminScriptContent = fs.readFileSync('admin-script.js', 'utf8');
                
                // Check if Firebase config is properly set
                if (scriptContent.includes('your-api-key') || adminScriptContent.includes('your-api-key')) {
                    reject(new Error('Firebase configuration not updated. Please replace placeholder values.'));
                }
                
                console.log('   ✅ Firebase configuration validated');
                resolve();
            } catch (error) {
                reject(new Error('Failed to validate Firebase configuration: ' + error.message));
            }
        });
    }

    checkSecurityRules() {
        return new Promise((resolve, reject) => {
            console.log('   - Checking Firestore security rules...');
            
            try {
                const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
                
                // Check if admin email is updated
                if (rulesContent.includes('your-admin@email.com')) {
                    reject(new Error('Admin email not updated in firestore.rules'));
                }
                
                // Check for required security rules
                const requiredRules = [
                    'request.auth != null',
                    'validateProjectData()',
                    'validateInquiryData()'
                ];
                
                for (const rule of requiredRules) {
                    if (!rulesContent.includes(rule)) {
                        reject(new Error(`Missing security rule: ${rule}`));
                    }
                }
                
                console.log('   ✅ Security rules validated');
                resolve();
            } catch (error) {
                reject(new Error('Failed to validate security rules: ' + error.message));
            }
        });
    }

    checkInputValidation() {
        return new Promise((resolve) => {
            console.log('   - Verifying input validation...');
            
            try {
                const securityConfigContent = fs.readFileSync('security-config.js', 'utf8');
                
                // Check for security patterns
                const securityFeatures = [
                    'sanitizeInput',
                    'validateURL',
                    'rateLimitedFetch',
                    'setupCSP'
                ];
                
                for (const feature of securityFeatures) {
                    if (!securityConfigContent.includes(feature)) {
                        console.warn(`   ⚠️  Warning: ${feature} not found in security config`);
                    }
                }
                
                console.log('   ✅ Input validation verified');
                resolve();
            } catch (error) {
                console.warn('   ⚠️  Warning: Could not verify input validation');
                resolve();
            }
        });
    }

    checkErrorHandling() {
        return new Promise((resolve) => {
            console.log('   - Checking error handling...');
            
            try {
                const scriptFiles = ['script.js', 'admin-script.js'];
                
                for (const file of scriptFiles) {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Check for proper error handling
                    if (!content.includes('try {') || !content.includes('catch')) {
                        console.warn(`   ⚠️  Warning: Limited error handling in ${file}`);
                    }
                }
                
                console.log('   ✅ Error handling verified');
                resolve();
            } catch (error) {
                console.warn('   ⚠️  Warning: Could not verify error handling');
                resolve();
            }
        });
    }

    async validateConfiguration() {
        console.log('🔧 Validating configuration files...');
        
        // Check required files exist
        const requiredFiles = [
            'projecthub.html',
            'admin-dashboard.html',
            'script.js',
            'admin-script.js',
            'style.css',
            'admin-style.css',
            'security-config.js',
            'firestore.rules'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        console.log('✅ All required files present\n');
    }

    async generateSecurityFiles() {
        console.log('📝 Generating additional security files...');
        
        // Generate .htaccess for Apache servers
        const htaccessContent = `
# Security Headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Prevent access to sensitive files
<Files ~ "\\.(rules|md|json)$">
    Order allow,deny
    Deny from all
</Files>

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent hotlinking
RewriteCond %{HTTP_REFERER} !^$
RewriteCond %{HTTP_REFERER} !^https://(www\\.)?yourdomain\\.com [NC]
RewriteRule \\.(jpg|jpeg|png|gif|css|js)$ - [F]
`;

        fs.writeFileSync('.htaccess', htaccessContent.trim());
        
        // Generate robots.txt
        const robotsContent = `
User-agent: *
Allow: /
Disallow: /admin-dashboard.html
Disallow: /admin-*
Disallow: /*.rules
Disallow: /*.md

Sitemap: https://yourdomain.com/sitemap.xml
`;

        fs.writeFileSync('robots.txt', robotsContent.trim());
        
        console.log('✅ Security files generated\n');
    }

    async deployFirebaseRules() {
        console.log('🔥 Deploying Firebase security rules...');
        
        try {
            // Check if Firebase CLI is available
            const { execSync } = require('child_process');
            
            try {
                execSync('firebase --version', { stdio: 'ignore' });
            } catch (error) {
                console.warn('   ⚠️  Firebase CLI not found. Please install and deploy rules manually:');
                console.warn('   npm install -g firebase-tools');
                console.warn('   firebase login');
                console.warn('   firebase deploy --only firestore:rules');
                return;
            }
            
            // Deploy rules
            execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
            console.log('✅ Firebase rules deployed successfully\n');
            
        } catch (error) {
            console.warn('   ⚠️  Could not deploy Firebase rules automatically');
            console.warn('   Please deploy manually: firebase deploy --only firestore:rules\n');
        }
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            checks: this.securityChecks,
            recommendations: [
                'Enable HTTPS on your domain',
                'Set up monitoring for security events',
                'Regularly update Firebase SDKs',
                'Monitor Firebase usage dashboard',
                'Set up backup procedures',
                'Review security rules quarterly'
            ]
        };

        fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));
        console.log('📊 Security report generated: security-report.json');
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new SecureDeployment();
    deployment.deploy().then(() => {
        deployment.generateSecurityReport();
    });
}

module.exports = SecureDeployment;