/**
 * Dedicated Raw Scraped Data Vault Page Renderer (#scraped)
 * Displays all raw website data ingested from web scraper links in dedicated card boxes.
 */
const ScrapedPage = {
  articles: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Header Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 20px 24px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">📦 Raw Scraped Data Vault</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              Complete raw text, headlines, and web content scraped directly from monitored website links.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-secondary" onclick="ScrapedPage.loadScrapedData()">
              <i data-lucide="refresh-cw"></i> Refresh Raw Data
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="play"></i> Run Web Scraper Engine
            </button>
          </div>
        </div>

        <!-- Metric Summary Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); padding: 12px 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.86rem; color: var(--text-muted);">
            Total Raw Website Articles Scraped: <strong style="font-size: 1.1rem; color: var(--primary-purple);" id="raw-total-count">0</strong>
          </div>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="raw-search-input" placeholder="Search raw scraped text or websites..." class="filter-select" style="padding: 6px 14px; font-size: 0.82rem; width: 280px;" oninput="ScrapedPage.filterRawData(this.value)" />
          </div>
        </div>

        <!-- Raw Scraped Data Boxes Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;" id="raw-scraped-boxes-grid">
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>Loading raw scraped web content...</p></div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadScrapedData();
  },

  async loadScrapedData() {
    const grid = document.getElementById('raw-scraped-boxes-grid');
    const countLabel = document.getElementById('raw-total-count');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/articles?limit=100');
      this.articles = data.articles || [];

      if (countLabel) countLabel.textContent = this.articles.length;

      this.renderBoxes(this.articles);

    } catch (e) {
      console.error("Failed to load raw scraped data", e);
    }
  },

  filterRawData(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.renderBoxes(this.articles);
      return;
    }
    const filtered = this.articles.filter(a => 
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.source && a.source.toLowerCase().includes(q)) ||
      (a.url && a.url.toLowerCase().includes(q))
    );
    this.renderBoxes(filtered);
  },

  renderBoxes(items) {
    const grid = document.getElementById('raw-scraped-boxes-grid');
    if (!grid) return;

    if (!items || items.length === 0) {
      grid.innerHTML = '<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>No raw scraped data found. Click "Run Web Scraper Engine" to fetch live content.</p></div>';
      return;
    }

    grid.innerHTML = items.map(a => {
      const bodySnippet = a.body ? (a.body.length > 240 ? a.body.substring(0, 240) + '...' : a.body) : 'Raw web headline extracted.';

      return `
        <div class="glass-card article-box-card" style="padding: 20px; background: #ffffff;">
          
          <!-- Card Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span class="source-pill">${a.source || 'Web Source'}</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); background: var(--bg-surface); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
              RAW ITEM #${a.id}
            </span>
          </div>

          <!-- Raw Headline -->
          <h4 style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; line-height: 1.4; margin-bottom: 8px;">
            <a href="${a.url}" target="_blank" style="color: var(--text-main); text-decoration: none;">${a.title}</a>
          </h4>

          <!-- Raw Scraped Content Box -->
          <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px; background: var(--bg-surface); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            ${bodySnippet}
          </p>

          <!-- Card Footer -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <span style="font-size: 0.74rem; color: var(--text-muted);">${App.formatTimestamp(a.scraped_at)}</span>

            <div style="display: flex; gap: 8px;">
              <a href="${a.url}" target="_blank" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.76rem; text-decoration: none;">
                🌐 Website Link ↗️
              </a>
              <button class="btn btn-primary btn-glow" style="padding: 4px 12px; font-size: 0.76rem;" onclick="App.openArticleModal(${a.id})">
                Inspect Raw Box 🔍
              </button>
            </div>
          </div>

        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }
};
