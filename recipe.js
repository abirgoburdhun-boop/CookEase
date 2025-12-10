// recipe.js - Recipe detail page functionality (NO PHP VERSION)

// Get URL parameter
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Fetch recipe by title (loads from JSON file)
async function fetchRecipeByTitle(title) {
  try {
    const decodedTitle = decodeURIComponent(title);
    console.log('Looking for recipe:', decodedTitle);
    
    // First, try to load from localStorage cache
    const cached = localStorage.getItem('cachedRecipes');
    if (cached) {
      try {
        const recipes = JSON.parse(cached);
        console.log('Cached recipes found:', recipes.length);
        const recipe = recipes.find(r => r.title === decodedTitle);
        if (recipe) {
          console.log('Found recipe in cache:', recipe.title);
          return recipe;
        }
      } catch (e) {
        console.log('Cache parse error:', e);
      }
    }
    
    // If not in cache, load from recipe.json
    console.log('Loading recipe from JSON file...');
    const response = await fetch('recipe.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load recipe data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Loaded JSON data:', data);
    
    // Handle different JSON structures
    let recipes = [];
    if (Array.isArray(data)) {
      recipes = data; // Direct array
    } else if (data.food_recipes) {
      recipes = data.food_recipes; // Nested array
    } else if (data.recipes) {
      recipes = data.recipes; // Alternative key
    }
    
    console.log('Available recipes:', recipes.length);
    console.log('Recipe titles:', recipes.map(r => r.title));
    
    // Find the specific recipe (case-insensitive)
    const recipe = recipes.find(r => {
      if (!r || !r.title) return false;
      return r.title.trim().toLowerCase() === decodedTitle.trim().toLowerCase();
    });
    
    if (!recipe) {
      // Try partial match
      const partialMatch = recipes.find(r => 
        r.title && r.title.toLowerCase().includes(decodedTitle.toLowerCase())
      );
      
      if (partialMatch) {
        console.log('Found partial match:', partialMatch.title);
        return partialMatch;
      }
      
      throw new Error(`Recipe "${decodedTitle}" not found. Available recipes: ${recipes.map(r => r.title).join(', ')}`);
    }
    
    // Normalize keys (handle both formats)
    const normalizedRecipe = { ...recipe };
    if (recipe.minimum_duration && !recipe.minimumDuration) {
      normalizedRecipe.minimumDuration = recipe.minimum_duration;
    }
    if (recipe.minimumDuration && !recipe.minimum_duration) {
      normalizedRecipe.minimum_duration = recipe.minimumDuration;
    }
    
    console.log('Found recipe:', normalizedRecipe);
    return normalizedRecipe;
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

// Render recipe details WITHOUT IMAGES
function renderRecipe(recipe) {
  const card = document.getElementById('recipeCard');
  if (!card || !recipe) {
    console.error('No card element or recipe data');
    return;
  }
  
  console.log('Rendering recipe:', recipe);
  
  const duration = recipe.minimumDuration || recipe.minimum_duration || 'Not specified';
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  
  // No image HTML - removed as images are no longer needed
  const recipeImageHTML = '';
  
  // Only render recipe content, NO IMAGES
  card.innerHTML = `
    <h2 class="section-title">${recipe.title || 'Untitled Recipe'}</h2>
    
    <div class="recipe-meta">
      <div class="meta-item">
        <strong>⏱️ Time:</strong> ${duration}
      </div>
      ${recipe.servings ? `
        <div class="meta-item">
          <strong>👥 Servings:</strong> ${recipe.servings}
        </div>
      ` : ''}
      ${recipe.difficulty ? `
        <div class="meta-item">
          <strong>⚡ Difficulty:</strong> ${recipe.difficulty}
        </div>
      ` : ''}
    </div>
    
    <div class="ingredients-section">
      <h3 class="section-title">📝 Ingredients</h3>
      <ul class="list ingredients-list">
        ${ingredients.length > 0 
          ? ingredients.map(ing => `<li class="ingredient-item">${ing}</li>`).join('')
          : '<li class="ingredient-item">No ingredients listed</li>'
        }
      </ul>
    </div>
    
    <div class="instructions-section">
      <h3 class="section-title">👨‍🍳 Instructions</h3>
      <ol class="list instructions-list">
        ${instructions.length > 0 
          ? instructions.map((step, index) => 
              `<li class="instruction-step">${step}</li>`
            ).join('')
          : '<li class="instruction-step">No instructions available</li>'
        }
      </ol>
    </div>
    
    ${recipe.notes ? `
      <div class="notes-section">
        <h3 class="section-title">📝 Notes</h3>
        <p class="recipe-notes">${recipe.notes}</p>
      </div>
    ` : ''}
  `;
  
  // Update page title
  document.title = `Cookease — ${recipe.title}`;
  
  // Set up start cooking button (uses existing button in HTML)
  const startBtn = document.getElementById('startCooking');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const encodedTitle = encodeURIComponent(recipe.title);
      window.location.href = `cooking.html?title=${encodedTitle}`;
    });
  }
  
  // Set up share button (uses existing button in HTML)
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe for ${recipe.title} on Cookease!\n\nIngredients:\n${ingredients.join('\n')}\n\nInstructions:\n${instructions.join('\n\n')}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled:', error);
      }
    });
  } else if (shareBtn) {
    // Fallback: copy to clipboard
    shareBtn.addEventListener('click', () => {
      const textToCopy = `${recipe.title}\n\nIngredients:\n${ingredients.join('\n')}\n\nInstructions:\n${instructions.join('\n\n')}`;
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = shareBtn.textContent;
          shareBtn.textContent = 'Copied!';
          shareBtn.style.background = '#4CAF50';
          shareBtn.style.color = 'white';
          
          setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.style.background = '';
            shareBtn.style.color = '';
          }, 2000);
        })
        .catch(err => {
          console.error('Copy failed:', err);
          shareBtn.textContent = 'Copy failed';
          shareBtn.style.background = '#f44336';
          shareBtn.style.color = 'white';
        });
    });
  }
}

// Initialize recipe page
async function init() {
  console.log('Initializing recipe page...');
  
  const title = getQueryParam('title');
  console.log('URL title parameter:', title);
  
  if (!title) {
    document.getElementById('recipeCard').innerHTML = `
      <div class="error-message">
        <h3>No Recipe Selected</h3>
        <p>Please go back to the main page and select a recipe.</p>
        <button onclick="window.history.back()" class="primary-btn">Go Back</button>
      </div>
    `;
    return;
  }
  
  // Show loading state
  const card = document.getElementById('recipeCard');
  card.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading recipe...</p>
    </div>
  `;
  
  try {
    const recipe = await fetchRecipeByTitle(title);
    
    if (!recipe) {
      throw new Error('Recipe not found in JSON file or cache');
    }
    
    renderRecipe(recipe);
    
  } catch (error) {
    console.error('Error:', error);
    card.innerHTML = `
      <div class="error-message">
        <h3>Failed to Load Recipe</h3>
        <p>${error.message}</p>
        <div class="error-actions">
          <button onclick="window.location.reload()" class="primary-btn">Retry</button>
          <button onclick="window.history.back()" class="secondary-btn">Go Back</button>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
    // If not in cache, load from recipe.json
    console.log('Loading recipe from JSON file...');
    const response = await fetch('recipe.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load recipe data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Loaded JSON data:', data);
    
    // Handle different JSON structures
    let recipes = [];
    if (Array.isArray(data)) {
      recipes = data; // Direct array
    } else if (data.food_recipes) {
      recipes = data.food_recipes; // Nested array
    } else if (data.recipes) {
      recipes = data.recipes; // Alternative key
    }
    
    console.log('Available recipes:', recipes.length);
    console.log('Recipe titles:', recipes.map(r => r.title));
    
    // Find the specific recipe (case-insensitive)
    const recipe = recipes.find(r => {
      if (!r || !r.title) return false;
      return r.title.trim().toLowerCase() === decodedTitle.trim().toLowerCase();
    });
    
    if (!recipe) {
      // Try partial match
      const partialMatch = recipes.find(r => 
        r.title && r.title.toLowerCase().includes(decodedTitle.toLowerCase())
      );
      
      if (partialMatch) {
        console.log('Found partial match:', partialMatch.title);
        return partialMatch;
      }
      
      throw new Error(`Recipe "${decodedTitle}" not found. Available recipes: ${recipes.map(r => r.title).join(', ')}`);
    }
    
    // Normalize keys (handle both formats)
    const normalizedRecipe = { ...recipe };
    if (recipe.minimum_duration && !recipe.minimumDuration) {
      normalizedRecipe.minimumDuration = recipe.minimum_duration;
    }
    if (recipe.minimumDuration && !recipe.minimum_duration) {
      normalizedRecipe.minimum_duration = recipe.minimumDuration;
    }
    
    console.log('Found recipe:', normalizedRecipe);
    return normalizedRecipe;
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

// Render recipe details WITHOUT extra buttons
function renderRecipe(recipe) {
  const card = document.getElementById('recipeCard');
  if (!card || !recipe) {
    console.error('No card element or recipe data');
    return;
  }
  
  console.log('Rendering recipe:', recipe);
  
  const duration = recipe.minimumDuration || recipe.minimum_duration || 'Not specified';
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  
  // Create image HTML
  let recipeImageHTML = '';
  if (recipe.recipeImage) {
    if (recipe.recipeImage.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      // It's an image file
      recipeImageHTML = `
        <div class="recipe-image-container">
          <img src="${recipe.recipeImage}" alt="${recipe.title}" class="recipe-image">
        </div>`;
    } else {
      // It's an emoji or text placeholder
      recipeImageHTML = `
        <div class="emoji-placeholder">
          ${recipe.recipeImage}
        </div>`;
    }
  } else {
    // Default fallback
    recipeImageHTML = `
      <div class="emoji-placeholder">
        🍳
      </div>`;
  }
  
  // Only render recipe content, NO BUTTONS inside
  card.innerHTML = `
    ${recipeImageHTML}
    
    <h2 class="section-title">${recipe.title || 'Untitled Recipe'}</h2>
    
    <div class="recipe-meta">
      <div class="meta-item">
        <strong>⏱️ Time:</strong> ${duration}
      </div>
      ${recipe.servings ? `
        <div class="meta-item">
          <strong>👥 Servings:</strong> ${recipe.servings}
        </div>
      ` : ''}
      ${recipe.difficulty ? `
        <div class="meta-item">
          <strong>⚡ Difficulty:</strong> ${recipe.difficulty}
        </div>
      ` : ''}
    </div>
    
    <div class="ingredients-section">
      <h3 class="section-title">📝 Ingredients</h3>
      <ul class="list ingredients-list">
        ${ingredients.length > 0 
          ? ingredients.map(ing => `<li class="ingredient-item">${ing}</li>`).join('')
          : '<li class="ingredient-item">No ingredients listed</li>'
        }
      </ul>
    </div>
    
    <div class="instructions-section">
      <h3 class="section-title">👨‍🍳 Instructions</h3>
      <ol class="list instructions-list">
        ${instructions.length > 0 
          ? instructions.map((step, index) => 
              `<li class="instruction-step">${step}</li>`
            ).join('')
          : '<li class="instruction-step">No instructions available</li>'
        }
      </ol>
    </div>
    
    ${recipe.notes ? `
      <div class="notes-section">
        <h3 class="section-title">📝 Notes</h3>
        <p class="recipe-notes">${recipe.notes}</p>
      </div>
    ` : ''}
  `;
  
  // Update page title
  document.title = `Cookease — ${recipe.title}`;
  
  // Set up start cooking button (uses existing button in HTML)
  const startBtn = document.getElementById('startCooking');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const encodedTitle = encodeURIComponent(recipe.title);
      window.location.href = `cooking.html?title=${encodedTitle}`;
    });
  }
  
  // Set up share button (uses existing button in HTML)
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe for ${recipe.title} on Cookease!\n\nIngredients:\n${ingredients.join('\n')}\n\nInstructions:\n${instructions.join('\n\n')}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled:', error);
      }
    });
  } else if (shareBtn) {
    // Fallback: copy to clipboard
    shareBtn.addEventListener('click', () => {
      const textToCopy = `${recipe.title}\n\nIngredients:\n${ingredients.join('\n')}\n\nInstructions:\n${instructions.join('\n\n')}`;
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = shareBtn.textContent;
          shareBtn.textContent = 'Copied!';
          shareBtn.style.background = '#4CAF50';
          shareBtn.style.color = 'white';
          
          setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.style.background = '';
            shareBtn.style.color = '';
          }, 2000);
        })
        .catch(err => {
          console.error('Copy failed:', err);
          shareBtn.textContent = 'Copy failed';
          shareBtn.style.background = '#f44336';
          shareBtn.style.color = 'white';
        });
    });
  }
}

// Initialize recipe page
async function init() {
  console.log('Initializing recipe page...');
  
  const title = getQueryParam('title');
  console.log('URL title parameter:', title);
  
  if (!title) {
    document.getElementById('recipeCard').innerHTML = `
      <div class="error-message">
        <h3>No Recipe Selected</h3>
        <p>Please go back to the main page and select a recipe.</p>
        <button onclick="window.history.back()" class="primary-btn">Go Back</button>
      </div>
    `;
    return;
  }
  
  // Show loading state
  const card = document.getElementById('recipeCard');
  card.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading recipe...</p>
    </div>
  `;
  
  try {
    const recipe = await fetchRecipeByTitle(title);
    
    if (!recipe) {
      throw new Error('Recipe not found in JSON file or cache');
    }
    
    renderRecipe(recipe);
    
  } catch (error) {
    console.error('Error:', error);
    card.innerHTML = `
      <div class="error-message">
        <h3>Failed to Load Recipe</h3>
        <p>${error.message}</p>
        <div class="error-actions">
          <button onclick="window.location.reload()" class="primary-btn">Retry</button>
          <button onclick="window.history.back()" class="secondary-btn">Go Back</button>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

