/**
 * Pillar 1: Scraped Data Vault & Web Sources Manager
 * Features dual tabs:
 * 1. 📦 Scraped Data Box Vault — Grid of all raw scraped news items from the internet with body excerpts & source metrics
 * 2. 🌐 Configured News Feeds — 18 permanent RSS & ScrapeGraph feeds with full Edit/Delete CRUD
 */
const SourcesPage = {
  sourcesData: [],
  scrapedArticles: [],
  activeTab: 'scraped',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">📥 Pillar 1: Scraped Data Vault & Web Sources Manager</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">View all raw scraped news items ingested from 18 web & RSS feeds across the internet.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="SourcesPage.refreshData()">
              <i data-lucide="refresh-cw"></i> Refresh Vault
            </button>
            <button class="btn btn-primary btn-glow" onclick="SourcesPage.openAddModal()">
              <i data-lucide="plus"></i> Add Source URL
            </button>
          </div>
        </div>

        <!-- View Switcher Tabs -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 12px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary ${this.activeTab === 'scraped' ? 'active-tab' : ''}" style="padding: 7px 16px; font-size: 0.84rem;" onclick="SourcesPage.setTab('scraped')">
              📦 Scraped Data Boxes Vault (<span id="vault-scraped-count">0</span> Scraped Items)
            </button>
            <button class="btn btn-secondary ${this.activeTab === 'feeds' ? 'active-tab' : ''}" style="padding: 7px 16px; font-size: 0.84rem;" onclick="SourcesPage.setTab('feeds')">
              🌐 Monitored Web & RSS Feeds (<span id="vault-sources-count">18</span> Permanent Feeds)
            </button>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;" id="tab-status-label">Raw Scraped Data Boxes</span>
        </div>

        <!-- Tab 1: Scraped Data Boxes Vault Grid -->
        <div id="tab-content-scraped" style="display: ${this.activeTab === 'scraped' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px;" id="scraped-data-boxes-grid">
            <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>Loading raw scraped data boxes...</p></div>
          </div>
        </div>

        <!-- Tab 2: Configured Feeds Grid -->
        <div id="tab-content-feeds" style="display: ${this.activeTab === 'feeds' ? 'block' : 'none'};">
          <div class="sources-grid" id="sources-grid">
            <div class="glass-card"><p>Loading configured news feeds...</p></div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.refreshData();
  },

  setTab(tabName) {
    this.activeTab = tabName;
    
    const tabScraped = document.getElementById('tab-content-scraped');
    const tabFeeds = document.getElementById('tab-content-feeds');
    const label = document.getElementById('tab-status-label');

    if (tabScraped) tabScraped.style.display = tabName === 'scraped' ? 'block' : 'none';
    if (tabFeeds) tabFeeds.style.display = tabName === 'feeds' ? 'block' : 'none';
    if (label) label.textContent = tabName === 'scraped' ? 'Raw Scraped Data Boxes' : '18 Configured Web & RSS Feeds';

    const tabs = document.querySelectorAll('.active-tab');
    tabs.forEach(t => t.classList.remove('active-tab'));
    this.render();
  },

  async refreshData() {
    await Promise.all([this.loadScrapedData(), this.loadSources()]);
  },

  async loadScrapedData() {
    const grid = document.getElementById('scraped-data-boxes-grid');
    const countSpan = document.getElementById('vault-scraped-count');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/articles?limit=80');
      this.scrapedArticles = data.articles || [];

      if (countSpan) countSpan.textContent = this.scrapedArticles.length;

      if (this.scrapedArticles.length === 0) {
        grid.innerHTML = '<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>No scraped articles found in database. Run the scraper engine!</p></div>';
        return;
      }

      grid.innerHTML = this.scrapedArticles.map(a => {
        const bodySnippet = a.body ? (a.body.length > 200 ? a.body.substring(0, 200) + '...' : a.body) : 'Raw headline scraped from source web feed.';

        return `
          <div class="glass-card article-box-card" onclick="App.openArticleModal(${a.id})">
            
            <!-- Box Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="source-pill">${a.source || 'RSS Web Feed'}</span>
                <span class="badge badge-${a.status}">${a.status.toUpperCase()}</span>
              </div>
              <span style="font-size: 0.74rem; font-weight: 700; color: var(--primary-purple); background: var(--bg-surface); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                ID #${a.id}
              </span>
            </div>

            <!-- Scraped Headline Title -->
            <h4 class="article-box-title">
              ${a.title}
            </h4>

            <!-- Raw Scraped Body Excerpt Box -->
            <p class="article-box-body">
              ${bodySnippet}
            </p>

            <!-- Box Metadata Footer -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <div style="font-size: 0.74rem; color: var(--text-muted);">
                Scraped: <strong>${App.formatTimestamp(a.scraped_at)}</strong>
              </div>
              <span style="font-size: 0.75rem; color: var(--primary-purple); font-weight: 600;">Inspect Raw Data 🔍</span>
            </div>

          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load scraped data boxes", e);
    }
  },

  async loadSources() {
    const grid = document.getElementById('sources-grid');
    const countSpan = document.getElementById('vault-sources-count');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/sources');
      this.sourcesData = data.sources || [];

      if (countSpan) countSpan.textContent = this.sourcesData.length;

      if (!this.sourcesData || this.sourcesData.length === 0) {
        grid.innerHTML = '<div class="glass-card"><p>No sources found in sources.yaml</p></div>';
        return;
      }

      grid.innerHTML = this.sourcesData.map((s, idx) => `
        <div class="glass-card source-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="source-header">
              <h3>${s.name}</h3>
              <span class="tier-tag tier-${s.tier}">TIER ${s.tier}</span>
            </div>

            <div class="source-meta">
              <div><i data-lucide="folder" style="width: 14px; display: inline;"></i> Category: <strong>${s.category || 'general'}</strong></div>
              <div><i data-lucide="message-square" style="width: 14px; display: inline;"></i> Subreddit: <strong>r/${s.subreddit || 'technology'}</strong></div>
              <div><i data-lucide="clock" style="width: 14px; display: inline;"></i> Delay: <strong>${s.delay_seconds}s</strong></div>
              <div style="margin-top: 4px; font-size: 0.78rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${s.feed_url || s.url}
              </div>

              <!-- Articles Scraped Metric -->
              <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">
                Articles scraped: <strong style="font-size: 1.1rem; color: var(--primary-purple);">${s.article_count}</strong>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.78rem;" onclick="SourcesPage.openEditModal(${idx})" title="Edit Source">
              <i data-lucide="edit-2" style="width: 13px;"></i> Edit
            </button>
            <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.78rem; color: var(--status-failed);" onclick="SourcesPage.deleteSource(${idx}, '${s.name}')" title="Delete Source">
              <i data-lucide="trash-2" style="width: 13px;"></i> Delete
            </button>
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
      this.refreshData();
    } catch (err) {
      App.showToast(`Failed to update source: ${err.message}`, 'error');
    }
  },

  async deleteSource(index, name) {
    if (!confirm(`Are you sure you want to delete source '${name}'?`)) return;

    try {
      const res = await App.fetchApi(`/api/sources/${index}/delete`, { method: 'POST' });
      App.showToast(res.message, 'info');
      this.refreshData();
    } catch (err) {
      try {
        const res = await App.fetchApi(`/api/sources/${index}`, { method: 'DELETE' });
        App.showToast(res.message, 'info');
        this.refreshData();
      } catch (e2) {
        App.showToast(`Failed to delete source: ${err.message}`, 'error');
      }
    }
  }
};
