/**
 * Sources Page Renderer — Grid of news sources with metrics and Add Source URL modal
 */
const SourcesPage = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <p style="font-size: 0.9rem; color: var(--text-muted);">Active news websites and RSS feeds monitored by the scraper engine</p>
        <button class="btn btn-primary btn-glow" onclick="SourcesPage.openAddModal()">
          <i data-lucide="plus"></i> Add Source URL
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
      const sources = data.sources;

      if (!sources || sources.length === 0) {
        grid.innerHTML = '<div class="glass-card"><p>No sources found in sources.yaml</p></div>';
        return;
      }

      grid.innerHTML = sources.map(s => `
        <div class="glass-card source-card">
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
          </div>

          <div style="padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Articles scraped:</span>
            <strong style="font-size: 1.1rem; color: var(--primary-purple);">${s.article_count}</strong>
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
    if (modal) modal.classList.add('active');
  },

  closeAddModal() {
    const modal = document.getElementById('add-source-modal');
    if (modal) modal.classList.remove('active');
  }
};
