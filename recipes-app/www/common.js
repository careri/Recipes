// Common keyword functionality shared across pages

// Global variables for keyword management
let selectedKeywords = [];
let commonKeywords = [];

// Authentication functions
let authToken = null;

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('auth_token', token);
}

function getAuthToken() {
    if (!authToken) {
        authToken = localStorage.getItem('auth_token');
    }
    return authToken;
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('auth_token');
}

function isAuthenticated() {
    return !!getAuthToken();
}

// API call helper with authentication
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, options);
}

function getCachedRecipes() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { recipes: cachedRecipes } = JSON.parse(cached);
        return cachedRecipes;
    } catch (error) {
        console.error('Error reading cache:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

function setCachedRecipes(recipes) {
    try {
        const cacheData = {
            recipes
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error writing cache:', error);
    }
}

function clearRecipesCache() {
    localStorage.removeItem(CACHE_KEY);
}

function clearRecipesCache() {
    localStorage.removeItem(CACHE_KEY);
}

// Extract keywords from recipes and sort by usage frequency
function extractKeywordsFromRecipes(recipes) {
    console.log('extractKeywordsFromRecipes called with recipes:', recipes.length);
    const keywordCount = {};

    recipes.forEach(recipe => {
        if (recipe.attributes) {
            const keywords = recipe.attributes.split(', ').map(k => k.trim()).filter(k => k.length > 0);
            console.log('Recipe attributes:', recipe.attributes, '-> keywords:', keywords);
            keywords.forEach(keyword => {
                keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
            });
        }
    });

    console.log('keywordCount:', keywordCount);
    // Sort keywords by usage frequency (most used first)
    const result = Object.entries(keywordCount)
        .sort(([,a], [,b]) => b - a)
        .map(([keyword]) => keyword);
    console.log('sorted keywords:', result);
    return result;
}

// Initialize keyword toggle buttons
function initializeKeywords(keywords = null) {
    console.log('initializeKeywords called with keywords:', keywords);
    console.log('commonKeywords:', commonKeywords);
    
    if (keywords) {
        commonKeywords = keywords;
    }

    const container = document.getElementById('keywords-container');
    console.log('keywords-container found:', !!container);
    if (!container) return;

    container.innerHTML = '';

    commonKeywords.forEach(keyword => {
        const button = document.createElement('button');
        button.className = 'mdc-button mdc-button--outlined keyword-toggle';
        button.setAttribute('data-keyword', keyword);
        button.innerHTML = `<span class="mdc-button__label">${keyword}</span>`;
        button.addEventListener('click', toggleKeyword);
        container.appendChild(button);
    });

    updateKeywordButtons();
}

// Toggle keyword selection
function toggleKeyword(event) {
    const keyword = event.currentTarget.getAttribute('data-keyword');
    const index = selectedKeywords.indexOf(keyword);
    if (index > -1) {
        selectedKeywords.splice(index, 1);
    } else {
        selectedKeywords.push(keyword);
    }
    updateKeywordButtons();

    // Call page-specific filter function if it exists
    if (typeof filterAndRenderRecipes === 'function') {
        filterAndRenderRecipes();
    }
}

// Update keyword button visual states
function updateKeywordButtons() {
    document.querySelectorAll('.keyword-toggle').forEach(button => {
        const keyword = button.getAttribute('data-keyword');
        if (selectedKeywords.includes(keyword)) {
            button.classList.add('mdc-button--raised');
        } else {
            button.classList.remove('mdc-button--raised');
        }
    });
}

// Add new keyword (for add/edit pages)
function addNewKeyword() {
    const input = document.getElementById('new-keyword');
    if (!input) return;

    const keyword = input.value.trim();
    if (keyword && !selectedKeywords.includes(keyword)) {
        selectedKeywords.push(keyword);
        updateKeywordButtons();
        input.value = '';
    }
}