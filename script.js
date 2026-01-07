// ==========================================
// CONFIGURATION - IMPORTANT!
// ==========================================
// Replace with your Supabase configuration
const SUPABASE_URL = 'https://vnwhnmevbehgqcwteiyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZud2hubWV2YmVoZ3Fjd3RlaXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTA0MjIsImV4cCI6MjA4MzI4NjQyMn0.I6N8pkXpMoBRkJZr1wnNxQ10BRfG0WNoNJ4EMr7N6wo';


// Initialize Supabase with security
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

// Replace 'your.facebook.username' with your actual Facebook profile username or ID.
// Ensure your privacy settings allow messages from strangers.
let facebookUsername = "https://www.facebook.com/johnlawrence.cano.1"; 

document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        // Add a fallback background
        const container = document.getElementById('canvas-container');
        if (container) {
            container.style.background = 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)';
            container.style.backgroundSize = '50px 50px';
        }
    } else {
        initThreeJS();
        initCustomSectionThreeJS();
    }
    
    initProjectFilters();
    loadProjects();
    loadSettings();
});

// ==========================================
// THREE.JS FOR CUSTOM PROJECT SECTION
// ==========================================
function initCustomSectionThreeJS() {
    const container = document.getElementById('custom-canvas-container');
    if (!container) return;
    
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create 3D cubes
    const cubes = [];
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    
    for (let i = 0; i < 20; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Pure white for black & white theme
            wireframe: true,
            transparent: true,
            opacity: 0.8 // Increased opacity for better visibility
        });
        
        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        cube.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        cubes.push(cube);
        scene.add(cube);
    }

    camera.position.z = 5;

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        
        cubes.forEach((cube, index) => {
            cube.rotation.x += 0.001 + index * 0.0001;
            cube.rotation.y += 0.001 + index * 0.0001;
            
            // Mouse interaction
            cube.position.x += (mouseX * 0.5 - cube.position.x) * 0.01;
            cube.position.y += (mouseY * 0.5 - cube.position.y) * 0.01;
        });

        renderer.render(scene, camera);
    }
    
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}


// ==========================================
// 1. THREE.JS HERO ANIMATION
// ==========================================
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    if (!container) {
        console.error('Canvas container not found');
        return;
    }
    
    let width = container.clientWidth;
    let height = container.clientHeight;

    if (width === 0 || height === 0) {
        console.warn('Canvas container has no dimensions, using fallback');
        width = window.innerWidth;
        height = window.innerHeight;
    }

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // Create Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 150; // Number of particles
    
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        // Generate random positions between -5 and 5
        posArray[i] = (Math.random() - 0.5) * 10; 
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Materials (White particles and lines)
    const material = new THREE.PointsMaterial({
        size: 0.08, // Increased size for better visibility
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // Adding subtle lines connecting particles for a network look
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.3 // Increased opacity for better visibility
    });
    const lineMesh = new THREE.LineLoop(particlesGeometry, lineMaterial);
    scene.add(lineMesh);

    camera.position.z = 3;

    // Mouse interaction variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = width / 2;
    const windowHalfY = height / 2;

    document.addEventListener('mousemove', onDocumentMouseMove);

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
     
        // Smooth mouse movement tracking
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        particlesMesh.rotation.y += 0.001; // Constant slow rotation
        particlesMesh.rotation.x += (targetY - particlesMesh.rotation.x) * 0.05;
        particlesMesh.rotation.y += (targetX - particlesMesh.rotation.y) * 0.05;
        
        lineMesh.rotation.copy(particlesMesh.rotation);

        renderer.render(scene, camera);
    }
    
    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        width = container.clientWidth || window.innerWidth;
        height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    
    console.log('Three.js initialized successfully with', particlesCount, 'particles');
}


// ==========================================
// 2. PROJECT FILTERING
// ==========================================
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            filterProjects(filterValue);
        });
    });
}

function filterProjects(filterValue) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        if (filterValue === 'all') {
            card.style.display = 'block';
        } else if (card.getAttribute('data-category') === filterValue) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}


// ==========================================
// 3. FIREBASE INTEGRATION
// ==========================================
async function loadProjects() {
    const projectsContainer = document.getElementById('projects-container');
    
    try {
        // Try to use the RPC function first, fallback to direct query
        let result = await supabaseClient.rpc('get_public_projects', { limit_count: 20 });
        
        // If RPC function doesn't exist, fallback to direct query
        if (result.error && result.error.message.includes('function')) {
            console.log('RPC function not found, using direct query');
            result = await supabaseClient
                .from('projects')
                .select('*')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
                .limit(20);
        }
        
        if (result.error) {
            throw result.error;
        }

        const projects = result.data || [];
        
        if (projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No projects available at the moment.</p>
                    <small>Make sure you've set up your Supabase database and added some projects.</small>
                </div>
            `;
            return;
        }

        // Sanitize project data
        const sanitizedProjects = projects.map(project => {
            if (window.securityManager) {
                project.title = window.securityManager.sanitizeInput(project.title);
                project.description = window.securityManager.sanitizeInput(project.description);
                project.technologies = window.securityManager.sanitizeInput(project.technologies || '');
                
                // Validate image URL
                if (!window.securityManager.validateURL(project.image_url)) {
                    project.image_url = 'https://via.placeholder.com/600x400/222222/FFFFFF?text=Invalid+Image';
                }
            }
            return project;
        });

        displayProjects(sanitizedProjects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        if (window.securityManager) {
            window.securityManager.logSecurityEvent('project_load_error', { error: error.message });
        }
        
        projectsContainer.innerHTML = `
            <div class="error-state">
                <p>Error loading projects. Please check your Supabase configuration.</p>
                <small>Error: ${error.message}</small>
            </div>
        `;
    }
}

function displayProjects(projects) {
    const projectsContainer = document.getElementById('projects-container');
    
    projectsContainer.innerHTML = projects.map((project, index) => {
        // Additional security: escape HTML in project data
        const safeTitle = escapeHtml(project.title);
        const safeDescription = escapeHtml(project.description);
        const safeTechnologies = escapeHtml(project.technologies || '');
        
        return `
            <div class="project-card fade-in" data-category="${project.category}" data-project-id="${project.id}" style="animation-delay: ${index * 0.1}s">
                <div class="card-image">
                    <img src="${project.image_url}" alt="${safeTitle}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400/222222/FFFFFF?text=Image+Not+Found'">
                    <span class="badge">${project.category === 'website' ? 'Website' : 'Mobile'}</span>
                </div>
                <div class="card-info">
                    <h3>${safeTitle}</h3>
                    ${project.status !== 'available' ? `<span class="status-badge status-${project.status}">${project.status}</span>` : ''}
                    <p class="description">${safeDescription}</p>
                    ${safeTechnologies ? `<p class="technologies">Built with: ${safeTechnologies}</p>` : ''}
                    <div class="card-actions">
                        <a href="#" class="btn btn-secondary contact-btn" data-project="${safeTitle}" data-project-id="${project.id}">
                            <i class="fas fa-envelope"></i> Inquire Now
                        </a>
                        <button class="btn btn-secondary pdf-btn" onclick="generateProjectPDF('${project.id}', ${JSON.stringify(project).replace(/"/g, '&quot;')})">
                            <i class="fas fa-file-pdf"></i> Documentation
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Initialize contact buttons after projects are loaded
    initContactButtons();
    
    // Track page view securely
    trackPageView();
}

// HTML escape function for additional security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function trackProjectView(projectId) {
    try {
        const { error } = await supabaseClient.rpc('increment_project_views', { 
            project_uuid: projectId 
        });
        
        if (error) {
            console.error('Error tracking project view:', error);
        }
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

async function trackPageView() {
    try {
        const { error } = await supabaseClient.rpc('increment_page_views');
        
        if (error) {
            console.error('Error tracking page view:', error);
        }
    } catch (error) {
        console.error('Error tracking page view:', error);
    }
}

async function loadSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('key, value')
            .eq('key', 'facebook_username')
            .single();
            
        if (error) {
            console.error('Error loading settings:', error);
            return;
        }
        
        if (data && data.value) {
            facebookUsername = data.value;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}


// ==========================================
// ==========================================
// 4. CONTACT FORM FUNCTIONALITY
// ==========================================
function initContactButtons() {
    const contactBtns = document.querySelectorAll('.contact-btn');

    contactBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectName = btn.getAttribute('data-project');
            const projectId = btn.getAttribute('data-project-id');
            showContactModal(projectName, projectId);
        });
    });
}

function showContactModal(projectName, projectId) {
    // Create modal HTML
    const modalHTML = `
        <div id="contact-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Inquire About: ${escapeHtml(projectName)}</h3>
                    <button class="modal-close" onclick="closeContactModal()">&times;</button>
                </div>
                <form id="contact-form" class="contact-form">
                    <div class="form-group">
                        <label for="contact-name">Your Name *</label>
                        <input type="text" id="contact-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-email">Your Email *</label>
                        <input type="email" id="contact-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-phone">Phone Number (Optional)</label>
                        <input type="tel" id="contact-phone" name="phone">
                    </div>
                    <div class="form-group">
                        <label for="contact-message">Message *</label>
                        <textarea id="contact-message" name="message" rows="5" required placeholder="Tell us about your requirements, timeline, and any specific questions you have about this project..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="contact-budget">Budget Range (Optional)</label>
                        <select id="contact-budget" name="budget">
                            <option value="">Select budget range</option>
                            <option value="under-500">Under $500</option>
                            <option value="500-1000">$500 - $1,000</option>
                            <option value="1000-2500">$1,000 - $2,500</option>
                            <option value="2500-5000">$2,500 - $5,000</option>
                            <option value="5000-plus">$5,000+</option>
                            <option value="negotiable">Open to negotiation</option>
                        </select>
                    </div>
                    <input type="hidden" id="contact-project-id" name="project_id" value="${projectId}">
                    <input type="hidden" id="contact-project-name" name="project_name" value="${escapeHtml(projectName)}">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeContactModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Send Inquiry</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listener for form submission
    document.getElementById('contact-form').addEventListener('submit', handleContactSubmission);
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('contact-name').focus();
    }, 100);
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.remove();
    }
}

async function handleContactSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const inquiryData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        message: formData.get('message'),
        budget: formData.get('budget') || null,
        project_id: formData.get('project_id'),
        project_title: formData.get('project_name'),
        status: 'new'
    };

    // Sanitize input data
    if (window.securityManager) {
        inquiryData.name = window.securityManager.sanitizeInput(inquiryData.name);
        inquiryData.email = window.securityManager.sanitizeInput(inquiryData.email);
        inquiryData.message = window.securityManager.sanitizeInput(inquiryData.message);
        inquiryData.project_title = window.securityManager.sanitizeInput(inquiryData.project_title);
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Submit to Supabase
        const { error } = await supabaseClient
            .from('inquiries')
            .insert([inquiryData]);

        if (error) {
            throw error;
        }

        // Track project view
        if (inquiryData.project_id) {
            trackProjectView(inquiryData.project_id);
        }

        // Show success message
        showNotification('Your inquiry has been sent successfully! We\'ll get back to you soon.', 'success');
        
        // Close modal
        closeContactModal();

    } catch (error) {
        console.error('Error submitting inquiry:', error);
        
        // Show error message
        showNotification('Sorry, there was an error sending your inquiry. Please try again.', 'error');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Send Inquiry';
        submitBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}


// ==========================================
// 5. CUSTOM PROJECT REQUEST
// ==========================================
function showCustomProjectModal() {
    const modalHTML = `
        <div id="contact-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-rocket"></i> Request Custom Development</h3>
                    <button class="modal-close" onclick="closeContactModal()">&times;</button>
                </div>
                <form id="contact-form" class="contact-form">
                    <div class="form-group">
                        <label for="contact-name">Your Name *</label>
                        <input type="text" id="contact-name" name="name" required placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label for="contact-email">Your Email *</label>
                        <input type="email" id="contact-email" name="email" required placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label for="contact-phone">Phone Number</label>
                        <input type="tel" id="contact-phone" name="phone" placeholder="+1 (555) 123-4567">
                    </div>
                    <div class="form-group">
                        <label for="project-type">Project Type *</label>
                        <select id="project-type" name="project_type" required>
                            <option value="">Select project type</option>
                            <option value="web-app">Web Application</option>
                            <option value="mobile-app">Mobile Application</option>
                            <option value="ecommerce">E-commerce Platform</option>
                            <option value="api">API Development</option>
                            <option value="database">Database Design</option>
                            <option value="ui-ux">UI/UX Design</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="project-title">Project Title *</label>
                        <input type="text" id="project-title" name="project_title" required placeholder="My Awesome Project">
                    </div>
                    <div class="form-group">
                        <label for="contact-message">Project Description *</label>
                        <textarea id="contact-message" name="message" rows="6" required placeholder="Describe your project requirements, features, timeline, and any specific technologies you prefer..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="contact-budget">Budget Range *</label>
                        <select id="contact-budget" name="budget" required>
                            <option value="">Select budget range</option>
                            <option value="under-1000">Under $1,000</option>
                            <option value="1000-2500">$1,000 - $2,500</option>
                            <option value="2500-5000">$2,500 - $5,000</option>
                            <option value="5000-10000">$5,000 - $10,000</option>
                            <option value="10000-plus">$10,000+</option>
                            <option value="negotiable">Open to negotiation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="timeline">Expected Timeline</label>
                        <select id="timeline" name="timeline">
                            <option value="">Select timeline</option>
                            <option value="urgent">Urgent (1-2 weeks)</option>
                            <option value="short">Short term (1 month)</option>
                            <option value="medium">Medium term (2-3 months)</option>
                            <option value="long">Long term (3+ months)</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>
                    <input type="hidden" name="project_id" value="custom">
                    <input type="hidden" name="project_title_display" value="Custom Development Request">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeContactModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Send Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('contact-form').addEventListener('submit', handleCustomProjectSubmission);
    
    setTimeout(() => {
        document.getElementById('contact-name').focus();
    }, 100);
}

async function handleCustomProjectSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const inquiryData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        message: formData.get('message'),
        budget: formData.get('budget'),
        project_title: formData.get('project_title'),
        project_type: formData.get('project_type'),
        timeline: formData.get('timeline') || null,
        project_id: null,
        status: 'new'
    };

    if (window.securityManager) {
        inquiryData.name = window.securityManager.sanitizeInput(inquiryData.name);
        inquiryData.email = window.securityManager.sanitizeInput(inquiryData.email);
        inquiryData.message = window.securityManager.sanitizeInput(inquiryData.message);
        inquiryData.project_title = window.securityManager.sanitizeInput(inquiryData.project_title);
    }

    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const { error } = await supabaseClient
            .from('inquiries')
            .insert([inquiryData]);

        if (error) throw error;

        showNotification('Your custom project request has been sent! We\'ll contact you within 24 hours.', 'success');
        closeContactModal();

    } catch (error) {
        console.error('Error submitting request:', error);
        showNotification('Sorry, there was an error. Please try again or email us directly.', 'error');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
        submitBtn.disabled = false;
    }
}

// ==========================================
// 6. PDF GENERATION FOR PROJECT DOCUMENTATION
// ==========================================
async function generateProjectPDF(projectId, projectData) {
    try {
        // Create PDF content with enhanced styling
        const featuresHTML = projectData.features && projectData.features.length > 0 
            ? `<div class="section">
                <div class="label">Key Features</div>
                <ul class="features-list">
                    ${projectData.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>`
            : '';
            
        const pdfImagesHTML = projectData.pdf_images && projectData.pdf_images.length > 0
            ? projectData.pdf_images.map((url, index) => `
                <div class="section">
                    <div class="label">Screenshot ${index + 1}</div>
                    <img src="${url}" alt="Screenshot ${index + 1}" class="screenshot" onerror="this.style.display='none'">
                </div>
            `).join('')
            : `<div class="section">
                <div class="label">Project Screenshot</div>
                <img src="${projectData.image_url}" alt="${projectData.title}" class="screenshot" onerror="this.style.display='none'">
            </div>`;
            
        const pdfContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${projectData.title} - Documentation</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 60px 40px;
                        color: #1a1a1a;
                        background: #ffffff;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 50px;
                        padding-bottom: 30px;
                        border-bottom: 4px solid #6366f1;
                    }
                    h1 {
                        color: #1a1a1a;
                        font-size: 2.5rem;
                        margin-bottom: 15px;
                        font-weight: 700;
                    }
                    .subtitle {
                        color: #6366f1;
                        font-size: 1.2rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                    }
                    .section {
                        margin: 35px 0;
                        page-break-inside: avoid;
                    }
                    .label {
                        font-weight: 700;
                        color: #6366f1;
                        text-transform: uppercase;
                        font-size: 0.9rem;
                        margin-bottom: 12px;
                        letter-spacing: 1.5px;
                        border-left: 4px solid #6366f1;
                        padding-left: 12px;
                    }
                    .value {
                        font-size: 1.05rem;
                        line-height: 1.8;
                        color: #4a4a4a;
                        margin-bottom: 20px;
                        padding-left: 16px;
                    }
                    .screenshot {
                        width: 100%;
                        max-width: 700px;
                        margin: 20px auto;
                        display: block;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .features-list {
                        list-style: none;
                        padding-left: 16px;
                    }
                    .features-list li {
                        padding: 10px 0;
                        padding-left: 30px;
                        position: relative;
                        color: #4a4a4a;
                        font-size: 1.05rem;
                    }
                    .features-list li::before {
                        content: '✓';
                        position: absolute;
                        left: 0;
                        color: #10b981;
                        font-weight: bold;
                        font-size: 1.2rem;
                    }
                    .tech-badge {
                        display: inline-block;
                        padding: 6px 14px;
                        background: #f3f4f6;
                        border: 1px solid #e5e7eb;
                        border-radius: 20px;
                        margin: 5px 5px 5px 0;
                        font-size: 0.9rem;
                        color: #6366f1;
                        font-weight: 600;
                    }
                    .links {
                        margin: 25px 0;
                        padding: 20px;
                        background: #f9fafb;
                        border-radius: 8px;
                        border-left: 4px solid #6366f1;
                    }
                    .links a {
                        color: #6366f1;
                        text-decoration: none;
                        font-weight: 600;
                        display: block;
                        margin: 8px 0;
                    }
                    .footer {
                        margin-top: 80px;
                        text-align: center;
                        font-size: 0.9rem;
                        color: #9ca3af;
                        border-top: 2px solid #e5e7eb;
                        padding-top: 30px;
                    }
                    .footer strong {
                        color: #6366f1;
                        display: block;
                        margin-bottom: 10px;
                        font-size: 1.1rem;
                    }
                    @media print {
                        body { padding: 40px 20px; }
                        .screenshot { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${projectData.title}</h1>
                    <p class="subtitle">Project Documentation</p>
                </div>
                
                <div class="section">
                    <div class="label">Category</div>
                    <div class="value">${projectData.category === 'website' ? 'Website / Web Application' : 'Mobile Application'}</div>
                </div>
                
                <div class="section">
                    <div class="label">Description</div>
                    <div class="value">${projectData.description}</div>
                </div>
                
                ${projectData.technologies ? `
                <div class="section">
                    <div class="label">Technologies & Stack</div>
                    <div class="value">
                        ${projectData.technologies.split(',').map(tech => 
                            `<span class="tech-badge">${tech.trim()}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${featuresHTML}
                
                ${projectData.pdf_content ? `
                <div class="section">
                    <div class="label">Additional Information</div>
                    <div class="value">${projectData.pdf_content}</div>
                </div>
                ` : ''}
                
                ${pdfImagesHTML}
                
                ${projectData.demo_url || projectData.github_url ? `
                <div class="links">
                    <div class="label">Project Links</div>
                    ${projectData.demo_url ? `<a href="${projectData.demo_url}" target="_blank">🔗 Live Demo: ${projectData.demo_url}</a>` : ''}
                    ${projectData.github_url ? `<a href="${projectData.github_url}" target="_blank">💻 GitHub Repository: ${projectData.github_url}</a>` : ''}
                </div>
                ` : ''}
                
                <div class="section">
                    <div class="label">Project Status</div>
                    <div class="value" style="color: ${projectData.status === 'available' ? '#10b981' : '#ef4444'}; font-weight: 600;">
                        ${projectData.status.toUpperCase()}
                    </div>
                </div>
                
                <div class="footer">
                    <strong>PROJECT HUB</strong>
                    <p>Premium Digital Projects</p>
                    <p>Generated on ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                    <p style="margin-top: 15px;">For inquiries and custom development, visit our website</p>
                </div>
            </body>
            </html>
        `;

        // Open print dialog with the content
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
        
        showNotification('PDF documentation is ready! Use your browser\'s print dialog to save as PDF.', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF documentation', 'error');
    }
}

// Add PDF download button to project cards
function addPDFDownloadButton(projectCard, projectData) {
    const actionsDiv = projectCard.querySelector('.card-info');
    const pdfButton = document.createElement('button');
    pdfButton.className = 'btn btn-secondary';
    pdfButton.style.marginTop = '10px';
    pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Download Documentation';
    pdfButton.onclick = (e) => {
        e.preventDefault();
        generateProjectPDF(projectData.id, projectData);
    };
    actionsDiv.appendChild(pdfButton);
}
