        const API_BASE = 'http://localhost:3001';
document.addEventListener('DOMContentLoaded', function() {
    mdc.autoInit();
    loadRecipe();
});

async function loadRecipe() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/recipes/${id}`);
        const recipe = await response.json();

        document.getElementById('recipe-detail').innerHTML = `
            <div class="mdc-card mdc-card--outlined">
                <div class="mdc-card__content">
                    <h1>${recipe.title}</h1>
                    ${recipe.notes ? `<p><strong>Notes:</strong> ${recipe.notes}</p>` : ''}
                    <p><strong>Servings:</strong> ${recipe.servings.amount} ${recipe.servings.unit}</p>
                    <p><strong>Keywords:</strong> ${recipe.attributes || 'None'}</p>
                    <h3>Ingredients</h3>
                    <ul>${recipe.ingredients.map(ing => `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`).join('')}</ul>
                    <h3>Steps</h3>
                    <ol>${recipe.steps.map(step => `<li>${step}</li>`).join('')}</ol>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading recipe:', error);
        window.location.href = 'index.html';
    }
}

function editRecipe() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    window.location.href = `edit.html?id=${id}`;
}