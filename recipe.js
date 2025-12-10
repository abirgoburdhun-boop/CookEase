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
    
    // First, try to load from localStorage cache
    const cached = localStorage.getItem('cachedRecipes');
    if (cached) {
      const recipes = JSON.parse(cached);
      const recipe = recipes.find(r => r.title === decodedTitle);
      if (recipe) {
        console.log('Found recipe in cache:', recipe.title);
        return recipe;
      }
    }
    
    // If not in cache, load from recipe.json
    console.log('Loading recipe from JSON file...');
    const response = await fetch('recipe.json');
    
    if (!response.ok) {
      throw new Error('Failed to load recipe data');
    }
    
    const data = await response.json();
    const recipes = data.food_recipes || [];
    
    // Find the specific recipe
    const recipe = recipes.find(r => r.title === decodedTitle);
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Normalize keys (handle both formats)
    const normalizedRecipe = { ...recipe };
    if (recipe.minimum_duration && !recipe.minimumDuration) {
      normalizedRecipe.minimumDuration = recipe.minimum_duration;
    }
    
    return normalizedRecipe;
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    
    // Last resort: try fuzzy search in cache
    const cached = localStorage.getItem('cachedRecipes');
    if (cached) {
      const recipes = JSON.parse(cached);
      const decodedTitle = decodeURIComponent(title);
      const recipe = recipes.find(r => 
        r.title.toLowerCase().includes(decodedTitle.toLowerCase())
      );
      if (recipe) return recipe;
    }
    
    return null;
  }
}

// Render recipe details with image
function renderRecipe(recipe) {
  const card = document.getElementById('recipeCard');
  if (!card || !recipe) return;
  
  const duration = recipe.minimumDuration || 'Not specified';
  let recipeImageHTML;
if (recipe.recipeImage && recipe.recipeImage.match(/\.(jpg|jpeg|png|gif)$/i)) {
  // It's an actual image file
  recipeImageHTML = `<img src="${recipe.recipeImage}" alt="${recipe.title}">`;
} else if (recipe.recipeImage) {
  // It's an emoji or text
  recipeImageHTML = `<div class="emoji-placeholder">${recipe.recipeImage}</div>`;
} else {
  // Default fallback
  recipeImageHTML = `<div class="emoji-placeholder">🍳</div>`;
}

// Then in card.innerHTML:
card.innerHTML = `
  <div class="recipe-image-placeholder">
    ${recipeImageHTML}
  </div>
  ...
`;
  
  card.innerHTML = `
    <div class="recipe-image-container" style="
      width: 100%;
      height: 200px;
      overflow: hidden;
      border-radius: var(--radius-md);
      margin-bottom: 20px;
    ">
      <img src="${recipeImage}" alt="${recipe.title}" style="
        width: 100%;
        height: 100%;
        object-fit: cover;
      ">
    </div>
    
    <h2 class="section-title">${recipe.title}</h2>
    
    <div class="recipe-meta" style="
      display: flex;
      gap: 20px;
      margin: 16px 0;
      padding: 12px;
      background: rgba(255, 122, 0, 0.1);
      border-radius: var(--radius-md);
      flex-wrap: wrap;
    ">
      <div>
        <strong>⏱️ Time:</strong> ${duration}
      </div>
    </div>
    
    <h3 class="section-title">📝 Ingredients</h3>
    <ul class="list">
      ${(recipe.ingredients || []).map(ing => `<li>${ing}</li>`).join('')}
    </ul>
    
    <h3 class="section-title">👨‍🍳 Instructions</h3>
    <ol class="list" style="list-style-type: decimal;">
      ${(recipe.instructions || []).map((step, index) => 
        `<li style="margin-bottom: 10px;">${step}</li>`
      ).join('')}
    </ol>
  `;
  
  // Update page title
  document.title = `Cookease — ${recipe.title}`;
  
  // Set up start cooking button
  const startBtn = document.getElementById('startCooking');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const encodedTitle = encodeURIComponent(recipe.title);
      window.location.href = `cooking.html?title=${encodedTitle}`;
    });
  }
  
  // Set up share button
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe for ${recipe.title} on Cookease!\n\nIngredients:\n${recipe.ingredients.join('\n')}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled:', error);
      }
    });
  } else if (shareBtn) {
    // Fallback: copy to clipboard
    shareBtn.addEventListener('click', () => {
      const textToCopy = `${recipe.title}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nInstructions:\n${recipe.instructions.join('\n\n')}`;
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = shareBtn.textContent;
          shareBtn.textContent = 'Copied!';
          shareBtn.style.background = 'var(--success)';
          
          setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.style.background = '';
          }, 2000);
        })
        .catch(err => {
          console.error('Copy failed:', err);
          shareBtn.textContent = 'Copy failed';
        });
    });
  }
}

// Initialize recipe page
async function init() {
  const title = getQueryParam('title');
  
  if (!title) {
    document.getElementById('recipeCard').innerHTML = `
      <div class="error">
        <p>No recipe selected. Please go back and choose a recipe.</p>
        <button onclick="window.history.back()" class="primary-btn">Go Back</button>
      </div>
    `;
    return;
  }
  
  // Show loading state
  const card = document.getElementById('recipeCard');
  card.innerHTML = `
    <div class="loading" style="text-align: center; padding: 40px 0;">
      <div class="spinner"></div>
      <p>Loading recipe...</p>
    </div>
  `;
  
  try {
    const recipe = await fetchRecipeByTitle(title);
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    renderRecipe(recipe);
    
  } catch (error) {
    console.error('Error:', error);
    card.innerHTML = `
      <div class="error">
        <p>Failed to load recipe. Please try again.</p>
        <button onclick="window.location.reload()" class="primary-btn">Retry</button>
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