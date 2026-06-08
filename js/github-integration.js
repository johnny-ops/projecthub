document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubRepos();
});

async function fetchGitHubRepos() {
    const username = 'johnny-ops';
    const scrollContainer = document.getElementById('github-scroll');
    
    if (!scrollContainer) return;

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();
        
        scrollContainer.innerHTML = ''; // Clear loading text
        
        if (repos.length === 0) {
            scrollContainer.innerHTML = '<div style="padding: 20px; font-size: 1.5rem; text-align: center; width: 100%;">No repositories found.</div>';
            return;
        }

        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            // Generate a random icon based on repo language or name
            let iconClass = 'fa-code';
            if (repo.language) {
                const lang = repo.language.toLowerCase();
                if (lang === 'javascript' || lang === 'typescript') iconClass = 'fab fa-js';
                else if (lang === 'java') iconClass = 'fab fa-java';
                else if (lang === 'python') iconClass = 'fab fa-python';
                else if (lang === 'html' || lang === 'css') iconClass = 'fab fa-html5';
                else if (lang === 'php') iconClass = 'fab fa-php';
                else iconClass = 'fas fa-laptop-code';
            } else {
                iconClass = 'fas fa-laptop-code';
            }

            card.innerHTML = `
                <div class="card-img"><i class="${iconClass}"></i></div>
                <div class="card-content">
                    <h3 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${repo.name}">${repo.name}</h3>
                    <p style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${repo.description || 'No description provided.'}</p>
                    <div class="card-footer">
                        <span>${repo.language || 'Code'}</span>
                        <a href="${repo.html_url}" target="_blank" class="github-link"><i class="fab fa-github"></i></a>
                    </div>
                </div>
            `;
            
            scrollContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        scrollContainer.innerHTML = '<div style="padding: 20px; font-size: 1.5rem; text-align: center; width: 100%; color: #ff5555;">Failed to load repositories.</div>';
    }
}
