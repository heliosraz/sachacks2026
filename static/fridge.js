// ===================== STATE =====================
let pendingItemName = '';

// ===================== FRIDGE =====================
function renderFridgeItem(item) {
  const urgencyClass = { urgent: 'expiry-urgent', soon: 'expiry-soon', good: 'expiry-good' }[item.urgency] || 'expiry-good';
  const emoji = getEmoji(item);

  const el = document.createElement('div');
  el.className = 'fridge-item';
  el.innerHTML = `
    <span class="fridge-item-icon">${emoji}</span>
    <div class="fridge-item-info">
      <div class="fridge-item-name">${item.name}</div>
      <div class="fridge-item-detail">${item.category} · expires ${item.expiry_date}</div>
    </div>
    <span class="expiry-badge ${urgencyClass}">Exp. ${item.expiry_date}</span>
  `;

  el.addEventListener('click', () => {
    pendingItemName = item.name;
    document.getElementById('modal-emoji').textContent = emoji;
    document.getElementById('modal-name').textContent  = item.name;
    document.getElementById('action-modal').style.display = 'flex';
  });

  return el;
}

async function loadFridge() {
  const list = document.getElementById('fridge-list');
  list.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const items = await api.getFridge();
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="empty-state">Your fridge is empty — add something below!</div>';
      document.getElementById('urgency-alert').style.display = 'none';
      return;
    }
    const priority = { urgent: 0, soon: 1, good: 2 };
    items.sort((a, b) => (priority[a.urgency] ?? 2) - (priority[b.urgency] ?? 2));
    items.forEach(i => list.appendChild(renderFridgeItem(i)));
    refreshUrgencyAlert(items);
  } catch {
    list.innerHTML = '<div style="color:var(--coral);font-size:13px;">Could not reach server.</div>';
  }
  
}

function refreshUrgencyAlert(items) {
  const el     = document.getElementById('urgency-alert');
  const urgent = items.filter(i => i.urgency === 'urgent' || i.urgency === 'soon');
  if (urgent.length) {
    el.style.display = 'flex';
    el.querySelector('.urgency-alert-text').innerHTML =
      `<strong>${urgent.length} item${urgent.length > 1 ? 's' : ''} expiring soon.</strong> We'll prioritize these in your recipe suggestions.`;
  } else {
    el.style.display = 'none';
  }
}

// ===================== ADD ITEM =====================
function initAddForm() {
  const addBtn  = document.getElementById('add-btn');
  const nameIn  = document.getElementById('add-name');
  const catIn   = document.getElementById('add-category');
  const dateIn  = document.getElementById('add-expiry');

  addBtn.addEventListener('click', async () => {
    const name = nameIn.value.trim();
    if (!name) { nameIn.focus(); return; } // Return if no name provided

    addBtn.textContent = '...';
    addBtn.disabled = true;
    try {
      await api.addItem({
        name,
        category:    catIn.value,
        date_added: new Date(),
        expiry_date: dateIn.value,
      });
      nameIn.value    = '';
      const next = new Date(); next.setDate(next.getDate() + 7);
      dateIn.value = next.toISOString().split('T')[0];
      await loadFridge();
    } catch (err) {
      alert('Could not add item. Is the server running?');
      console.error(err);
    } finally {
      addBtn.textContent = '+ Add to Fridge';
      addBtn.disabled = false;
      nameIn.focus();
    }
  });

  nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });
}

// ===================== MODAL =====================
function initModal() {
  const overlay = document.getElementById('action-modal');
  const close   = () => { overlay.style.display = 'none'; pendingItemName = ''; };

  document.getElementById('modal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  async function removeAndClose() {
    if (!pendingItemName) return;
    try {
      await api.removeItem(pendingItemName);
      close();
      loadFridge();
    } catch (err) { console.error(err); }
  }

  document.getElementById('modal-consume').addEventListener('click', removeAndClose);
  document.getElementById('modal-toss').addEventListener('click', removeAndClose);
}

// ===================== PANTRY STOCK =====================

async function loadStock() {
  const availGrid = document.getElementById('stock-avail');
  const outGrid   = document.getElementById('stock-out');
  try {
    const items = await api.getStock();
    availGrid.innerHTML = '';
    outGrid.innerHTML   = '';
    if (!items.length) {
      availGrid.innerHTML = '<div class="empty-state">Pantry is empty. Come back soon!</div>';
      return;
    }

    items.forEach(i => {
      const dotClass = { available: 'dot-avail', low: 'dot-low', out: 'dot-out' }[i.status] || 'dot-avail';
      const emoji = getEmoji(i);
      const el = document.createElement('div');
      el.className = 'stock-item';
      if (i.status === 'out') el.style.opacity = '0.45';
      el.innerHTML = `
        <div class="stock-dot ${dotClass}"></div>
        <span class="stock-label">${i.item}</span>
        <span class="stock-item-icon">${emoji}</span>
      `;
      (i.status === 'out' ? outGrid : availGrid).appendChild(el);
    });
    if (!items.filter(s => s.status !== 'out').length)
      availGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No stock data yet.</div>';
  } catch {
    availGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">Could not load stock.</div>';
  }
}

// ===================== BOOT =====================
document.addEventListener('DOMContentLoaded', () => {
  initAddForm();
  initModal();

  // ← move date init inside here
  const dateIn = document.getElementById('add-expiry');
  const d = new Date(); d.setDate(d.getDate() + 7);
  dateIn.value = d.toISOString().split('T')[0];
  dateIn.min   = new Date().toISOString().split('T')[0];

  Promise.all([loadFridge(), loadStock()]);
});