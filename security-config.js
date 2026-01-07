// Security Configuration and Utilities
class SecurityManager {
    constructor() {
        this.rateLimiter = new Map();
        this.blockedIPs = new Set();
        this.suspiciousPatterns = [
            /script/gi,
            /javascript/gi,
            /onload/gi,
            /onerror/gi,
            /onclick/gi,
            /<.*>/gi,
            /eval\(/gi,
            /document\./gi,
            /window\./gi
        ];
        this.init();
    }

    init() {
        this.setupCSP();
        // Temporarily disable rate limiting to avoid fetch override issues
        // this.setupRateLimiting();
        this.setupInputValidation();
        this.setupErrorHandling();
        this.monitorSuspiciousActivity();
    }

    // Content Security Policy
    setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
            font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
            img-src 'self' data: https: blob:;
            connect-src 'self' https://*.supabase.co https://*.supabase.com https://cdn.jsdelivr.net;
            frame-src 'none';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
        `.replace(/\s+/g, ' ').trim();
        document.head.appendChild(meta);
    }

    // Rate limiting for API calls
    setupRateLimiting() {
        const self = this;
        this.originalFetch = window.fetch.bind(window);
        window.fetch = function(url, options = {}) {
            return self.rateLimitedFetch(url, options);
        };
    }

    rateLimitedFetch(url, options = {}) {
        const now = Date.now();
        const key = this.getClientIdentifier();
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, { count: 0, resetTime: now + 60000 }); // 1 minute window
        }

        const limit = this.rateLimiter.get(key);
        
        if (now > limit.resetTime) {
            limit.count = 0;
            limit.resetTime = now + 60000;
        }

        if (limit.count >= 100) { // Max 100 requests per minute
            console.warn('Rate limit exceeded');
            return Promise.reject(new Error('Rate limit exceeded'));
        }

        limit.count++;
        return this.originalFetch(url, options);
    }

    // Input validation and sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(input)) {
                console.warn('Suspicious input detected:', input);
                this.logSecurityEvent('suspicious_input', { input: input.substring(0, 100) });
                return '';
            }
        }

        // HTML encode special characters
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Validate URLs
    validateURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' && 
                   !this.isBlacklistedDomain(urlObj.hostname);
        } catch {
            return false;
        }
    }

    isBlacklistedDomain(domain) {
        const blacklist = [
            'malicious-site.com',
            'phishing-site.com'
            // Add known malicious domains
        ];
        return blacklist.includes(domain.toLowerCase());
    }

    // Setup input validation for forms
    setupInputValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const sanitized = this.sanitizeInput(e.target.value);
                if (sanitized !== e.target.value) {
                    e.target.value = sanitized;
                    this.showSecurityWarning('Input has been sanitized for security');
                }
            }
        });

        // Validate form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formData = new FormData(form);
            
            for (const [key, value] of formData.entries()) {
                if (typeof value === 'string') {
                    const sanitized = this.sanitizeInput(value);
                    if (sanitized !== value) {
                        e.preventDefault();
                        this.showSecurityWarning('Form contains invalid data');
                        return false;
                    }
                }
            }
        });
    }

    // Error handling to prevent information leakage
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Application error:', e.error);
            this.logSecurityEvent('application_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno
            });
            
            // Don't expose detailed error information to users
            if (e.error && e.error.message) {
                e.preventDefault();
                this.showUserFriendlyError();
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.logSecurityEvent('unhandled_rejection', {
                reason: e.reason?.toString()
            });
            e.preventDefault();
            this.showUserFriendlyError();
        });
    }

    // Monitor for suspicious activity
    monitorSuspiciousActivity() {
        let clickCount = 0;
        let lastClickTime = 0;

        document.addEventListener('click', (e) => {
            const now = Date.now();
            
            // Detect rapid clicking (potential bot)
            if (now - lastClickTime < 100) {
                clickCount++;
                if (clickCount > 10) {
                    this.logSecurityEvent('rapid_clicking', {
                        element: e.target.tagName,
                        count: clickCount
                    });
                    this.showSecurityWarning('Suspicious activity detected');
                }
            } else {
                clickCount = 0;
            }
            
            lastClickTime = now;
        });

        // Monitor for console access (potential tampering)
        let devtools = false;
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools) {
                    devtools = true;
                    this.logSecurityEvent('devtools_opened');
                }
            } else {
                devtools = false;
            }
        }, 1000);
    }

    // Get client identifier for rate limiting
    getClientIdentifier() {
        // Use a combination of factors to identify clients
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Security fingerprint', 2, 2);
        
        return btoa(
            navigator.userAgent +
            navigator.language +
            screen.width + 'x' + screen.height +
            new Date().getTimezoneOffset() +
            canvas.toDataURL()
        ).substring(0, 32);
    }

    // Security event logging
    async logSecurityEvent(type, data = {}) {
        try {
            const event = {
                type,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                clientId: this.getClientIdentifier(),
                ...data
            };

            // Log to Supabase if available
            if (window.supabase && window.supabaseClient) {
                await window.supabaseClient.from('security_events').insert([event]);
            }
            
            // Also log to console for development
            console.warn('Security event:', event);
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    // User-friendly error display
    showUserFriendlyError() {
        this.showNotification('Something went wrong. Please try again later.', 'error');
    }

    showSecurityWarning(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `security-notification security-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'shield-alt' : 'info-circle'}"></i>
            <span>${this.sanitizeInput(message)}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Secure Supabase initialization
    initializeSecureSupabase(url, key) {
        // Validate Supabase config
        if (!url || !key) {
            throw new Error('Missing required Supabase configuration');
        }

        if (!url.startsWith('https://')) {
            throw new Error('Supabase URL must use HTTPS');
        }

        // Initialize Supabase client
        const supabase = window.supabase.createClient(url, key);
        
        // Set up authentication state listener with security checks
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.logSecurityEvent('user_authenticated', {
                    userId: session.user.id,
                    email: session.user.email
                });
            }
        });

        return supabase;
    }

    // Secure data fetching for Supabase
    async secureDataFetch(supabase, table, options = {}) {
        try {
            const startTime = Date.now();
            
            // Build query with security constraints
            let query = supabase.from(table).select('*');
            
            // Add filters if provided
            if (options.filters) {
                options.filters.forEach(filter => {
                    query = query.eq(filter.column, filter.value);
                });
            }
            
            // Limit query size to prevent abuse
            const limit = options.limit && options.limit <= 50 ? options.limit : 50;
            query = query.limit(limit);
            
            // Add ordering if provided
            if (options.orderBy) {
                query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
            }
            
            const { data, error } = await query;
            const fetchTime = Date.now() - startTime;
            
            if (error) {
                throw error;
            }
            
            // Log slow queries (potential DoS attempts)
            if (fetchTime > 5000) {
                this.logSecurityEvent('slow_query', {
                    table,
                    fetchTime,
                    size: data?.length || 0
                });
            }
            
            return { data, error: null };
        } catch (error) {
            this.logSecurityEvent('data_fetch_error', {
                table,
                error: error.message
            });
            return { data: null, error };
        }
    }

    // Log security events to Supabase
    async logSecurityEvent(type, data = {}) {
        try {
            const event = {
                type,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                url: window.location.href,
                client_id: this.getClientIdentifier(),
                data: JSON.stringify(data)
            };

            // Log to Supabase if available
            if (window.supabase && window.supabaseClient) {
                await window.supabaseClient.from('security_events').insert([event]);
            }
            
            // Also log to console for development
            console.warn('Security event:', event);
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Add CSS for security notifications
const securityStyles = document.createElement('style');
securityStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .security-notification {
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        line-height: 1.4;
    }
    
    .security-notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    
    .security-notification button:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(securityStyles);

// Export for use in other scripts
window.SecurityManager = SecurityManager;
window.securityManager = securityManager;