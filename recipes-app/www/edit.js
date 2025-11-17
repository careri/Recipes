// API configuration - use localhost for development
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : '/api';

let allIngredients = [];
let titleField, notesField; // Store MDC text field references
let ingredientsLoaded = false; // Track if ingredients have been loaded

document.addEventListener('DOMContentLoaded', async function() {
    mdc.autoInit();

    // Store references to MDC text field instances
    titleField = mdc.textField.MDCTextField.attachTo(document.querySelector('#recipe-title').parentElement);
    notesField = mdc.textField.MDCTextField.attachTo(document.querySelector('#recipe-notes').parentElement);

    // Initialize ingredients datalist
    initializeIngredientsDatalist();

    // Load ingredients in background (don't await to avoid blocking)
    await loadIngredients();

    initializeStepsTable();
    initializeIngredientsTable();

    // Load recipe data
    loadRecipe();

    document.getElementById('save-recipe').addEventListener('click', saveRecipe);
    document.getElementById('cancel-recipe').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('add-keyword').addEventListener('click', addNewKeyword);
    document.getElementById('new-keyword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewKeyword();
        }
    });
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

        // Populate form fields using stored MDC text field references
        titleField.value = recipe.title;
        notesField.value = recipe.notes || '';

        // Populate keywords
        selectedKeywords = recipe.attributes ? recipe.attributes.split(', ').map(k => k.trim()).filter(k => k.length > 0) : [];
        updateKeywordButtons();

        // Populate steps
        const stepsContainer = document.getElementById('steps-container');
        stepsContainer.innerHTML = '';
        recipe.steps.forEach(step => addStepRow(step));
        addStepRow(); // Add empty row

        // Populate ingredients container
        const ingredientsContainer = document.getElementById('ingredients-container');
        ingredientsContainer.innerHTML = '';
        recipe.ingredients.forEach(ing => addIngredientRow(ing));
        addIngredientRow(); // Add empty row

    } catch (error) {
        console.error('Error loading recipe:', error);
        window.location.href = 'index.html';
    }
}

async function loadIngredients() {
    if (ingredientsLoaded) return; // Already loaded

    try {
        // Try to load from cache first
        const cachedRecipes = getCachedRecipes();
        let recipes;

        if (cachedRecipes) {
            recipes = cachedRecipes;
        } else {
            // Cache miss - fetch from API
            const response = await fetch(`${API_BASE}/recipes`);
            recipes = await response.json();
        }

        // Extract unique ingredients from all recipes
        const ingredientSet = new Set();
        recipes.forEach(recipe => {
            if (recipe.ingredients) {
                recipe.ingredients.forEach(ing => {
                    if (ing.name && ing.name.trim()) {
                        ingredientSet.add(ing.name.trim());
                    }
                });
            }
        });
        allIngredients = Array.from(ingredientSet).sort();
        ingredientsLoaded = true;

        // Update existing datalist if it exists
        updateIngredientsDatalist();

        // Extract keywords from recipes and initialize keyword buttons
        commonKeywords = extractKeywordsFromRecipes(recipes);
        initializeKeywords();
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

function updateIngredientsDatalist() {
    let datalist = document.getElementById('ingredients-list');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'ingredients-list';
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = allIngredients.map(ing => `<option value="${ing}">`).join('');
}

// Initialize empty datalist
function initializeIngredientsDatalist() {
    if (!document.getElementById('ingredients-list')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'ingredients-list';
        document.body.appendChild(datalist);
    }
}

function initializeStepsTable() {
    const container = document.getElementById('steps-container');
    container.innerHTML = '';
    addStepRow(); // Add one empty row
}

function addStepRow(stepText = '') {
    const container = document.getElementById('steps-container');
    const stepDiv = document.createElement('div');
    stepDiv.style.display = 'flex';
    stepDiv.style.alignItems = 'center';
    stepDiv.style.gap = '8px';

    stepDiv.innerHTML = `
        <div class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea" style="flex: 1;">
            <textarea class="mdc-text-field__input step-input" rows="2" style="resize: vertical; min-height: 56px;" placeholder="Enter step">${stepText}</textarea>
            <div class="mdc-notched-outline">
                <div class="mdc-notched-outline__leading"></div>
                <div class="mdc-notched-outline__notch">
                    <label class="mdc-floating-label">Step</label>
                </div>
                <div class="mdc-notched-outline__trailing"></div>
            </div>
        </div>
        <button class="mdc-icon-button material-icons remove-step" title="Remove step">delete</button>
    `;

    container.appendChild(stepDiv);

    // Attach MDC and event listeners
    const textField = stepDiv.querySelector('.mdc-text-field');
    mdc.textField.MDCTextField.attachTo(textField);

    stepDiv.querySelector('.remove-step').addEventListener('click', function() {
        stepDiv.remove();
        ensureEmptyStepRow();
    });

    stepDiv.querySelector('.step-input').addEventListener('input', ensureEmptyStepRow);
}

function ensureEmptyStepRow() {
    const container = document.getElementById('steps-container');
    const steps = container.querySelectorAll('div');
    const lastStep = steps[steps.length - 1];
    const lastInput = lastStep ? lastStep.querySelector('.step-input') : null;

    if (!lastStep || (lastInput && lastInput.value.trim())) {
        addStepRow();
    }
}

function initializeIngredientsTable() {
    const container = document.getElementById('ingredients-container');
    container.innerHTML = '';
    addIngredientRow(); // Add one empty row
}

function addIngredientRow(ingredient = {}) {
    const container = document.getElementById('ingredients-container');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.style.display = 'flex';
    ingredientDiv.style.alignItems = 'center';
    ingredientDiv.style.gap = '8px';

    ingredientDiv.innerHTML = `
        <div class="mdc-text-field mdc-text-field--outlined" style="width: 80px;">
            <input type="text" class="mdc-text-field__input ingredient-amount" value="${ingredient.amount || ''}" placeholder="Amt">
            <div class="mdc-notched-outline">
                <div class="mdc-notched-outline__leading"></div>
                <div class="mdc-notched-outline__notch">
                    <label class="mdc-floating-label">Amount</label>
                </div>
                <div class="mdc-notched-outline__trailing"></div>
            </div>
        </div>
        <div class="mdc-text-field mdc-text-field--outlined" style="width: 80px;">
            <input type="text" class="mdc-text-field__input ingredient-unit" value="${ingredient.unit || ''}" placeholder="Unit">
            <div class="mdc-notched-outline">
                <div class="mdc-notched-outline__leading"></div>
                <div class="mdc-notched-outline__notch">
                    <label class="mdc-floating-label">Unit</label>
                </div>
                <div class="mdc-notched-outline__trailing"></div>
            </div>
        </div>
        <div class="mdc-text-field mdc-text-field--outlined" style="flex: 1;">
            <input type="text" class="mdc-text-field__input ingredient-name" value="${ingredient.name || ''}" placeholder="Ingredient name" list="ingredients-list">
            <div class="mdc-notched-outline">
                <div class="mdc-notched-outline__leading"></div>
                <div class="mdc-notched-outline__notch">
                    <label class="mdc-floating-label">Name</label>
                </div>
                <div class="mdc-notched-outline__trailing"></div>
            </div>
        </div>
        <button class="mdc-icon-button material-icons remove-ingredient" title="Remove ingredient">delete</button>
    `;

    container.appendChild(ingredientDiv);

    // Attach MDC and event listeners
    ingredientDiv.querySelectorAll('.mdc-text-field').forEach(tf => {
        mdc.textField.MDCTextField.attachTo(tf);
    });

    ingredientDiv.querySelector('.remove-ingredient').addEventListener('click', function() {
        ingredientDiv.remove();
        ensureEmptyIngredientRow();
    });

    ingredientDiv.querySelector('.ingredient-name').addEventListener('input', ensureEmptyIngredientRow);
}

function ensureEmptyIngredientRow() {
    const container = document.getElementById('ingredients-container');
    const ingredients = container.querySelectorAll('div');
    const lastIngredient = ingredients[ingredients.length - 1];
    const lastInput = lastIngredient ? lastIngredient.querySelector('.ingredient-name') : null;

    if (!lastIngredient || (lastInput && lastInput.value.trim())) {
        addIngredientRow();
    }
}

async function saveRecipe() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const title = document.getElementById('recipe-title').value.trim();
    const notes = document.getElementById('recipe-notes').value.trim();

    // Collect steps from container, filter out empty ones
    const steps = Array.from(document.querySelectorAll('#steps-container .step-input'))
        .map(input => input.value.trim())
        .filter(step => step.length > 0);

    // Collect ingredients from container, filter out empty ones
    const ingredients = Array.from(document.querySelectorAll('#ingredients-container > div'))
        .map(div => ({
            amount: div.querySelector('.ingredient-amount').value.trim(),
            unit: div.querySelector('.ingredient-unit').value.trim(),
            name: div.querySelector('.ingredient-name').value.trim()
        }))
        .filter(ing => ing.name.length > 0); // Only require name to be non-empty

    // Filter out empty keywords
    const keywords = selectedKeywords.filter(k => k.trim().length > 0);

    if (!title) {
        alert('Please enter a title');
        return;
    }

    if (steps.length === 0) {
        alert('Please add at least one step');
        return;
    }

    if (ingredients.length === 0) {
        alert('Please add at least one ingredient');
        return;
    }

    const recipe = {
        title,
        steps,
        ingredients,
        servings: { amount: '4', unit: 'st' }, // Default, can be made editable later
        attributes: keywords.join(', '), // Store keywords in attributes field
        notes: notes || undefined
    };

    try {
        const response = await fetch(`${API_BASE}/recipes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        });
        if (response.ok) {
            // Clear cache since data has changed
            clearRecipesCache();
            window.location.href = 'index.html';
        } else {
            alert('Error saving recipe');
        }
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Error saving recipe');
    }
}