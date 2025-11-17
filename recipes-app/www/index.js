// API configuration - use localhost for development
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : '/api';

let recipes = [];
let sortedRecipes = []; // Cache sorted recipes
let searchTerm = ''; // Current search term

function filterAndRenderRecipes() {
    let filteredRecipes = recipes;

    // Filter by keywords
    if (selectedKeywords.length > 0) {
        filteredRecipes = recipes.filter(recipe => {
            if (!recipe.attributes) return false;
            const recipeKeywords = recipe.attributes.split(', ').map(k => k.trim());
            return selectedKeywords.every(selected => recipeKeywords.includes(selected));
        });
    }

    // Filter by search term
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filteredRecipes = filteredRecipes.filter(recipe => {
            // Search in title
            if (recipe.title && recipe.title.toLowerCase().includes(term)) return true;
            // Search in ingredients
            if (recipe.ingredients && recipe.ingredients.some(ing => 
                ing.name && ing.name.toLowerCase().includes(term)
            )) return true;
            // Search in steps
            if (recipe.steps && recipe.steps.some(step => 
                step.toLowerCase().includes(term)
            )) return true;
            // Search in attributes
            if (recipe.attributes && recipe.attributes.toLowerCase().includes(term)) return true;
            return false;
        });
    }

    // Sort filtered recipes
    sortedRecipes = [...filteredRecipes].sort((a, b) => a.title.localeCompare(b.title));

    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => renderRecipeList());
}

document.addEventListener('DOMContentLoaded', async function() {
    mdc.autoInit();
    // Initialize search text field
    const searchField = new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'));
    showLoadingState();
    
    // Check authentication first
    if (!isAuthenticated()) {
        showAuthSection();
        return;
    }
    
    showUserInfo();
    await loadRecipes();
    
    document.getElementById('add-recipe').addEventListener('click', () => window.location.href = 'add.html');
    
    // Add search input listener with debouncing
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = searchInput.value;
            filterAndRenderRecipes();
        }, 300);
    });
    
    // Sign out handler
    document.getElementById('sign-out').addEventListener('click', signOut);
});

async function loadRecipes() {
    try {
        const cachedRecipes = getCachedRecipes();
        let allRecipes = [];

        if (cachedRecipes && cachedRecipes.length > 0) {
            // Calculate max version from cached recipes
            const maxVersion = cachedRecipes.reduce((max, recipe) => 
                recipe.version > max ? recipe.version : max, '');

            // Fetch only recipes newer than maxVersion
            const response = await authenticatedFetch(`${API_BASE}/recipes?version=${encodeURIComponent(maxVersion)}`);
            const newRecipes = await response.json();

            // Merge new recipes with cached ones
            allRecipes = [...cachedRecipes, ...newRecipes];
        } else {
            // No cache - fetch all recipes
            const response = await authenticatedFetch(`${API_BASE}/recipes`);
            allRecipes = await response.json();
        }

        // Update cache with all recipes
        setCachedRecipes(allRecipes);
        recipes = allRecipes;

        // Extract keywords from recipes and initialize keyword buttons
        commonKeywords = extractKeywordsFromRecipes(recipes);
        initializeKeywords();

        filterAndRenderRecipes();
    } catch (error) {
        console.error('Error loading recipes:', error);
        hideLoadingState();
    }
}

function showLoadingState() {
    const list = document.getElementById('recipe-list');
    list.innerHTML = '<div class="loading-container"><div class="mdc-circular-progress" role="progressbar"><div class="mdc-circular-progress__determinate-container"><svg class="mdc-circular-progress__determinate-circle-graphic" viewBox="0 0 24 24"><circle class="mdc-circular-progress__determinate-track" cx="12" cy="12" r="8.75" stroke-width="2.5"/><circle class="mdc-circular-progress__determinate-circle" cx="12" cy="12" r="8.75" stroke-dasharray="54.978" stroke-dashoffset="54.978" stroke-width="2.5"/></svg></div></div><p>Loading recipes...</p></div>';
}

function hideLoadingState() {
    // Loading state will be replaced by renderRecipeList
}

function renderRecipeList() {
    const list = document.getElementById('recipe-list');
    const countDiv = document.getElementById('results-count');

    // Update results count
    const totalRecipes = recipes.length;
    const filteredCount = sortedRecipes.length;
    countDiv.textContent = `Showing ${filteredCount} of ${totalRecipes} recipes`;

    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();

    sortedRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'mdc-card mdc-card--outlined recipe-card';
        card.style.cursor = 'pointer';
        card.onclick = () => window.location.href = `recipe.html?id=${recipe.id}`;

        card.innerHTML = `
            <div style="position: relative; padding: 16px 16px 0 16px;">
                <h3 style="margin: 0; display: inline-block;">${recipe.title}</h3>
                <div style="position: absolute; top: 16px; right: 16px;">
                    <button class="mdc-icon-button material-icons" onclick="event.stopPropagation(); window.location.href='edit.html?id=${recipe.id}'" title="Edit" style="margin-left: 8px;">edit</button>
                    <button class="mdc-icon-button material-icons" onclick="event.stopPropagation(); deleteRecipe('${recipe.id}')" title="Delete">delete</button>
                </div>
            </div>
            <div class="mdc-card__content" style="padding: 8px 16px 16px 16px;">
                <p style="margin: 8px 0 0 0;">${recipe.attributes || 'None'}</p>
            </div>
        `;

        fragment.appendChild(card);
    });

    list.innerHTML = '';
    list.appendChild(fragment);
}

async function deleteRecipe(id) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        try {
            await authenticatedFetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE' });

            // Update cache by removing the deleted recipe
            recipes = recipes.filter(recipe => recipe.id !== id);
            setCachedRecipes(recipes);

            // Re-extract keywords and reinitialize buttons in case usage changed
            commonKeywords = extractKeywordsFromRecipes(recipes);
            initializeKeywords();

            // Re-filter and render recipes
            filterAndRenderRecipes();
        } catch (error) {
            console.error('Error deleting recipe:', error);
            // Fallback to full reload on error
            await loadRecipes();
        }
    }
}

// Authentication functions
function onSignIn(response) {
    if (response.credential) {
        setAuthToken(response.credential);
        hideAuthSection();
        showUserInfo();
        loadRecipes();
    }
}
window.onSignIn = onSignIn;

function signOut() {
    clearAuthToken();
    hideUserInfo();
    showAuthSection();
    // Clear recipes data
    recipes = [];
    sortedRecipes = [];
    renderRecipeList();
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.querySelector('main').style.display = 'none';

    // Add development login option when running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const devLoginDiv = document.getElementById('dev-login');
        if (!devLoginDiv) {
            const authSection = document.getElementById('auth-section');
            const devDiv = document.createElement('div');
            devDiv.id = 'dev-login';
            devDiv.innerHTML = `
                <div style="margin: 20px 0; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9;">
                    <h3 style="margin: 0 0 12px 0; color: #666;">Development Mode</h3>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
                        Running locally - OAuth not available. Use development login:
                    </p>
                    <button id="dev-login-btn" class="mdc-button mdc-button--raised" style="background: #4CAF50;">
                        <span class="mdc-button__label">Login as Developer</span>
                    </button>
                </div>
            `;
            authSection.appendChild(devDiv);

            document.getElementById('dev-login-btn').addEventListener('click', devLogin);
        }
    }
}

function hideAuthSection() {
    document.getElementById('auth-section').style.display = 'none';
}

function showUserInfo() {
    // Decode JWT to get user info (simplified)
    const token = getAuthToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            document.getElementById('user-email').textContent = `Signed in as: ${payload.email}`;
            document.getElementById('user-info').style.display = 'block';
            document.querySelector('main').style.display = 'block';
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
}

function devLogin() {
    // Create a mock JWT token for development
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        email: 'developer@localhost',
        name: 'Local Developer',
        sub: 'dev-user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('dev-signature'); // Mock signature
    const mockToken = `${header}.${payload}.${signature}`;

    setAuthToken(mockToken);
    hideAuthSection();
    showUserInfo();
    loadRecipes();
}