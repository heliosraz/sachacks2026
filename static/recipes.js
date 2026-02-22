let cachedStock = [];

// ===================== RECIPE SUBTABS (filter only) =====================
document.querySelectorAll('.recipe-subtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.recipe-subtab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // TODO: filter by source when backend supports it
  });
});

// ===================== PANTRY STOCK =====================

async function loadStock() {
  const availGrid = document.getElementById('stock-avail');
  try {
    const items = await api.getStock();
    cachedStock = items;
  } catch {
    availGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">Could not load stock.</div>';
  }
}

// ===================== RECIPES =====================
async function renderRecipeCard(recipe) {
  if (!(recipe instanceof Object) || recipe instanceof HTMLElement) {
    return document.createElement('div');
  }
  const result = await api.getScore(recipe);
  const { matched, missing, score } = result;
  const total = recipe.ingredients?.length || 1;
  const pct = Math.min(100, Math.round((score / total) * 100));
  const barColor = pct === 100 ? 'var(--sage)' : 'var(--orange)';

  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.innerHTML = `
    <div class="recipe-card-body">
      <div class="recipe-name">${recipe.name}</div>
      <div class="recipe-tags">
        <span class="tag tag-match">${pct === 100 ? '✓ Full match' : `✓ ${pct}% match`}</span>
        ${missing?.length ? `<span class="tag tag-missing">Missing: ${missing.slice(0,2).map(m => m.item).join(', ')}</span>` : ''}
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%; background:${barColor};"></div>
      </div>
    </div>
    <div class="recipe-footer">
      <span>${recipe.ingredients?.length ?? 0} ingredients</span>
      <span style="color:var(--coral);font-weight:600;">View recipe →</span>
    </div>
  `;

  card.addEventListener('click', () => {
    document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('recipe-selected'));
    card.classList.add('recipe-selected');
    openRecipeModal(recipe, matched, missing);
    populateMissing(recipe, missing);
  });

  return card;
}

function openRecipeModal(recipe, matched, missing) {
  // Remove existing modal if any
  document.getElementById('recipe-modal')?.remove();

  const steps = Object.entries(recipe.preparation || {})
    .map(([n, step]) => `<li>${step}</li>`).join('');

  const missingHTML = missing?.length
    ? missing.map(m => `
        <div class="missing-row missing-store">
          <span class="missing-icon">🛒</span>
          ${m.item}
          ${m.quantity ? `<span class="missing-source source-store">${m.quantity} ${m.measure ?? ''}</span>` : ''}
        </div>`).join('')
    : '<div style="color:var(--sage);font-size:13px;">✓ You have everything!</div>';
  console.log(matched)
  const foundHTML = matched?.length
    ? matched.map(m => `
        <div style="color:var(--sage);font-size:13px;" class="missing-row missing-store">
          <span class="found-icon">🧊</span>
          ${m.item}
          ${m.quantity ? `<span class="found-source source-store">${m.quantity} ${m.measure ?? ''}</span>` : ''}
        </div>`).join('')
    : '<div style="color:var(--sage);font-size:13px;"></div>';
  const modal = document.createElement('div');
  modal.id = 'recipe-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal recipe-modal-inner">
      <button class="modal-cancel" id="close-recipe-modal" style="position:absolute;top:16px;right:16px;font-size:18px;">✕</button>
      <div class="recipe-modal-name">${recipe.name}</div>

      <div class="section-label" style="margin-top:16px;">Ingredients</div>
      <div id="recipe-modal-missing">${missingHTML}</div>
      <div id="recipe-modal-found">${foundHTML}</div>

      <div class="section-label" style="margin-top:16px;">Steps</div>
      <ol class="recipe-steps">${steps}</ol>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-recipe-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function loadRecipes() {
  const container = document.getElementById('recipe-list');
  container.innerHTML = '<div class="empty-state">Loading recipes...</div>';
  try {
    const recipes = await api.getRecipes();
    container.innerHTML = '';
    if (!recipes.length) {
      container.innerHTML = '<div class="empty-state">Add items to your fridge first, then come back here for suggestions.</div>';
      return;
    }
    console.log(recipes)
    const cards = await Promise.all(recipes.map(m => renderRecipeCard(m)));
    cards.forEach( m => container.appendChild(m));
  } catch {
    container.innerHTML = '<div style="color:var(--coral);font-size:13px;">Could not load recipes. Is the server running?</div>';
  }
}

// ===================== MISSING INGREDIENTS =====================
async function populateMissing(recipe, missing) {
  const emptyState  = document.getElementById('missing-empty');
  const content     = document.getElementById('missing-content');
  const pantryList  = document.getElementById('missing-pantry-list');
  const storeList   = document.getElementById('missing-store-list');
  const tip         = document.getElementById('missing-tip');
  const recipeLabel = document.getElementById('selected-recipe-label');

  pantryList.innerHTML = '';
  storeList.innerHTML  = '';
  emptyState.style.display = 'none';
  content.style.display    = 'block';

  if (recipeLabel) {
    recipeLabel.textContent = `For: ${recipe.name ?? 'this recipe'}`;
  }

  missing = missing ?? [];

  if (!missing.length) {
    pantryList.innerHTML = '<div style="color:var(--sage);font-size:13px;padding:8px 0;">✓ You have everything for this recipe!</div>';
    tip.style.display = 'none';
    return;
  }

  let pantryCount = 0;
  console.log(cachedStock)
  missing.forEach(item => {
    const isPantry = cachedStock.some(stockItem =>
    (item.item.toLowerCase().includes(stockItem.item.toLowerCase()) ||
    stockItem.item.toLowerCase().includes(item.item.toLowerCase())) && stockItem.status!="out"
    );
    console.log(item)
    console.log(isPantry)

    const name = item.item ?? item.name ?? item;  // your missing items use "item" not "name"
    const el = document.createElement('div');
    el.className = `missing-row ${isPantry ? 'missing-pantry' : 'missing-store'}`;
    console.log(el.className)
    el.innerHTML = `
      <span class="missing-icon">🛒</span>
      ${name}
      <span class="missing-source ${isPantry ? 'source-pantry' : 'source-store'}">
        ${isPantry ? 'Pantry' : 'Grocery'}
      </span>
    `;
    if (isPantry) { pantryList.appendChild(el); pantryCount++; }
    else storeList.appendChild(el);
  });

  if (pantryCount > 0) {
    tip.style.display = 'block';
    tip.innerHTML = `<strong style="color:var(--sage);">Tip:</strong> ${pantryCount} item${pantryCount > 1 ? 's' : ''} you need ${pantryCount > 1 ? 'are' : 'is'} available at The Pantry. Swing by — it's free!`;
  } else {
    tip.style.display = 'none';
  }
}

// ===================== GENERATE =====================
document.getElementById('generate-btn').addEventListener('click', async function () {
  this.textContent = '⏳ Generating...';
  this.disabled = true;
  try {
    await api.generateAI();
    await loadRecipes();
    this.textContent = '✓ Done!';
    this.style.background = 'var(--sage)';
    setTimeout(() => {
      this.textContent = 'Generate Recipes for My Fridge';
      this.style.background = '';
      this.disabled = false;
    }, 3000);
  } catch {
    this.textContent = 'Error — try again';
    this.style.background = 'var(--coral)';
    setTimeout(() => {
      this.textContent = 'Generate Recipes for My Fridge';
      this.style.background = '';
      this.disabled = false;
    }, 2500);
  }
});

// ===================== BOOT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadRecipes();
  Promise.all([loadStock()]);
});
