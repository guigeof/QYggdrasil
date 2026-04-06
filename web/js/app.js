/* =========================================================
   QGIS Plugin Hub — Main Application (Part 1: Core + Data)
   ========================================================= */
let allPlugins = [];
let filteredPlugins = [];
let currentPage = 1;
const PER_PAGE = 30;
let selectedPluginIds = new Set();
let listViewMode = false;
let customLists = JSON.parse(localStorage.getItem('qgis-hub-lists') || '[]');

let TopDlLimit = 10;
let TopRatedLimit = 10;
let currentLang = localStorage.getItem('qgis-hub-lang') || 'en';

function compareVersions(v1, v2) {
  const parse = v => v.replace(/[^0-9.]/g, '').split('.').map(Number);
  const a = parse(v1), b = parse(v2);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i]||0) > (b[i]||0)) return 1;
    if ((a[i]||0) < (b[i]||0)) return -1;
  }
  return 0;
}

function getFilteredPlugins(yearId, periodId) {
  const yearFilter = document.getElementById(yearId)?.value || 'all';
  const periodFilter = document.getElementById(periodId)?.value || 'all';
  
  let base = [...allPlugins];
  if (yearFilter !== 'all') {
    base = base.filter(p => {
      const y = new Date(p.create_date).getFullYear();
      if (yearFilter === '2026') return y === 2026;
      if (yearFilter === '2025') return y === 2025;
      if (yearFilter === '2024') return y === 2024;
      if (yearFilter === 'old') return y < 2024;
      return true;
    });
  }
  if (periodFilter !== 'all') {
    const now = new Date();
    base = base.filter(p => {
      const upd = new Date(p.update_date);
      const diff = (now - upd) / (1000 * 60 * 60 * 24);
      if (periodFilter === 'week') return diff <= 7;
      if (periodFilter === 'month') return diff <= 30;
      if (periodFilter === 'quarter') return diff <= 90;
      return true;
    });
  }
  return base;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const trans = TRANSLATIONS[currentLang][key];
    if (trans) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = trans;
      else el.textContent = trans;
    }
  });
  const searchInput = document.getElementById('explorer-search');
  if (searchInput) searchInput.placeholder = TRANSLATIONS[currentLang].search_placeholder;
  const treeSearch = document.getElementById('tree-search-input');
  if (treeSearch) treeSearch.placeholder = TRANSLATIONS[currentLang].search_tree;
  
  // Update all filter selects
  ['top-dl-year', 'top-rate-year', 'tree-year'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel && sel.options.length >= 5) {
      sel.options[0].text = TRANSLATIONS[currentLang].any_year;
      sel.options[1].text = TRANSLATIONS[currentLang].new_2026;
      sel.options[4].text = TRANSLATIONS[currentLang].old_plugins;
    }
  });

  ['top-dl-period', 'top-rate-period', 'tree-period'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel && sel.options.length >= 4) {
      sel.options[0].text = TRANSLATIONS[currentLang].trend_all;
      sel.options[1].text = TRANSLATIONS[currentLang].trend_month;
      sel.options[2].text = TRANSLATIONS[currentLang].trend_week;
      sel.options[3].text = TRANSLATIONS[currentLang].trend_quarter;
    }
  });
}

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch('data/plugins.json');
    const data = await res.json();
    
    // Deduplicate by name, keep highest version
    const grouped = {};
    data.plugins.forEach(p => {
      const key = p.name.trim();
      if (!grouped[key] || compareVersions(p.version, grouped[key].version) > 0) {
        grouped[key] = p;
      }
    });

    allPlugins = Object.values(grouped).map(p => {
      p.categories = classifyPlugin(p);
      p.isGov = detectGov(p);
      const geo = detectCountry(p);
      p.continent = geo ? geo.continent : null;
      p.country = geo ? geo.country : null;
      return p;
    });
    filteredPlugins = [...allPlugins];
    document.getElementById('loading-count').textContent = allPlugins.length;
    document.querySelector('.loading-bar-fill').style.width = '100%';
    
    // Setup i18n
    const langSel = document.getElementById('lang-selector');
    if (langSel) {
      langSel.value = currentLang;
      langSel.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('qgis-hub-lang', currentLang);
        applyI18n();
        location.reload(); // Refresh to ensure all logic (charts, etc) updates
      });
    }
    applyI18n();

    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('fade-out');
      document.getElementById('app').classList.remove('hidden');
      setTimeout(() => document.getElementById('loading-screen').style.display='none', 500);
      renderDashboard();
      setupNavigation();
      setupExplorer();
      setupTaxonomy();
      setupLists();
      setupWorkspaces();
    }, 600);
  } catch(e) {
    console.error('Failed to load:', e);
    document.querySelector('.loading-subtitle').textContent = 'Erro ao carregar dados. Verifique o arquivo data/plugins.json';
  }
}

// ---- Navigation ----
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const viewId = 'view-' + btn.dataset.view;
      document.getElementById(viewId).classList.add('active');
      if (btn.dataset.view === 'metrics') renderMetrics();
      if (btn.dataset.view === 'workspaces') renderWorkspaces();
    });
  });
}

// ---- Helpers ----
function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toString();
}

function getIconHtml(p, size=40) {
  const iconUrl = p.icon && !p.icon.includes('icon_default') ? p.icon : '';
  if (iconUrl) {
    return `<img src="${iconUrl}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="fallback-icon" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:${size*0.5}px">🔌</div>`;
  }
  return `<div class="fallback-icon" style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-size:${size*0.5}px">🔌</div>`;
}

function toast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ---- Dashboard ----
function renderDashboard() {
  const total = allPlugins.length;
  const totalDl = allPlugins.reduce((s,p) => s + p.downloads, 0);
  const rated = allPlugins.filter(p => p.rating_votes > 0);
  const avgRating = rated.length ? (rated.reduce((s,p) => s + p.average_vote, 0) / rated.length).toFixed(2) : '0';
  const authors = new Set(allPlugins.map(p => p.author)).size;
  const allTags = new Set(allPlugins.flatMap(p => p.tags));
  const updated = allPlugins.filter(p => p.update_date && p.update_date >= '2025').length;

  document.getElementById('stat-total').textContent = fmt(total);
  document.getElementById('stat-downloads').textContent = fmt(totalDl);
  document.getElementById('stat-avg-rating').textContent = avgRating;
  document.getElementById('stat-authors').textContent = fmt(authors);
  document.getElementById('stat-tags').textContent = fmt(allTags.size);
  document.getElementById('stat-updated').textContent = fmt(updated);
  document.getElementById('sidebar-total-plugins').textContent = total;

  // Top downloads
  renderTopDownloads();
  document.getElementById('top-dl-period')?.addEventListener('change', renderTopDownloads);
  document.getElementById('top-dl-year')?.addEventListener('change', renderTopDownloads);
  
  document.getElementById('top-rate-period')?.addEventListener('change', renderTopRated);
  document.getElementById('top-rate-year')?.addEventListener('change', renderTopRated);

  document.getElementById('btn-more-downloads')?.addEventListener('click', () => { 
    TopDlLimit = TopDlLimit === 10 ? 25 : 10; 
    document.getElementById('btn-more-downloads').textContent = TopDlLimit === 10 ? TRANSLATIONS[currentLang].ver_mais : TRANSLATIONS[currentLang].mostrar_menos;
    renderTopDownloads(); 
  });

  // Top rated (min 20 votes)
  renderTopRated();
  document.getElementById('btn-more-rated')?.addEventListener('click', () => {
    TopRatedLimit = TopRatedLimit === 10 ? 25 : 10;
    document.getElementById('btn-more-rated').textContent = TopRatedLimit === 10 ? TRANSLATIONS[currentLang].ver_mais : TRANSLATIONS[currentLang].mostrar_menos;
    renderTopRated();
  });


  // Tag cloud
  const tagCounts = {};
  allPlugins.forEach(p => p.tags.forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; }));
  const sortedTags = Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,60);
  const maxCount = sortedTags[0]?.[1] || 1;
  document.getElementById('tag-cloud').innerHTML = sortedTags.map(([tag, count]) => {
    const size = count > maxCount*0.5 ? 'tag-lg' : count > maxCount*0.2 ? 'tag-md' : '';
    return `<span class="tag-chip ${size}" onclick="filterByTag('${tag}')" title="${count} plugins">${tag} (${count})</span>`;
  }).join('');
}

function renderTopDownloads() {
  const filtered = getFilteredPlugins('top-dl-year', 'top-dl-period');
  const topDl = filtered.sort((a,b) => b.downloads - a.downloads).slice(0, TopDlLimit);
  document.getElementById('top-downloads-list').innerHTML = topDl.map((p,i) => `
    <div class="top-plugin-item" onclick="showPluginDetail('${p.plugin_id}')" style="cursor:pointer">
      <div class="top-rank">${i+1}</div>
      <div class="top-plugin-icon" style="width:32px;height:32px;border-radius:6px;background:var(--bg-secondary);overflow:hidden;flex-shrink:0">${getIconHtml(p, 32)}</div>
      <div class="top-plugin-info">
        <div class="top-plugin-name">${p.name}</div>
        <div class="top-plugin-meta">${p.author.substring(0,40)}</div>
      </div>
      <div class="top-plugin-value">⬇ ${fmt(p.downloads)}</div>
    </div>`).join('');
  
  if (document.getElementById('btn-more-downloads')) {
    document.getElementById('btn-more-downloads').textContent = TopDlLimit === 10 ? TRANSLATIONS[currentLang].ver_mais : TRANSLATIONS[currentLang].mostrar_menos;
  }
}

function renderTopRated() {
  const filtered = getFilteredPlugins('top-rate-year', 'top-rate-period').filter(p => p.rating_votes >= 20);
  const topRated = filtered.sort((a,b) => b.average_vote - a.average_vote).slice(0, TopRatedLimit);
  document.getElementById('top-rated-list').innerHTML = topRated.map((p,i) => `
    <div class="top-plugin-item" onclick="showPluginDetail('${p.plugin_id}')" style="cursor:pointer">
      <div class="top-rank">${i+1}</div>
      <div class="top-plugin-icon" style="width:32px;height:32px;border-radius:6px;background:var(--bg-secondary);overflow:hidden;flex-shrink:0">${getIconHtml(p, 32)}</div>
      <div class="top-plugin-info">
        <div class="top-plugin-name">${p.name}</div>
        <div class="top-plugin-meta">${p.rating_votes} ${TRANSLATIONS[currentLang].votes}</div>
      </div>
      <div class="top-plugin-value">⭐ ${p.average_vote.toFixed(2)}</div>
    </div>`).join('');
    
  if (document.getElementById('btn-more-rated')) {
    document.getElementById('btn-more-rated').textContent = TopRatedLimit === 10 ? TRANSLATIONS[currentLang].ver_mais : TRANSLATIONS[currentLang].mostrar_menos;
  }
}

// ---- Explorer ----
function setupExplorer() {
  const search = document.getElementById('explorer-search');
  const sortSel = document.getElementById('filter-sort');
  const statusSel = document.getElementById('filter-status');
  let debounce;
  search.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => { currentPage=1; applyFilters(); }, 250); });
  sortSel.addEventListener('change', () => { currentPage=1; applyFilters(); });
  statusSel.addEventListener('change', () => { currentPage=1; applyFilters(); });
  document.getElementById('btn-toggle-view').addEventListener('click', () => {
    listViewMode = !listViewMode;
    document.getElementById('plugin-grid').classList.toggle('list-view', listViewMode);
  });
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById('explorer-search').value.toLowerCase().trim();
  const sort = document.getElementById('filter-sort').value;
  const status = document.getElementById('filter-status').value;

  filteredPlugins = allPlugins.filter(p => {
    if (q) {
      const text = `${p.name} ${p.description} ${p.author} ${p.tags.join(' ')}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (status === 'stable') return !p.experimental && !p.deprecated;
    if (status === 'experimental') return p.experimental;
    if (status === 'trusted') return p.trusted;
    if (status === 'deprecated') return p.deprecated;
    return true;
  });

  const sortFns = {
    downloads: (a,b) => b.downloads - a.downloads,
    rating: (a,b) => b.average_vote - a.average_vote,
    name: (a,b) => a.name.localeCompare(b.name),
    updated: (a,b) => (b.update_date||'').localeCompare(a.update_date||''),
    created: (a,b) => (a.create_date||'').localeCompare(b.create_date||''),
    votes: (a,b) => b.rating_votes - a.rating_votes,
  };
  filteredPlugins.sort(sortFns[sort] || sortFns.downloads);

  document.getElementById('explorer-count').textContent = `${filteredPlugins.length} plugins encontrados`;
  renderPluginGrid();
  renderPagination();
}

function renderPluginGrid() {
  const start = (currentPage-1)*PER_PAGE;
  const page = filteredPlugins.slice(start, start+PER_PAGE);
  const grid = document.getElementById('plugin-grid');
  grid.innerHTML = page.map(p => {
    const iconHtml = getIconHtml(p);
    let flags = '';
    if (p.isGov) flags += '<span class="plugin-flag flag-gov">GOV</span>';
    if (p.trusted) flags += '<span class="plugin-flag flag-trusted">✓</span>';
    if (p.experimental) flags += '<span class="plugin-flag flag-experimental">EXP</span>';
    if (p.deprecated) flags += '<span class="plugin-flag flag-deprecated">DEP</span>';
    if (p.country) flags += `<span class="plugin-flag flag-country">${p.country.split(' ')[0]}</span>`;
    return `<div class="plugin-card" onclick="showPluginDetail('${p.plugin_id}')">
      ${flags ? `<div class="plugin-flags">${flags}</div>` : ''}
      <div class="plugin-card-header">
        <div class="plugin-card-icon">${iconHtml}</div>
        <div><div class="plugin-card-title">${p.name}</div><div class="plugin-card-version">v${p.version}</div></div>
      </div>
      <div class="plugin-card-desc">${p.description}</div>
      <div class="plugin-card-tags">${p.tags.slice(0,5).map(t=>`<span class="plugin-tag">${t}</span>`).join('')}</div>
      <div class="plugin-card-footer">
        <span class="plugin-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${fmt(p.downloads)}</span>
        <span class="plugin-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${p.average_vote.toFixed(1)}</span>
        <span class="plugin-card-quick">
          <button class="qbtn" onclick="event.stopPropagation();quickFavorite('${p.plugin_id}')" title="Add to Favorites">⭐</button>
          <button class="qbtn" onclick="event.stopPropagation();quickAddWs('${p.plugin_id}')" title="Add to Workspace">⚡</button>
        </span>
      </div>
    </div>`;
  }).join('');
}

function renderPagination() {
  const totalPages = Math.ceil(filteredPlugins.length / PER_PAGE);
  if (totalPages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }
  let html = '';
  const range = 3;
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage-1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage-range && i <= currentPage+range)) {
      html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === currentPage-range-1 || i === currentPage+range+1) {
      html += `<button class="page-btn" disabled>…</button>`;
    }
  }
  if (currentPage < totalPages) html += `<button class="page-btn" onclick="goPage(${currentPage+1})">›</button>`;
  document.getElementById('pagination').innerHTML = html;
}

function goPage(p) { currentPage = p; renderPluginGrid(); renderPagination(); window.scrollTo({top:0,behavior:'smooth'}); }
function filterByTag(tag) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-explorer').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-explorer').classList.add('active');
  document.getElementById('explorer-search').value = tag;
  currentPage = 1;
  applyFilters();
}

// ---- Plugin Detail Modal ----
function showPluginDetail(id) {
  const p = allPlugins.find(x => x.plugin_id === id);
  if (!p) return;
  const iconHtml = `<div style="width:64px;height:64px;border-radius:12px;background:var(--bg-secondary);overflow:hidden;display:flex;align-items:center;justify-content:center">${getIconHtml(p, 64)}</div>`;
  let badges = '';
  if (p.isGov) badges += '<span class="plugin-flag flag-gov">🏛️ GOV</span>';
  if (p.trusted) badges += '<span class="plugin-flag flag-trusted">✓ Confiável</span>';
  if (p.experimental) badges += '<span class="plugin-flag flag-experimental">⚗️ Experimental</span>';
  if (p.deprecated) badges += '<span class="plugin-flag flag-deprecated">⚠️ Descontinuado</span>';
  if (p.country) badges += `<span class="plugin-flag flag-country">${p.country}</span>`;
  p.categories.forEach(c => { badges += `<span class="plugin-tag" style="font-size:.75rem">${TAXONOMY[c]?.icon||'📦'} ${c}</span>`; });

  document.getElementById('modal-content').innerHTML = `
    <div class="detail-header">
      <div class="detail-icon">${iconHtml}</div>
      <div>
        <div class="detail-title">${p.name}</div>
        <div class="detail-author">por ${p.author}</div>
        <div class="detail-badges">${badges}</div>
      </div>
    </div>
    <div class="detail-stats">
      <div class="detail-stat"><span class="detail-stat-val">${fmt(p.downloads)}</span><span class="detail-stat-label">Downloads</span></div>
      <div class="detail-stat"><span class="detail-stat-val">⭐ ${p.average_vote.toFixed(2)}</span><span class="detail-stat-label">${p.rating_votes} votos</span></div>
      <div class="detail-stat"><span class="detail-stat-val">v${p.version}</span><span class="detail-stat-label">QGIS ${p.qgis_minimum_version}+</span></div>
    </div>
    <div class="detail-section"><h4>Descrição</h4><p class="detail-desc">${p.about || p.description}</p></div>
    <div class="detail-section"><h4>Tags</h4><div style="display:flex;flex-wrap:wrap;gap:.3rem">${p.tags.map(t=>`<span class="tag-chip" onclick="filterByTag('${t}')">${t}</span>`).join('')}</div></div>
    <div class="detail-section"><h4>Datas</h4><p class="detail-desc">Criado: ${p.create_date?.substring(0,10)||'N/A'} &nbsp;|&nbsp; Atualizado: ${p.update_date?.substring(0,10)||'N/A'}</p></div>
    <div class="detail-section"><h4>Links</h4><div class="detail-links">
      ${p.homepage ? `<a class="detail-link" href="${p.homepage}" target="_blank">🏠 Homepage</a>` : ''}
      ${p.repository ? `<a class="detail-link" href="${p.repository}" target="_blank">📦 Repositório</a>` : ''}
      ${p.tracker ? `<a class="detail-link" href="${p.tracker}" target="_blank">🐛 Issues</a>` : ''}
      ${p.download_url ? `<a class="detail-link" href="${p.download_url}" target="_blank">⬇️ Download</a>` : ''}
    </div></div>
    <div class="form-actions">
      <button class="btn btn-accent" onclick="quickFavorite('${p.plugin_id}')">⭐ Favorites</button>
      <button class="btn btn-outline" onclick="quickAddWs('${p.plugin_id}')">⚡ Add to Workspace</button>
      <button class="btn btn-ghost" onclick="addToListPrompt('${p.plugin_id}')">📋 Add to List</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('show');
}

document.getElementById('modal-close')?.addEventListener('click', () => document.getElementById('modal-overlay').classList.remove('show'));
document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });

// ============ PLUGIN TREE ============
function setupTaxonomy() {
  renderTaxonomyTree();
  document.getElementById('taxonomy-search-input').addEventListener('input', e => renderTaxonomyTree(e.target.value.toLowerCase()));
  document.getElementById('tree-year')?.addEventListener('change', () => renderTaxonomyTree());
  document.getElementById('tree-period')?.addEventListener('change', () => renderTaxonomyTree());
  document.getElementById('btn-expand-all')?.addEventListener('click', () => { document.querySelectorAll('.tree-node').forEach(n => n.style.display='block'); document.querySelectorAll('.tree-toggle').forEach(t => t.classList.add('expanded')); });
  document.getElementById('btn-collapse-all')?.addEventListener('click', () => { document.querySelectorAll('.tree-node[data-level="2"],.tree-node[data-level="3"]').forEach(n => n.style.display='none'); document.querySelectorAll('.tree-toggle').forEach(t => t.classList.remove('expanded')); });
}

function renderTaxonomyTree(filter='') {
  const tree = document.getElementById('taxonomy-tree');
  if (!tree) return;
  const filtered = getFilteredPlugins('tree-year', 'tree-period');
  let html = '';

  // ── Realms → Categories → Tags (3-level hierarchy) ──
  for (const [realmName, realm] of Object.entries(TAXONOMY_REALMS)) {
    // Count total plugins in this realm
    const realmPlugins = new Set();
    realm.children.forEach(cat => {
      filtered.forEach(p => { if (p.categories.includes(cat)) realmPlugins.add(p.plugin_id); });
    });
    if (filter && !realmName.toLowerCase().includes(filter) && !realm.children.some(c => c.toLowerCase().includes(filter))) {
      // Check if any plugin in realm matches
      const anyMatch = [...realmPlugins].some(id => { const p = filtered.find(x=>x.plugin_id===id); return p && p.name.toLowerCase().includes(filter); });
      if (!anyMatch) continue;
    }
    html += `<div class="tree-section"><div class="tree-section-title" style="color:${realm.color};cursor:pointer" onclick="toggleTreeNode(this,'realm_${realmName}')">${realm.icon} ${realmName} <span class="tree-count" style="font-size:.7rem">${realmPlugins.size}</span></div>`;
    html += `<div class="tree-node" data-level="1" style="display:none">`;

    for (const cat of realm.children) {
      const def = TAXONOMY[cat];
      if (!def) continue;
      const catPlugins = filtered.filter(p => p.categories.includes(cat));
      if (filter && !cat.toLowerCase().includes(filter) && !catPlugins.some(p => p.name.toLowerCase().includes(filter))) continue;
      html += `<div class="tree-item" onclick="toggleTreeNode(this, '${cat}')" data-cat="${cat}">
        <span class="tree-toggle">▶</span><span class="tree-icon">${def.icon}</span>
        <span class="tree-label">${cat}</span><span class="tree-count">${catPlugins.length}</span></div>`;
      html += `<div class="tree-node" data-level="2" style="display:none">`;
      // Sub-group by tags
      const tagCounts = {};
      catPlugins.forEach(p => p.tags.forEach(t => { if (def.tags.includes(t)) tagCounts[t] = (tagCounts[t]||0)+1; }));
      Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([tag,cnt]) => {
        html += `<div class="tree-item" onclick="showTaxonomyDetail('tag','${tag}')" style="margin-left:1.5rem">
          <span class="tree-toggle empty">▶</span><span class="tree-icon">🏷️</span>
          <span class="tree-label">${tag}</span><span class="tree-count">${cnt}</span></div>`;
      });
      html += '</div>';
    }
    html += '</div></div>';
  }

  // Others
  const others = filtered.filter(p => p.categories.includes('Others'));
  if (others.length && (!filter || 'others'.includes(filter))) {
    html += `<div class="tree-section"><div class="tree-item" onclick="showTaxonomyDetail('category','Others')"><span class="tree-toggle empty">▶</span><span class="tree-icon">📦</span><span class="tree-label">Others</span><span class="tree-count">${others.length}</span></div></div>`;
  }

  // Countries section
  html += `<div class="tree-section"><div class="tree-section-title">🌍 ${TRANSLATIONS[currentLang].by_country}</div>`;
  for (const [continent, countries] of Object.entries(COUNTRY_PATTERNS)) {
    const contPlugins = filtered.filter(p => p.continent === continent);
    if (!contPlugins.length) continue;
    if (filter && !continent.toLowerCase().includes(filter) && !Object.keys(countries).some(c => c.toLowerCase().includes(filter))) continue;
    html += `<div class="tree-item" onclick="toggleTreeNode(this, 'cont_${continent}')">
      <span class="tree-toggle">▶</span><span class="tree-icon">🌐</span>
      <span class="tree-label">${continent}</span><span class="tree-count">${contPlugins.length}</span></div>`;
    html += `<div class="tree-node" data-level="2" style="display:none">`;
    for (const [country] of Object.entries(countries)) {
      const cPlugins = filtered.filter(p => p.country === country);
      if (!cPlugins.length) continue;
      html += `<div class="tree-item" onclick="showTaxonomyDetail('country','${country}')" style="margin-left:1.5rem">
        <span class="tree-toggle empty">▶</span><span class="tree-icon">${country.split(' ')[0]}</span>
        <span class="tree-label">${country.substring(country.indexOf(' ')+1)}</span><span class="tree-count">${cPlugins.length}</span></div>`;
    }
    html += '</div>';
  }
  html += '</div>';

  // GOV section
  const govPlugins = filtered.filter(p => p.isGov);
  html += `<div class="tree-section"><div class="tree-section-title" data-i18n="gov_institutional">🏛️ GOV / Institutional</div>`;
  html += `<div class="tree-item" onclick="showTaxonomyDetail('gov','all')"><span class="tree-toggle empty">▶</span><span class="tree-icon">🏛️</span><span class="tree-label" data-i18n="gov_plugins">Government Plugins</span><span class="tree-count">${govPlugins.length}</span></div>`;
  html += '</div>';

  tree.innerHTML = html;
}

function toggleTreeNode(el, id) {
  const next = el.nextElementSibling;
  if (next && next.classList.contains('tree-node')) {
    const visible = next.style.display !== 'none';
    next.style.display = visible ? 'none' : 'block';
    el.querySelector('.tree-toggle')?.classList.toggle('expanded', !visible);
  }
  showTaxonomyDetail('category', id);
}

function showTaxonomyDetail(type, value) {
  const filtered = getFilteredPlugins('tree-year', 'tree-period');
  let plugins = [];
  let title = '';

  if (type === 'category') {
    if (value.startsWith('realm_')) {
      const realmName = value.replace('realm_', '');
      const realm = TAXONOMY_REALMS[realmName];
      plugins = filtered.filter(p => realm.children.some(c => p.categories.includes(c)));
      title = realmName;
    } else {
      plugins = filtered.filter(p => p.categories.includes(value));
      title = value;
    }
  }
  else if (type === 'tag') { plugins = filtered.filter(p => p.tags.includes(value)); title = `Tag: ${value}`; }
  else if (type === 'country') { plugins = filtered.filter(p => p.country === value); title = value; }
  else if (type === 'gov') { plugins = filtered.filter(p => p.isGov); title = '🏛️ Institutional Plugins'; }

  plugins.sort((a,b) => b.downloads - a.downloads);
  const detail = document.getElementById('taxonomy-detail');
  detail.innerHTML = `<div class="taxonomy-detail-header"><h2>${title} (${plugins.length})</h2></div>` +
    `<div class="taxonomy-grid">` +
    plugins.slice(0,100).map(p => {
      let flags = '';
      if (p.isGov) flags += '<span class="plugin-flag flag-gov">GOV</span>';
      if (p.country) flags += `<span class="plugin-flag flag-country">${p.country.split(' ')[0]}</span>`;
      return `<div class="plugin-card" onclick="showPluginDetail('${p.plugin_id}')">
        <div class="plugin-card-header"><div class="plugin-card-icon">${getIconHtml(p)}</div><div><div class="plugin-card-title">${p.name}</div><div class="plugin-card-version">v${p.version} — ⬇${fmt(p.downloads)} ⭐${p.average_vote.toFixed(1)}</div></div></div>
        <div class="plugin-card-desc">${p.description}</div>
        ${flags ? `<div style="margin-top:.5rem">${flags}</div>` : ''}
      </div>`;
    }).join('') + `</div>`;
}

// ============ METRICS ============
function renderMetrics() {
  renderBarChart('chart-categories', 'Plugins por Categoria',
    Object.entries(TAXONOMY).map(([cat, def]) => ({
      label: `${def.icon} ${cat}`, value: allPlugins.filter(p => p.categories.includes(cat)).length, color: def.color
    })).sort((a,b) => b.value - a.value)
  );

  renderBarChart('chart-downloads-cat', 'Downloads por Categoria',
    Object.entries(TAXONOMY).map(([cat, def]) => ({
      label: `${def.icon} ${cat}`, value: allPlugins.filter(p => p.categories.includes(cat)).reduce((s,p)=>s+p.downloads,0), color: def.color
    })).sort((a,b) => b.value - a.value)
  );

  const ratingBuckets = [5,4,3,2,1,0].map(r => {
    const l = r===0?'Sem votos':`${r}.0 - 5.0 ⭐`;
    const c = ['#64748b','#ef4444','#f97316','#f59e0b','#10b981','#6366f1'][r];
    const val = allPlugins.filter(p => r===0?(p.rating_votes===0):(p.average_vote>=r && p.average_vote<r+1)).length;
    return { label: l, color: c, value: val };
  });
  renderBarChart('chart-ratings', 'Distribuição de Ratings', ratingBuckets);

  const years = {};
  allPlugins.forEach(p => { const y = p.create_date?.substring(0,4); if(y) years[y]=(years[y]||0)+1; });
  renderBarChart('chart-timeline', 'Timeline de Criação',
    Object.entries(years).sort((a,b)=>b[0]-a[0]).map(([y,c]) => ({label:y, value:c, color:'#6366f1'}))
  );

  const authorCounts = {};
  allPlugins.forEach(p => { const a = p.author.substring(0,30); authorCounts[a]=(authorCounts[a]||0)+1; });
  renderBarChart('chart-authors', 'Top Autores',
    Object.entries(authorCounts).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([a,c])=>({label:a, value:c, color:'#06b6d4'}))
  );
}

function renderBarChart(containerId, title, data) {
  const max = Math.max(...data.map(d=>d.value), 1);
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="bar-chart">${data.map(d =>
    `<div class="bar-row">
      <span class="bar-label" title="${d.label}">${d.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(d.value/max*100).toFixed(1)}%;background:${d.color}"></div></div>
      <span class="bar-value">${fmt(d.value)}</span>
    </div>`
  ).join('')}</div>`;
}

// ============ CUSTOM LISTS ============
function setupLists() {
  document.getElementById('btn-new-list')?.addEventListener('click', () => document.getElementById('new-list-modal-overlay').classList.add('show'));
  document.getElementById('new-list-modal-close')?.addEventListener('click', () => document.getElementById('new-list-modal-overlay').classList.remove('show'));
  document.getElementById('new-list-cancel')?.addEventListener('click', () => document.getElementById('new-list-modal-overlay').classList.remove('show'));
  document.getElementById('new-list-modal-overlay')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.remove('show'); });
  document.getElementById('new-list-create')?.addEventListener('click', createNewList);
  document.getElementById('btn-import-list')?.addEventListener('click', () => document.getElementById('import-file-input').click());
  document.getElementById('import-file-input')?.addEventListener('change', importList);
  renderLists();
}

function createNewList() {
  const name = document.getElementById('new-list-name').value.trim();
  if (!name) { toast('Digite um nome para a lista','error'); return; }
  const desc = document.getElementById('new-list-desc').value.trim();
  const list = { id: Date.now().toString(), name, description: desc, plugins: [], created: new Date().toISOString() };
  customLists.push(list);
  saveLists();
  document.getElementById('new-list-modal-overlay').classList.remove('show');
  document.getElementById('new-list-name').value = '';
  document.getElementById('new-list-desc').value = '';
  renderLists();
  toast(`Lista "${name}" criada!`, 'success');
}

function saveLists() { localStorage.setItem('qgis-hub-lists', JSON.stringify(customLists)); }

function renderLists() {
  const container = document.getElementById('lists-container');
  const empty = document.getElementById('lists-empty');
  if (!customLists.length) { container.innerHTML = ''; container.appendChild(empty); empty.style.display='flex'; return; }
  if (empty) empty.style.display = 'none';
  container.innerHTML = customLists.map(list => {
    const pluginDetails = list.plugins.map(id => allPlugins.find(p => p.plugin_id === id)).filter(Boolean);
    return `<div class="list-card">
      <div class="list-card-header"><h3>${list.name}</h3><span class="list-card-count">${list.plugins.length} plugins</span></div>
      ${list.description ? `<div class="list-card-desc">${list.description}</div>` : ''}
      <div class="list-card-items">${pluginDetails.length ? pluginDetails.map(p =>
        `<div class="list-plugin-item"><span>${p.name}</span><button class="btn btn-sm btn-ghost" onclick="removeFromList('${list.id}','${p.plugin_id}')">✕</button></div>`
      ).join('') : '<div style="color:var(--text-muted);font-size:.8rem;padding:.5rem 0">Lista vazia — adicione plugins pelo Explorer</div>'}</div>
      <div class="list-card-footer">
        <button class="btn btn-sm btn-ghost" onclick="exportList('${list.id}')">⬇ Exportar JSON</button>
        <button class="btn btn-sm btn-danger" onclick="deleteList('${list.id}')">🗑 Excluir</button>
      </div>
    </div>`;
  }).join('');
}

function addToListPrompt(pluginId) {
  if (!customLists.length) { toast('Crie uma lista primeiro!','error'); return; }
  const listName = prompt('Escolha a lista (digite o nome):\n' + customLists.map(l => `- ${l.name}`).join('\n'));
  if (!listName) return;
  const list = customLists.find(l => l.name.toLowerCase() === listName.toLowerCase());
  if (!list) { toast('Lista não encontrada','error'); return; }
  if (list.plugins.includes(pluginId)) { toast('Plugin já está na lista','info'); return; }
  list.plugins.push(pluginId);
  saveLists(); renderLists();
  toast(`Plugin adicionado à lista "${list.name}"!`, 'success');
}

function removeFromList(listId, pluginId) {
  const list = customLists.find(l => l.id === listId);
  if (!list) return;
  list.plugins = list.plugins.filter(id => id !== pluginId);
  saveLists(); renderLists();
}

function deleteList(listId) {
  if (!confirm('Excluir esta lista?')) return;
  customLists = customLists.filter(l => l.id !== listId);
  saveLists(); renderLists();
  toast('Lista excluída', 'info');
}

function exportList(listId) {
  const list = customLists.find(l => l.id === listId);
  if (!list) return;
  const data = { ...list, pluginDetails: list.plugins.map(id => { const p = allPlugins.find(x=>x.plugin_id===id); return p ? {name:p.name,plugin_id:p.plugin_id,version:p.version,download_url:p.download_url} : null; }).filter(Boolean) };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `qgis-list-${list.name.replace(/\s+/g,'-')}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('Lista exportada!', 'success');
}

function importList(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      const list = { id: Date.now().toString(), name: data.name || file.name.replace('.json',''), description: data.description || 'Lista importada', plugins: data.plugins || (data.pluginDetails||[]).map(p=>p.plugin_id), created: new Date().toISOString() };
      customLists.push(list);
      saveLists(); renderLists();
      toast(`Lista "${list.name}" importada com ${list.plugins.length} plugins!`, 'success');
    } catch(err) { toast('Erro ao importar: arquivo JSON inválido','error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ============ WORKSPACES (Extension Manager Style) ============
let workspaces = JSON.parse(localStorage.getItem('qgis-hub-workspaces') || '[]');
function saveWorkspaces() { localStorage.setItem('qgis-hub-workspaces', JSON.stringify(workspaces)); }

function setupWorkspaces() {
  // Create default Favorites workspace if none exists
  if (!workspaces.find(w => w.name === '⭐ Favorites')) {
    workspaces.unshift({ id: 'favorites', name: '⭐ Favorites', description: 'Your favorite plugins', color: '#f59e0b', plugins: [], active: true, created: new Date().toISOString() });
    saveWorkspaces();
  }
  document.getElementById('btn-new-workspace')?.addEventListener('click', () => document.getElementById('ws-modal-overlay').classList.add('show'));
  document.getElementById('ws-modal-overlay')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.remove('show'); });
  document.getElementById('ws-create-btn')?.addEventListener('click', createWorkspace);
  document.getElementById('btn-import-workspace')?.addEventListener('click', () => document.getElementById('import-workspace-input').click());
  document.getElementById('import-workspace-input')?.addEventListener('change', importWorkspace);
  document.getElementById('btn-download-companion')?.addEventListener('click', () => {
    window.location.href = 'workspace_manager.zip';
  });
  renderWorkspaces();
}

function quickFavorite(pluginId) {
  let fav = workspaces.find(w => w.name === '⭐ Favorites');
  if (!fav) { fav = { id:'favorites', name:'⭐ Favorites', description:'Your favorite plugins', color:'#f59e0b', plugins:[], active:true, created:new Date().toISOString() }; workspaces.unshift(fav); }
  if (fav.plugins.find(p => p.plugin_id === pluginId)) { toast('Already in Favorites','info'); return; }
  fav.plugins.push({ plugin_id: pluginId, enabled: true });
  saveWorkspaces(); renderWorkspaces();
  const p = allPlugins.find(x => x.plugin_id === pluginId);
  toast(`⭐ ${p?.name} added to Favorites!`, 'success');
}

function quickAddWs(pluginId) {
  const userWs = workspaces.filter(w => w.name !== '⭐ Favorites');
  if (!userWs.length) { toast('Create a workspace first!','error'); return; }
  const name = prompt('Choose workspace:\n' + userWs.map(w => `- ${w.name}`).join('\n'));
  if (!name) return;
  const ws = userWs.find(w => w.name.toLowerCase() === name.toLowerCase());
  if (!ws) { toast('Workspace not found','error'); return; }
  if (ws.plugins.find(p => p.plugin_id === pluginId)) { toast('Already in workspace','info'); return; }
  ws.plugins.push({ plugin_id: pluginId, enabled: true });
  saveWorkspaces(); renderWorkspaces();
  const p = allPlugins.find(x => x.plugin_id === pluginId);
  toast(`⚡ ${p?.name} added to ${ws.name}!`, 'success');
}

function createWorkspace() {
  const name = document.getElementById('ws-name').value.trim();
  if (!name) { toast('Digite um nome','error'); return; }
  const ws = {
    id: Date.now().toString(), name,
    description: document.getElementById('ws-desc').value.trim(),
    color: document.getElementById('ws-color').value,
    plugins: [], // [{plugin_id, enabled}]
    active: true, created: new Date().toISOString()
  };
  workspaces.push(ws);
  saveWorkspaces();
  document.getElementById('ws-modal-overlay').classList.remove('show');
  document.getElementById('ws-name').value = '';
  document.getElementById('ws-desc').value = '';
  renderWorkspaces();
  toast(`Workspace "${name}" criado!`, 'success');
}

function renderWorkspaces() {
  const c = document.getElementById('workspaces-container');
  if (!c) return;
  if (!workspaces.length) {
    c.innerHTML = `<div class="ws-empty"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><h3>Nenhum Workspace</h3><p>Crie workspaces para agrupar plugins por cenário de uso, como o Extension Manager do Chrome.</p></div>`;
    return;
  }
  c.innerHTML = workspaces.map(ws => {
    const enabledCount = ws.plugins.filter(p => p.enabled).length;
    return `<div class="ws-card">
      <div class="ws-card-header" style="border-top:3px solid ${ws.color}">
        <div>
          <div class="ws-card-title"><span style="color:${ws.color}">⚡</span> ${ws.name} <span class="list-card-count">${enabledCount}/${ws.plugins.length}</span></div>
          ${ws.description ? `<div class="ws-card-desc">${ws.description}</div>` : ''}
        </div>
        <div class="ws-card-actions">
          <div class="ws-master-toggle">
            <span>${ws.active ? 'ON' : 'OFF'}</span>
            <label class="toggle"><input type="checkbox" ${ws.active?'checked':''} onchange="toggleWorkspace('${ws.id}',this.checked)"><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
      <div class="ws-search"><input type="text" class="input" placeholder="Buscar plugin para adicionar..." oninput="wsSearchPlugin('${ws.id}',this.value)" id="ws-search-${ws.id}"></div>
      <div id="ws-search-results-${ws.id}" style="max-height:150px;overflow-y:auto;padding:0 1.25rem"></div>
      <div class="ws-plugin-grid" id="ws-plugins-${ws.id}">
        ${ws.plugins.map(wp => {
          const p = allPlugins.find(x=>x.plugin_id===wp.plugin_id);
          if(!p) return '';
          return `<div class="ws-plugin-item ${wp.enabled?'':'disabled'}">
            <label class="toggle"><input type="checkbox" ${wp.enabled?'checked':''} onchange="toggleWsPlugin('${ws.id}','${wp.plugin_id}',this.checked)"><span class="toggle-slider" style="--accent:${ws.color}"></span></label>
            <span class="ws-plugin-name" onclick="showPluginDetail('${p.plugin_id}')">${p.name}</span>
            <span class="ws-plugin-meta">v${p.version}</span>
            <button class="btn btn-sm btn-ghost" onclick="removeWsPlugin('${ws.id}','${wp.plugin_id}')" title="Remover">✕</button>
          </div>`;
        }).join('')}
        ${!ws.plugins.length ? '<div style="color:var(--text-muted);font-size:.8rem;padding:.5rem;grid-column:1/-1">Busque e adicione plugins acima ↑</div>' : ''}
      </div>
      <div class="ws-card-footer">
        <button class="btn btn-sm btn-accent" onclick="generateQGISScript('${ws.id}')">🐍 Gerar Script QGIS</button>
        <button class="btn btn-sm btn-ghost" onclick="exportWorkspace('${ws.id}')">⬇ Exportar JSON</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWorkspace('${ws.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function wsSearchPlugin(wsId, query) {
  const container = document.getElementById(`ws-search-results-${wsId}`);
  if (!query.trim()) { container.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const ws = workspaces.find(w=>w.id===wsId);
  const existing = new Set(ws.plugins.map(p=>p.plugin_id));
  const results = allPlugins.filter(p => !existing.has(p.plugin_id) && `${p.name} ${p.tags.join(' ')}`.toLowerCase().includes(q)).slice(0,8);
  container.innerHTML = results.map(p => `<div class="ws-plugin-item" style="margin:.3rem 0;cursor:pointer" onclick="addToWorkspace('${wsId}','${p.plugin_id}')">
    <span style="color:var(--emerald);font-weight:700">+</span>
    <span class="ws-plugin-name">${p.name}</span>
    <span class="ws-plugin-meta">⬇${fmt(p.downloads)} ⭐${p.average_vote.toFixed(1)}</span>
  </div>`).join('') || '<div style="padding:.5rem;color:var(--text-muted);font-size:.8rem">Nenhum resultado</div>';
}

function addToWorkspace(wsId, pluginId) {
  const ws = workspaces.find(w=>w.id===wsId);
  if (!ws || ws.plugins.find(p=>p.plugin_id===pluginId)) return;
  ws.plugins.push({ plugin_id: pluginId, enabled: true });
  saveWorkspaces(); renderWorkspaces();
  const p = allPlugins.find(x=>x.plugin_id===pluginId);
  toast(`${p?.name} adicionado ao workspace!`, 'success');
}

function removeWsPlugin(wsId, pluginId) {
  const ws = workspaces.find(w=>w.id===wsId);
  if (!ws) return;
  ws.plugins = ws.plugins.filter(p=>p.plugin_id!==pluginId);
  saveWorkspaces(); renderWorkspaces();
}

function toggleWsPlugin(wsId, pluginId, checked) {
  const ws = workspaces.find(w=>w.id===wsId);
  const wp = ws?.plugins.find(p=>p.plugin_id===pluginId);
  if (wp) { wp.enabled = checked; saveWorkspaces(); renderWorkspaces(); }
}

function toggleWorkspace(wsId, active) {
  const ws = workspaces.find(w=>w.id===wsId);
  if (!ws) return;
  ws.active = active;
  ws.plugins.forEach(p => p.enabled = active);
  saveWorkspaces(); renderWorkspaces();
}

function deleteWorkspace(wsId) {
  if (!confirm('Excluir este workspace?')) return;
  workspaces = workspaces.filter(w=>w.id!==wsId);
  saveWorkspaces(); renderWorkspaces();
  toast('Workspace excluído','info');
}

function exportWorkspace(wsId) {
  const ws = workspaces.find(w=>w.id===wsId);
  if (!ws) return;
  const data = {
    ...ws,
    pluginDetails: ws.plugins.map(wp => {
      const p = allPlugins.find(x=>x.plugin_id===wp.plugin_id);
      if (!p) return null;
      const qgisName = p.file_name ? p.file_name.split('.')[0] : p.name.replace(/\s+/g,'');
      return {
        name: p.name,
        plugin_id: p.plugin_id,
        qgis_name: qgisName,
        version: p.version,
        download_url: p.download_url,
        enabled: wp.enabled
      };
    }).filter(Boolean)
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`qgis-workspace-${ws.name.replace(/\s+/g,'-')}.json`; a.click();
  toast('Workspace exportado!','success');
}

function importWorkspace(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      
      const importedPlugins = [];
      const srcArray = d.pluginDetails || d.plugins || [];
      
      for (const p of srcArray) {
        let realId = p.plugin_id;
        // If imported directly from QGIS, it might only have qgis_name
        if (!realId && p.qgis_name) {
          const matched = window.allPluginsData.find(x => 
            (x.file_name && x.file_name.split('.')[0] === p.qgis_name) ||
            (x.name.replace(/\s+/g,'') === p.qgis_name)
          );
          if (matched) realId = matched.plugin_id;
        }
        if (realId) {
          importedPlugins.push({ plugin_id: realId, enabled: p.enabled !== false });
        }
      }

      const ws = { 
        id: Date.now().toString(), 
        name: d.name || 'Importado de QGIS', 
        description: d.description || '', 
        color: d.color || '#6366f1', 
        plugins: importedPlugins, 
        active: true, 
        created: new Date().toISOString() 
      };
      
      workspaces.push(ws); saveWorkspaces(); renderWorkspaces();
      toast(`Workspace "${ws.name}" importado!`,'success');
    } catch(err) { toast('JSON inválido','error'); }
  };
  reader.readAsText(file); e.target.value='';
}

// ============ QGIS PYTHON SCRIPT GENERATOR ============
function generateQGISScript(wsId) {
  const ws = workspaces.find(w=>w.id===wsId);
  if (!ws) return;
  const enabled = ws.plugins.filter(p=>p.enabled).map(wp => allPlugins.find(x=>x.plugin_id===wp.plugin_id)).filter(Boolean);
  const disabled = ws.plugins.filter(p=>!p.enabled).map(wp => allPlugins.find(x=>x.plugin_id===wp.plugin_id)).filter(Boolean);
  if (!ws.plugins.length) { toast('No plugins in workspace','error'); return; }

  const pid = (p) => p.file_name ? p.file_name.split('.')[0] : p.name.replace(/\s+/g,'');
  const plist = (list) => list.map(p => `    "${pid(p)}",  # ${p.name}`).join('\n');

  const wrap = (body) => `exec("""\n${body}\n""")`;

  const s1body = `# QGIS Workspace Manager - "${ws.name}"
# Mode: INSTALL + ENABLE
# Generated by QGIS Plugin Hub (${new Date().toISOString().substring(0,10)})
# Paste this in QGIS > Plugins > Python Console

from qgis.utils import loadPlugin, startPlugin, unloadPlugin, active_plugins
import pyplugin_installer

plugins_to_enable = [
${plist(enabled)}
]

plugins_to_disable = [
${plist(disabled)}
]

print("=" * 60)
print("Workspace: ${ws.name}")
print(f"  Enable: {len(plugins_to_enable)} | Disable: {len(plugins_to_disable)}")
print("=" * 60)

for pid in plugins_to_enable:
    try:
        pyplugin_installer.instance().installPlugin(pid)
        loadPlugin(pid)
        startPlugin(pid)
        print(f"  OK {pid} installed & enabled")
    except Exception as e:
        try:
            loadPlugin(pid)
            startPlugin(pid)
            print(f"  OK {pid} enabled (already installed)")
        except:
            print(f"  FAIL {pid}: {e}")

for pid in plugins_to_disable:
    try:
        if pid in active_plugins:
            unloadPlugin(pid)
            print(f"  OFF {pid} disabled")
        else:
            print(f"  SKIP {pid} already inactive")
    except Exception as e:
        print(f"  WARN {pid} disable failed: {e}")

print("")
print("=" * 60)
print("Done! Some plugins may require a QGIS restart.")
print("=" * 60)`;

  const s2body = `# QGIS Workspace Manager - "${ws.name}"
# Mode: ENABLE ONLY (no install)

from qgis.utils import loadPlugin, startPlugin, active_plugins

plugins = [
${plist(enabled)}
]

print("Enabling ${enabled.length} plugins...")
for pid in plugins:
    try:
        if pid not in active_plugins:
            loadPlugin(pid)
            startPlugin(pid)
            print(f"  OK {pid} enabled")
        else:
            print(f"  SKIP {pid} already active")
    except:
        print(f"  FAIL {pid} not found - install first")
print("Done!")`;

  const s3body = `# QGIS Workspace Manager - "${ws.name}"
# Mode: DISABLE ALL

from qgis.utils import unloadPlugin, active_plugins

plugins = [
${plist(enabled)}
]

print("Disabling ${enabled.length} plugins...")
for pid in plugins:
    try:
        if pid in active_plugins:
            unloadPlugin(pid)
            print(f"  OFF {pid} disabled")
        else:
            print(f"  SKIP {pid} already inactive")
    except:
        print(f"  WARN {pid} failed")
print("Done! Restart QGIS to fully unload.")`;

  const s1 = wrap(s1body);
  const s2 = wrap(s2body);
  const s3 = wrap(s3body);

  window._qgisScripts = [s1, s2, s3];

  document.getElementById('modal-content').innerHTML = `
    <h2>\ud83d\udc0d QGIS Script \u2014 ${ws.name}</h2>
    <p style="color:var(--text-secondary);font-size:.85rem;margin-bottom:1rem">Paste in QGIS <strong>Python Console</strong> to manage ${ws.plugins.length} plugins.</p>
    <div style="display:flex;gap:.3rem;margin-bottom:.75rem" id="script-tabs">
      <button class="btn btn-sm btn-accent" onclick="switchScriptTab(0)">\ud83d\udce6 Install & Enable</button>
      <button class="btn btn-sm btn-ghost" onclick="switchScriptTab(1)">\u25b6\ufe0f Enable Only</button>
      <button class="btn btn-sm btn-ghost" onclick="switchScriptTab(2)">\u23f8\ufe0f Disable All</button>
    </div>
    <div class="code-header"><span>workspace_manager.py</span><button class="btn btn-sm btn-accent" onclick="copyScript()">\ud83d\udccb Copy</button></div>
    <pre class="code-block" id="qgis-script-code">${s1.replace(/</g,'&lt;')}</pre>
    <div class="form-actions" style="margin-top:1rem">
      <button class="btn btn-ghost" onclick="downloadScript('${ws.id}')">\u2b07 Download .py</button>
      <button class="btn btn-accent" onclick="copyScript()">\ud83d\udccb Copy Script</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('show');
}

function switchScriptTab(idx) {
  if (!window._qgisScripts) return;
  document.getElementById('qgis-script-code').textContent = window._qgisScripts[idx];
  document.querySelectorAll('#script-tabs button').forEach((b, i) => {
    b.className = `btn btn-sm ${i===idx ? 'btn-accent' : 'btn-ghost'}`;
  });
}

function copyScript() {
  const code = document.getElementById('qgis-script-code')?.textContent;
  if (code) { navigator.clipboard.writeText(code); toast('Script copied!','success'); }
}

function downloadScript(wsId) {
  const code = document.getElementById('qgis-script-code')?.textContent;
  if (!code) return;
  const ws = workspaces.find(w=>w.id===wsId);
  const blob = new Blob([code],{type:'text/plain'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`qgis_workspace_${(ws?.name||'workspace').replace(/\s+/g,'_')}.py`; a.click();
  toast('Script downloaded!','success');
}

