// Supabase Configuration
// Replace with your Supabase project details
const SUPABASE_URL = 'https://vnwhnmevbehgqcwteiyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZud2hubWV2YmVoZ3Fjd3RlaXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTA0MjIsImV4cCI6MjA4MzI4NjQyMn0.I6N8pkXpMoBRkJZr1wnNxQ10BRfG0WNoNJ4EMr7N6wo';

// Initialize Supabase
let supabaseClient;
try {
    if (window.securityManager) {
        supabaseClient = window.securityManager.initializeSecureSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    window.supabaseClient = supabaseClient;
} catch (error) {
    console.error('Supabase initialization failed:', error);
    if (window.securityManager) {
        window.securityManager.logSecurityEvent('supabase_init_error', { error: error.message });
    }
}

// Global variables
let currentUser = null;
let projects = [];
let stats = {
    total: 0,
    websites: 0,
    mobile: 0,
    inquiries: 0
};

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('page-title');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
});

// Authentication
function initializeAuth() {
    showLoading();
    
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            userEmail.textContent = session.user.email;
            checkAdminAccess(session.user);
        } else if (event === 'SIGNED_OUT') {
            showLoginForm();
        }
    });

    // Check current session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            currentUser = session.user;
            userEmail.textContent = session.user.email;
            checkAdminAccess(session.user);
        } else {
            showLoginForm();
        }
    });
}

async function checkAdminAccess(user) {
    try {
        // First check if admin_users table exists and has data
        const { data, error, count } = await supabaseClient
            .from('admin_users')
            .select('role', { count: 'exact' })
            .eq('user_id', user.id)
            .maybeSingle();

        // If error is about missing table or RLS, try to create admin user
        if (error) {
            console.error('Admin check error:', error);
            
            // Try to add user as admin
            try {
                const { error: addError } = await supabaseClient.rpc('add_admin_user', {
                    user_email: user.email
                });
                
                if (!addError) {
                    // Successfully added, reload
                    initializeDashboard();
                    hideLoading();
                    return;
                }
            } catch (rpcError) {
                console.error('Could not add admin user:', rpcError);
            }
            
            showAccessDenied();
            return;
        }

        if (!data) {
            // User not in admin_users table
            showAccessDenied();
            return;
        }

        // User is admin, initialize dashboard
        initializeDashboard();
        hideLoading();
    } catch (error) {
        console.error('Error checking admin access:', error);
        showAccessDenied();
    }
}

function showAccessDenied() {
    hideLoading();
    document.body.innerHTML = `
        <div class="access-denied">
            <h2>Access Denied</h2>
            <p>You don't have permission to access this admin panel.</p>
            <button onclick="logout()" class="btn btn-primary">Logout</button>
        </div>
    `;
}

function showLoginForm() {
    hideLoading();
    const loginHtml = `
        <div class="login-container">
            <div class="login-form">
                <h2>Admin Login</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div id="login-error" class="error-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.innerHTML = loginHtml;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        showLoading();
        
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            hideLoading();
            const errorDiv = document.getElementById('login-error');
            errorDiv.textContent = 'Login failed: ' + error.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function logout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// Dashboard initialization
function initializeDashboard() {
    loadProjects();
    loadStats();
    loadRecentActivity();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Add project form
    const addProjectForm = document.getElementById('add-project-form');
    if (addProjectForm) {
        addProjectForm.addEventListener('submit', handleAddProject);
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProjects);
    }

    // Refresh projects
    const refreshBtn = document.getElementById('refresh-projects');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadProjects);
    }

    // Save settings
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
}

// Navigation
function switchSection(sectionName) {
    // Update navigation
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Update content
    contentSections.forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(`${sectionName}-section`);
    if (activeSection) activeSection.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'projects': 'Manage Projects',
        'add-project': 'Add New Project',
        'categories': 'Categories',
        'settings': 'Settings'
    };
    if (pageTitle) pageTitle.textContent = titles[sectionName] || 'Dashboard';

    // Load section-specific data
    if (sectionName === 'projects') {
        loadProjects();
    } else if (sectionName === 'categories') {
        updateCategoryCounts();
    }
}

// Projects Management
async function loadProjects() {
    try {
        showLoading();
        
        let result;
        if (window.securityManager) {
            result = await window.securityManager.secureDataFetch(supabaseClient, 'projects', {
                limit: 50,
                orderBy: { column: 'created_at', ascending: false }
            });
        } else {
            result = await supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
        }

        if (result.error) {
            throw result.error;
        }

        projects = result.data || [];
        displayProjects(projects);
        updateStats();
        hideLoading();
    } catch (error) {
        console.error('Error loading projects:', error);
        hideLoading();
        showNotification('Error loading projects: ' + error.message, 'error');
    }
}

function displayProjects(projectsToShow = projects) {
    const projectsGrid = document.getElementById('projects-grid');
    
    if (!projectsGrid) return;
    
    if (projectsToShow.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No projects found</p>
            </div>
        `;
        return;
    }

    projectsGrid.innerHTML = projectsToShow.map(project => `
        <div class="project-card fade-in">
            <img src="${project.image_url}" alt="${escapeHtml(project.title)}" class="project-image" 
                 onerror="this.src='https://via.placeholder.com/600x400/222222/FFFFFF?text=Image+Not+Found'">
            <div class="project-info">
                <h4 class="project-title">${escapeHtml(project.title)}</h4>
                <span class="project-category status-${project.status}">${project.category}</span>
                <p class="project-description">${escapeHtml(project.description)}</p>
                <div class="project-meta">
                    <small>Status: ${project.status}</small>
                    <small>Views: ${project.views || 0}</small>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="editProject('${project.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteProject('${project.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleAddProject(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Process features array
    const featuresText = formData.get('features');
    const features = featuresText ? featuresText.split('\n').filter(f => f.trim()) : null;
    
    // Process PDF images array
    const pdfImagesText = formData.get('pdf_images');
    const pdfImages = pdfImagesText ? pdfImagesText.split('\n').filter(url => url.trim()) : null;
    
    const projectData = {
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        image_url: formData.get('imageUrl'),
        technologies: formData.get('technologies'),
        features: features,
        pdf_images: pdfImages,
        pdf_content: formData.get('pdf_content') || null,
        demo_url: formData.get('demo_url') || null,
        github_url: formData.get('github_url') || null,
        status: formData.get('status'),
        views: 0
    };

    // Validate data
    if (window.securityManager) {
        projectData.title = window.securityManager.sanitizeInput(projectData.title);
        projectData.description = window.securityManager.sanitizeInput(projectData.description);
        projectData.technologies = window.securityManager.sanitizeInput(projectData.technologies);
        
        if (!window.securityManager.validateURL(projectData.image_url)) {
            showNotification('Invalid image URL', 'error');
            return;
        }
    }

    try {
        showLoading();
        
        const editId = e.target.dataset.editId;
        let result;
        
        if (editId) {
            // Update existing project
            result = await supabaseClient
                .from('projects')
                .update(projectData)
                .eq('id', editId);
        } else {
            // Create new project
            result = await supabaseClient
                .from('projects')
                .insert([projectData]);
        }

        if (result.error) {
            throw result.error;
        }
        
        // Add to activity log
        await logActivity(editId ? 'project_updated' : 'project_added', 
                         `${editId ? 'Updated' : 'Added'} project: ${projectData.title}`);
        
        // Reset form
        e.target.reset();
        delete e.target.dataset.editId;
        
        // Reset button text
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Project';
        
        // Refresh projects
        await loadProjects();
        
        // Switch to projects view
        switchSection('projects');
        
        hideLoading();
        showNotification(`Project ${editId ? 'updated' : 'added'} successfully!`, 'success');
    } catch (error) {
        console.error('Error saving project:', error);
        hideLoading();
        showNotification('Error saving project: ' + error.message, 'error');
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }

    try {
        showLoading();
        const project = projects.find(p => p.id === projectId);
        
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) {
            throw error;
        }
        
        // Add to activity log
        await logActivity('project_deleted', `Deleted project: ${project.title}`);
        
        await loadProjects();
        hideLoading();
        showNotification('Project deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        hideLoading();
        showNotification('Error deleting project: ' + error.message, 'error');
    }
}

function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Switch to add project section and populate form
    switchSection('add-project');
    
    // Populate form fields
    const form = document.getElementById('add-project-form');
    if (!form) return;
    
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-category').value = project.category;
    document.getElementById('project-description').value = project.description;
    document.getElementById('project-image').value = project.image_url;
    document.getElementById('project-technologies').value = project.technologies || '';
    document.getElementById('project-status').value = project.status;

    // Change form to edit mode
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Project';
    
    // Store project ID for update
    form.dataset.editId = projectId;
}

function filterProjects() {
    const filter = document.getElementById('category-filter')?.value;
    if (!filter) return;
    
    if (filter === 'all') {
        displayProjects(projects);
    } else {
        const filtered = projects.filter(project => project.category === filter);
        displayProjects(filtered);
    }
}

// Statistics
function updateStats() {
    stats.total = projects.length;
    stats.websites = projects.filter(p => p.category === 'website').length;
    stats.mobile = projects.filter(p => p.category === 'mobile').length;
    stats.views = projects.reduce((total, project) => total + (project.views || 0), 0);

    const totalEl = document.getElementById('total-projects');
    const websiteEl = document.getElementById('website-projects');
    const mobileEl = document.getElementById('mobile-projects');
    const viewsEl = document.getElementById('total-views');

    if (totalEl) totalEl.textContent = stats.total;
    if (websiteEl) websiteEl.textContent = stats.websites;
    if (mobileEl) mobileEl.textContent = stats.mobile;
    if (viewsEl) viewsEl.textContent = stats.views;
}

function updateCategoryCounts() {
    const websitesCount = document.getElementById('websites-count');
    const mobileCount = document.getElementById('mobile-count');
    
    if (websitesCount) websitesCount.textContent = stats.websites;
    if (mobileCount) mobileCount.textContent = stats.mobile;
}

async function loadStats() {
    updateStats();
}

// Activity Log
async function loadRecentActivity() {
    try {
        const { data, error } = await supabaseClient
            .from('activity')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(5);

        if (error) {
            throw error;
        }
        
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        if (!data || data.length === 0) {
            activityList.innerHTML = '<p class="text-secondary">No recent activity</p>';
            return;
        }

        activityList.innerHTML = data.map(activity => {
            const date = new Date(activity.timestamp);
            const timeAgo = getTimeAgo(date);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${escapeHtml(activity.description)}</p>
                        <span>${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

async function logActivity(type, description) {
    try {
        const { error } = await supabaseClient
            .from('activity')
            .insert([{
                type,
                description,
                user_id: currentUser?.id
            }]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

function getActivityIcon(type) {
    const icons = {
        'project_added': 'plus',
        'project_deleted': 'trash',
        'project_updated': 'edit',
        'settings_updated': 'cog'
    };
    return icons[type] || 'info';
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// Settings
async function saveSettings() {
    const siteTitle = document.getElementById('site-title')?.value;
    const contactEmail = document.getElementById('contact-email')?.value;
    const facebookUsername = document.getElementById('facebook-username')?.value;

    const settings = [
        { key: 'site_title', value: siteTitle },
        { key: 'contact_email', value: contactEmail },
        { key: 'facebook_username', value: facebookUsername }
    ].filter(setting => setting.value);

    try {
        showLoading();
        
        for (const setting of settings) {
            const { error } = await supabaseClient
                .from('settings')
                .upsert({ key: setting.key, value: setting.value });
                
            if (error) {
                throw error;
            }
        }
        
        await logActivity('settings_updated', 'Updated site settings');
        
        hideLoading();
        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        hideLoading();
        showNotification('Error saving settings: ' + error.message, 'error');
    }
}

// Utility Functions
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i>
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0; margin-left: auto;">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#ffffff' : type === 'error' ? '#666666' : '#cccccc'};
        color: ${type === 'success' ? '#000000' : '#ffffff'};
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        border: 1px solid ${type === 'success' ? '#000000' : '#333333'};
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
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

// Add CSS for notifications and other styles
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: var(--bg-primary);
        font-family: 'Inter', sans-serif;
    }
    
    .login-form {
        background-color: var(--bg-secondary);
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border-color);
        width: 100%;
        max-width: 400px;
    }
    
    .login-form h2 {
        text-align: center;
        margin-bottom: 2rem;
        color: var(--text-primary);
    }
    
    .access-denied {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-family: 'Inter', sans-serif;
        text-align: center;
    }
    
    .access-denied h2 {
        margin-bottom: 1rem;
        color: #888888;
    }
    
    .access-denied p {
        margin-bottom: 2rem;
        color: var(--text-secondary);
    }
    
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .empty-state i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .project-meta {
        display: flex;
        justify-content: space-between;
        margin: 1rem 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .error-message {
        color: #888888;
        margin-top: 1rem;
        padding: 0.5rem;
        background-color: rgba(136, 136, 136, 0.1);
        border-radius: 0.25rem;
        border: 1px solid #666666;
    }
    
    /* Inquiries Styles */
    .inquiries-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .inquiry-card {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1.5rem;
        transition: transform 0.2s;
    }
    
    .inquiry-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .inquiry-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }
    
    .inquiry-info h4 {
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .inquiry-info .inquiry-email {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
    
    .inquiry-status {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .inquiry-status.status-new {
        background-color: var(--primary-color);
        color: #000000;
        font-weight: 600;
    }
    
    .inquiry-status.status-contacted {
        background-color: #cccccc;
        color: #000000;
        font-weight: 600;
    }
    
    .inquiry-status.status-closed {
        background-color: #666666;
        color: white;
        font-weight: 600;
    }
    
    .inquiry-details {
        margin-bottom: 1rem;
    }
    
    .inquiry-project {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
    }
    
    .inquiry-budget {
        color: var(--primary-color);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }
    
    .inquiry-message {
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 1rem;
    }
    
    .inquiry-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .inquiry-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .inquiry-actions .btn {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
    }
    
    .custom-project-inquiry {
        border-left: 4px solid var(--primary-color);
    }
    
    .custom-project-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: var(--primary-color);
        color: #000000;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }
    
    .custom-project-badge i {
        margin-right: 0.5rem;
    }
    
    .inquiry-type,
    .inquiry-timeline {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }
    
    .inquiry-type i,
    .inquiry-timeline i,
    .inquiry-budget i {
        margin-right: 0.5rem;
        color: var(--primary-color);
    }
`;
document.head.appendChild(adminStyles);

// Inquiries Management
async function loadInquiries() {
    try {
        showLoading();
        
        const { data, error } = await supabaseClient
            .from('inquiries')
            .select(`
                *,
                projects (
                    title,
                    category
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        displayInquiries(data || []);
        updateInquiriesStats(data || []);
        hideLoading();
    } catch (error) {
        console.error('Error loading inquiries:', error);
        hideLoading();
        showNotification('Error loading inquiries: ' + error.message, 'error');
    }
}

function displayInquiries(inquiries) {
    const inquiriesList = document.getElementById('inquiries-list');
    
    if (!inquiriesList) return;
    
    if (inquiries.length === 0) {
        inquiriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope-open"></i>
                <p>No inquiries yet</p>
            </div>
        `;
        return;
    }

    inquiriesList.innerHTML = inquiries.map(inquiry => {
        const isCustomProject = !inquiry.project_id || inquiry.project_type;
        
        return `
        <div class="inquiry-card ${isCustomProject ? 'custom-project-inquiry' : ''}">
            <div class="inquiry-header">
                <div class="inquiry-info">
                    <h4>${escapeHtml(inquiry.name)}</h4>
                    <div class="inquiry-email">${escapeHtml(inquiry.email)}</div>
                    ${inquiry.phone ? `<div class="inquiry-phone"><i class="fas fa-phone"></i> ${escapeHtml(inquiry.phone)}</div>` : ''}
                </div>
                <span class="inquiry-status status-${inquiry.status}">${inquiry.status}</span>
            </div>
            <div class="inquiry-details">
                ${isCustomProject ? `
                    <div class="custom-project-badge">
                        <i class="fas fa-rocket"></i> Custom Development Request
                    </div>
                ` : ''}
                <div class="inquiry-project">
                    ${isCustomProject ? 'Project: ' : 'Interested in: '}
                    ${escapeHtml(inquiry.project_title)}
                </div>
                ${inquiry.project_type ? `<div class="inquiry-type"><i class="fas fa-code"></i> Type: ${escapeHtml(inquiry.project_type)}</div>` : ''}
                ${inquiry.timeline ? `<div class="inquiry-timeline"><i class="fas fa-clock"></i> Timeline: ${escapeHtml(inquiry.timeline)}</div>` : ''}
                ${inquiry.budget ? `<div class="inquiry-budget"><i class="fas fa-dollar-sign"></i> Budget: ${escapeHtml(inquiry.budget)}</div>` : ''}
                <div class="inquiry-message">${escapeHtml(inquiry.message)}</div>
            </div>
            <div class="inquiry-meta">
                <span><i class="fas fa-calendar"></i> ${new Date(inquiry.created_at).toLocaleDateString()} ${new Date(inquiry.created_at).toLocaleTimeString()}</span>
                <div class="inquiry-actions">
                    ${inquiry.status === 'new' ? `
                        <button class="btn btn-primary" onclick="updateInquiryStatus('${inquiry.id}', 'contacted')">
                            <i class="fas fa-check"></i> Mark Contacted
                        </button>
                    ` : ''}
                    ${inquiry.status === 'contacted' ? `
                        <button class="btn btn-success" onclick="updateInquiryStatus('${inquiry.id}', 'closed')">
                            <i class="fas fa-check-double"></i> Mark Closed
                        </button>
                    ` : ''}
                    <a href="mailto:${escapeHtml(inquiry.email)}" class="btn btn-secondary">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                </div>
            </div>
        </div>
    `}).join('');
}

async function updateInquiryStatus(inquiryId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('inquiries')
            .update({ status: newStatus })
            .eq('id', inquiryId);

        if (error) {
            throw error;
        }

        showNotification('Inquiry status updated successfully!', 'success');
        loadInquiries(); // Refresh the list
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        showNotification('Error updating inquiry status: ' + error.message, 'error');
    }
}

function updateInquiriesStats(inquiries) {
    stats.inquiries = inquiries.length;
    
    const totalInquiriesEl = document.getElementById('total-inquiries');
    if (totalInquiriesEl) {
        totalInquiriesEl.textContent = stats.inquiries;
    }
}

function viewInquiryDetails(inquiryId) {
    // Find the inquiry
    const inquiryCard = document.querySelector(`[onclick*="${inquiryId}"]`).closest('.inquiry-card');
    
    // Toggle expanded view or show modal with full details
    if (inquiryCard.classList.contains('expanded')) {
        inquiryCard.classList.remove('expanded');
    } else {
        // Remove expanded class from all cards
        document.querySelectorAll('.inquiry-card').forEach(card => {
            card.classList.remove('expanded');
        });
        inquiryCard.classList.add('expanded');
    }
}

// Update the navigation titles
const originalSwitchSection = switchSection;
switchSection = function(sectionName) {
    originalSwitchSection(sectionName);
    
    // Load section-specific data
    if (sectionName === 'inquiries') {
        loadInquiries();
    }
};

// Update the dashboard initialization
const originalInitializeDashboard = initializeDashboard;
initializeDashboard = function() {
    originalInitializeDashboard();
    loadInquiries();
};

// Update the stats display
const originalUpdateStats = updateStats;
updateStats = function() {
    originalUpdateStats();
    
    const totalInquiriesEl = document.getElementById('total-inquiries');
    if (totalInquiriesEl) {
        totalInquiriesEl.textContent = stats.inquiries;
    }
};
