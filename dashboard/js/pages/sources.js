/**
 * Sources Page Renderer — Minimalist, Clean & Modern News Sources Manager
 */
const SourcesPage = {
  sourcesData: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600;">News Sources</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Configured RSS feeds and web scraper links</p>
        </div>
        <button class="btn btn-primary" onclick="SourcesPage.openAddModal()" style="padding: 6px 14px; font-size: 0.8rem;">
          + Add Source Link
        </button>
      </div>

      <div class="sources-grid" id="sources-grid">
        <div class="glass-card"><p>Loading sources...</p></div>
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
        grid.innerHTML = '<div class="glass-card"><p>No sources configured in sources.yaml</p></div>';
        return;
      }

      grid.innerHTML = this.sourcesData.map((s, idx) => `
        <div class="glass-card source-card-minimal">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">
                ${s.name}
              </h4>
              <a href="${s.feed_url || s.url}" target="_blank" style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono); text-decoration: none; word-break: break-all; display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${s.feed_url || s.url}
              </a>
            </div>

            <div style="display: flex; gap: 4px;">
              <button class="btn-clean-action" title="Edit Source" onclick="SourcesPage.openEditModal(${idx})">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn-clean-action danger" title="Delete Source" onclick="SourcesPage.deleteSource(${idx}, '${s.name}')">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 0.74rem; color: var(--text-muted);">
            <span>${s.category || 'tech'} • r/${s.subreddit || 'technology'}</span>
            <span style="font-weight: 600; color: var(--primary-purple);">${s.article_count} scraped</span>
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
      <div class="modal-content glass-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="font-family: var(--font-serif); font-size: 1.1rem;">Edit Source Link</h3>
          <button class="btn-icon" onclick="SourcesPage.closeEditModal()"><i data-lucide="x"></i></button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Source Name</label>
            <input type="text" id="edit-source-name" class="filter-select" value="${s.name}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Website / Feed URL</label>
            <input type="url" id="edit-source-url" class="filter-select" value="${s.feed_url || s.url}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Category</label>
              <input type="text" id="edit-source-category" class="filter-select" value="${s.category || 'tech'}" style="width: 100%; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Target Subreddit</label>
              <input type="text" id="edit-source-subreddit" class="filter-select" value="${s.subreddit || 'technology'}" style="width: 100%; margin-top: 4px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Scrape Tier</label>
              <select id="edit-source-tier" class="filter-select" style="width: 100%; margin-top: 4px;">
                <option value="1" ${s.tier == 1 ? 'selected' : ''}>Tier 1 (Fast RSS)</option>
                <option value="2" ${s.tier == 2 ? 'selected' : ''}>Tier 2 (AI ScrapeGraph)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Crawl Delay (s)</label>
              <input type="number" id="edit-source-delay" class="filter-select" value="${s.delay_seconds || 2}" min="1" max="10" style="width: 100%; margin-top: 4px;" />
            </div>
          </div>

          <button class="btn btn-primary" style="margin-top: 8px; justify-content: center;" onclick="SourcesPage.saveEditSource(${index})">
            Save Changes
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
