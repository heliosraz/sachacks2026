// ===================== SESSION =====================
const SESSION_ID = localStorage.getItem('session_id') || (() => {
  const id = 'user_' + Math.random().toString(36).slice(2, 10);
  localStorage.setItem('session_id', id);
  return id;
})();

const API = '/api/v1';

// ===================== API =====================
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

const api = {
  getUser:    ()     => apiFetch(`/users/${SESSION_ID}`),
  getFridge:  ()     => apiFetch(`/items/${SESSION_ID}`),
  addItem:    (body) => apiFetch(`/items/${SESSION_ID}`, { method: 'POST', body: JSON.stringify(body) }),
  removeItem: (name) => apiFetch(`/items/${SESSION_ID}/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  getStock:   ()     => apiFetch(`/stock`),
  getRecipes: ()     => apiFetch(`/recipes`),
  generateAI: ()     => apiFetch(`/recipes/generate`, { method: 'POST' }),
  getScore: (recipe) => apiFetch(`/recipes/score?session_id=${SESSION_ID}`, { 
    method: 'POST', 
    body: JSON.stringify(recipe) 
})
};

// ===================== EMOJI =====================
const EMOJIS = [
  '🥚','🥛','🧀','🧈','🥩','🍗','🥦','🥕','🍎','🍊',
  '🍋','🍇','🍓','🫐','🥑','🍅','🧅','🧄','🥔','🌽',
  '🍞','🥐','🫘','🍝','🍚','🥣','🥫','🧃','🫙','🥜',
  '🧆','🍳','🥘','🍲','🫕','🧊','🧇','🥞','🍜','🛒',
  '🍄','🌿','🫚','🧂','🍯','🫖','☕','🥗','🫔','🌮',
];

function buildEmojiPicker(btnId, pickerId, gridId, onChange) {
  const btn    = document.getElementById(btnId);
  const picker = document.getElementById(pickerId);
  const grid   = document.getElementById(gridId);
  if (!btn || !picker || !grid) return;

  EMOJIS.forEach(e => {
    const opt = document.createElement('button');
    opt.className = 'emoji-opt';
    opt.textContent = e;
    opt.addEventListener('click', () => {
      btn.textContent = e;
      picker.style.display = 'none';
      if (onChange) onChange(e);
    });
    grid.appendChild(opt);
  });

  btn.addEventListener('click', ev => {
    ev.stopPropagation();
    const r = btn.getBoundingClientRect();
    picker.style.top  = (r.bottom + 6) + 'px';
    picker.style.left = r.left + 'px';
    picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', () => { picker.style.display = 'none'; });
  picker.addEventListener('click', e => e.stopPropagation());
}

// ===================== MODAL =====================
function buildModal(overlayId, consumeId, tossId, cancelId, onAction) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;

  const close = () => { overlay.style.display = 'none'; };

  document.getElementById(cancelId)?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.getElementById(consumeId)?.addEventListener('click', async () => {
    await onAction('consume');
    close();
  });
  document.getElementById(tossId)?.addEventListener('click', async () => {
    await onAction('toss');
    close();
  });
}

// ===================== FRIDGE HELPERS =====================
function getEmoji(item) {
  if (item.emoji) return item.emoji;
  const n = item.name?.toLowerCase() ?? '';
  if (n.includes('egg'))    return '🥚';
  if (n.includes('milk'))   return '🥛';
  if (n.includes('apple'))  return '🍎';
  if (n.includes('pasta'))  return '🍝';
  if (n.includes('bean'))   return '🫘';
  if (n.includes('rice'))   return '🍚';
  if (n.includes('bread'))  return '🍞';
  if (n.includes('cheese')) return '🧀';
  const map = { dairy:'🥛', produce:'🥦', meat:'🍗', bread:'🍞', canned:'🥫', dry:'🦂', frozen:'🧊' };
  return map[item.category] || '🛒';
}

// ===================== COLLAPSIBLE SIDEBAR =====================
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Persist state across pages
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  }

  // Create toggle button — appended to body so it's never clipped by sidebar
  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.title = 'Toggle sidebar';
  toggle.innerHTML = isCollapsed ? '›' : '‹';
  document.body.appendChild(toggle);

  toggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    toggle.innerHTML = collapsed ? '›' : '‹';
    localStorage.setItem('sidebar-collapsed', collapsed);
  });
}

document.addEventListener('DOMContentLoaded', initSidebar);
