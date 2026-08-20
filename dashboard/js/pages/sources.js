/**
 * Sources Page Renderer — Full CRUD (Add, Edit, Delete) for News Sources links
 */
const SourcesPage = {
  sourcesData: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.25rem;">News Sources Manager</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted);">Configure, edit, add or delete website RSS feeds & AI ScrapeGraphAI sources</p>
        </div>
        <button class="btn btn-primary btn-glow" onclick="SourcesPage.openAddModal()">
          <i data-lucide="plus"></i> Add Source Link
        </button>
      </div>

      <div class="sources-grid" id="sources-grid">
        <div class="glass-card"><p>Loading configured news sources...</p></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadSources();
  },

  async loadSources() {
    const grid = document.getElementById('sources-grid');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/sources');
      this.sourcesData = data.sources || [];

      if (!this.sourcesData || this.sourcesData.length === 0) {
        grid.innerHTML = '<div class="glass-card"><p>No sources found in sources.yaml</p></div>';
        return;
      }

      grid.innerHTML = this.sourcesData.map((s, idx) => `
        <div class="glass-card source-card">
          <div class="source-card-body">
            <div class="source-header">
              <h3>${s.name}</h3>
              <span class="tier-tag tier-${s.tier}">TIER ${s.tier}</span>
            </div>

            <div class="source-meta-grid">
              <div class="meta-row">
                <i data-lucide="folder"></i>
                <span>Category: <strong>${s.category || 'tech'}</strong></span>
              </div>
              <div class="meta-row">
                <i data-lucide="message-square"></i>
                <span>Subreddit: <strong>r/${s.subreddit || 'technology'}</strong></span>
              </div>
              <div class="meta-row">
                <i data-lucide="clock"></i>
                <span>Delay: <strong>${s.delay_seconds}s</strong></span>
              </div>
            </div>

            <div class="source-url-pill" title="${s.feed_url || s.url}">
              <i data-lucide="link-2"></i>
              <span>${s.feed_url || s.url}</span>
            </div>
          </div>

          <div class="source-card-footer">
            <div class="scraped-count">
              Scraped: <strong>${s.article_count}</strong>
            </div>
            
            <div class="source-actions">
              <button class="btn btn-secondary btn-action" onclick="SourcesPage.openEditModal(${idx})">
                <i data-lucide="edit-2"></i> Edit
              </button>
              <button class="btn btn-secondary btn-action btn-danger" onclick="SourcesPage.deleteSource(${idx}, '${s.name}')">
                <i data-lucide="trash-2"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load sources page", e);
    }
  },

  openAddModal() {
    const modal = document.getElementById('add-source-modal');
    if (modal) {
      document.getElementById('new-source-url').value = '';
      document.getElementById('new-source-name').value = '';
      modal.classList.add('active');
    }
  },

  openEditModal(index) {
    const s = this.sourcesData[index];
    if (!s) return;

    let modal = document.getElementById('edit-source-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'edit-source-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="SourcesPage.closeEditModal()"></div>
      <div class="modal-content glass-card" style="max-width: 520px;">
        <div class="modal-header">
          <h2>✏️ Edit News Source</h2>
          <button class="btn-icon" onclick="SourcesPage.closeEditModal()"><i data-lucide="x"></i></button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
          <div>
            <label style="font-size: 0.85rem; font-weight: 600;">Source Name</label>
            <input type="text" id="edit-source-name" class="filter-select" value="${s.name}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 0.85rem; font-weight: 600;">Website / Feed URL</label>
            <input type="url" id="edit-source-url" class="filter-select" value="${s.feed_url || s.url}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.85rem; font-weight: 600;">Category</label>
              <input type="text" id="edit-source-category" class="filter-select" value="${s.category || 'tech'}" style="width: 100%; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 0.85rem; font-weight: 600;">Target Subreddit</label>
              <input type="text" id="edit-source-subreddit" class="filter-select" value="${s.subreddit || 'technology'}" style="width: 100%; margin-top: 4px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.85rem; font-weight: 600;">Scrape Tier</label>
              <select id="edit-source-tier" class="filter-select" style="width: 100%; margin-top: 4px;">
                <option value="1" ${s.tier == 1 ? 'selected' : ''}>Tier 1 (Fast RSS)</option>
                <option value="2" ${s.tier == 2 ? 'selected' : ''}>Tier 2 (AI ScrapeGraph)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.85rem; font-weight: 600;">Crawl Delay (s)</label>
              <input type="number" id="edit-source-delay" class="filter-select" value="${s.delay_seconds || 2}" min="1" max="10" style="width: 100%; margin-top: 4px;" />
            </div>
          </div>

          <button class="btn btn-primary btn-glow" style="margin-top: 10px; justify-content: center;" onclick="SourcesPage.saveEditSource(${index})">
            <i data-lucide="check"></i> Save Changes to Source
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  },

  closeEditModal() {
    const modal = document.getElementById('edit-source-modal');
    if (modal) modal.classList.remove('active');
  },

  async saveEditSource(index) {
    const name = document.getElementById('edit-source-name').value.trim();
    const url = document.getElementById('edit-source-url').value.trim();
    const category = document.getElementById('edit-source-category').value.trim();
    const subreddit = document.getElementById('edit-source-subreddit').value.trim();
    const tier = document.getElementById('edit-source-tier').value;
    const delay = document.getElementById('edit-source-delay').value;

    try {
      const res = await App.fetchApi(`/api/sources/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, url, feed_url: url, category, subreddit, tier: parseInt(tier), delay_seconds: parseInt(delay)
        })
      });

      App.showToast(res.message, 'success');
      this.closeEditModal();
      this.loadSources();
    } catch (err) {
      App.showToast(`Failed to update source: ${err.message}`, 'error');
    }
  },

  async deleteSource(index, name) {
    if (!confirm(`Are you sure you want to delete source '${name}'?`)) return;

    try {
      const res = await App.fetchApi(`/api/sources/${index}`, { method: 'DELETE' });
      App.showToast(res.message, 'info');
      this.loadSources();
    } catch (err) {
      App.showToast(`Failed to delete source: ${err.message}`, 'error');
    }
  }
};
