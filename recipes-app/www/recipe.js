// API configuration - use localhost for development
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : '/api';

document.addEventListener('DOMContentLoaded', function() {
    loadRecipe();
});

async function loadRecipe() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('recipe-detail').innerHTML = '<p class="mdc-typography--body1">No recipe ID provided.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/recipes/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const recipe = await response.json();
        
        const element = document.getElementById('recipe-detail');
        if (!element) {
            console.error('recipe-detail element not found');
            return;
        }
        
        // Render the full recipe
        element.innerHTML = `
            <div class="mdc-card">
                <div class="mdc-card__content">
                    <h1 class="mdc-typography--headline5">${recipe.title || 'Untitled Recipe'}</h1>
                    
                    ${recipe.description ? `<p class="mdc-typography--body1">${recipe.description}</p>` : ''}
                    
                    ${recipe.attributes ? `<p class="mdc-typography--body2"><strong>Tags:</strong> ${recipe.attributes}</p>` : ''}
                    
                    ${recipe.ingredients && Array.isArray(recipe.ingredients) ? `
                        <h2 class="mdc-typography--headline6">Ingredients</h2>
                        <ul class="mdc-list">
                            ${recipe.ingredients.map(ingredient => {
                                if (typeof ingredient === 'string') {
                                    return `<li class="mdc-list-item">${ingredient}</li>`;
                                } else if (ingredient.name) {
                                    const amount = ingredient.amount ? ingredient.amount : '';
                                    const unit = ingredient.unit ? ingredient.unit : '';
                                    const name = ingredient.name;
                                    return `<li class="mdc-list-item">${amount} ${unit} ${name}</li>`;
                                }
                                return '';
                            }).join('')}
                        </ul>
                    ` : ''}
                    
                    ${recipe.steps && Array.isArray(recipe.steps) ? `
                        <h2 class="mdc-typography--headline6">Instructions</h2>
                        <ol class="mdc-list">
                            ${recipe.steps.map(step => 
                                `<li class="mdc-list-item">${step}</li>`
                            ).join('')}
                        </ol>
                    ` : recipe.instructions ? `
                        <h2 class="mdc-typography--headline6">Instructions</h2>
                        <div class="mdc-typography--body1">${recipe.instructions.replace(/\n/g, '<br>')}</div>
                    ` : ''}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        document.getElementById('recipe-detail').innerHTML = `
            <div class="mdc-card">
                <div class="mdc-card__content">
                    <h1 class="mdc-typography--headline5">Error Loading Recipe</h1>
                    <p class="mdc-typography--body1">Failed to load recipe: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

function editRecipe() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    window.location.href = `edit.html?id=${id}`;
}