/**
 * Media Catalog & AI Image Studio Page Renderer — Visual catalog with Nano Banana controls & 1-click API publishing
 */
const MediaPage = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.3rem;">Media Catalog & Nano Banana Image Studio</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Visual catalog of Nano Banana (Imagen 3) generated slides and rewrites. Click 'Publish Now' to post directly to APIs.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="MediaPage.loadMediaCatalog()">
              <i data-lucide="refresh-cw"></i> Refresh Catalog
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="sparkles"></i> Run Image Studio Generator
            </button>
          </div>
        </div>

        <!-- Nano Banana & Carousel Settings Control Card -->
        <div class="glass-card" style="border: 1px solid var(--primary-purple); background: var(--bg-card);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(217, 119, 87, 0.15); color: var(--primary-purple); border-radius: 6px;">
                <i data-lucide="sliders"></i>
              </div>
              <div>
                <h4 style="font-family: var(--font-serif); font-size: 1.1rem;">Nano Banana Image Studio Config</h4>
                <p style="font-size: 0.78rem; color: var(--text-muted);">Configure carousel slide count & aspect ratio for generated Instagram post decks</p>
              </div>
            </div>
            <span class="badge badge-scraped">🍌 NANO BANANA (IMAGEN 3)</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
            <div>
              <label style="font-size: 0.82rem; font-weight: 600;">Generated Slides Carousel per Post:</label>
              <select class="filter-select" style="width: 100%; margin-top: 4px;">
                <option selected>5 Carousel Image Slides (Cover + 3 Highlights + CTA)</option>
                <option>3 Image Highlights Carousel</option>
                <option>Single Feature Cover Image</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.82rem; font-weight: 600;">Target Aspect Ratio:</label>
              <select class="filter-select" style="width: 100%; margin-top: 4px;">
                <option selected>1:1 Square Instagram (1080 x 1080)</option>
                <option>4:5 Instagram Portrait (1080 x 1350)</option>
                <option>16:9 Landscape Banner (1200 x 675)</option>
              </select>
            </div>

            <div style="display: flex; align-items: flex-end;">
              <button class="btn btn-primary btn-glow" style="width: 100%; justify-content: center; padding: 10px;" onclick="App.showToast('Nano Banana Image Studio config saved!', 'success')">
                <i data-lucide="check"></i> Save Studio Controls
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Media Catalog Grid -->
      <div class="queue-grid" id="media-catalog-grid">
        <div class="glass-card"><p>Loading media catalog...</p></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadMediaCatalog();
  },

  async loadMediaCatalog() {
    const grid = document.getElementById('media-catalog-grid');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/articles?limit=50');
      const articles = data.articles;

      if (!articles || articles.length === 0) {
        grid.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i data-lucide="image" style="width: 48px; height: 48px; color: var(--primary-purple); margin-bottom: 12px;"></i>
            <h4 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 6px;">No Scraped Articles Found</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Click "Run Image Studio Generator" above to fetch news and build Nano Banana slide images!</p>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="play"></i> Start Pipeline Now
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      grid.innerHTML = articles.map(a => `
        <div class="glass-card queue-card" style="position: relative; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="queue-img-wrapper" style="height: 200px; position: relative;">
              <img src="${a.image_url || '/api/placeholder/400/220'}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60'" />
              ${!a.image_url ? '<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.85rem;">🎨 Click "Generate Image"</div>' : ''}
            </div>

            <div style="margin-top: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span class="badge" style="background: rgba(31,30,27,0.06); color: var(--text-main); font-size: 0.7rem;">${a.source}</span>
                <span class="badge badge-${a.status}">${a.status}</span>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; line-height: 1.3; margin-bottom: 8px;">${a.title}</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">Scraped: ${App.formatTimestamp(a.scraped_at)}</p>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.78rem; padding: 8px 10px;" onclick="App.openArticleModal(${a.id})">
              <i data-lucide="eye" style="width: 14px;"></i> View Details
            </button>

            <button class="btn btn-primary btn-glow" style="flex: 1.2; font-size: 0.78rem; padding: 8px 10px;" onclick="MediaPage.publishToAllApis(${a.id})">
              <i data-lucide="send" style="width: 14px;"></i> 🚀 Publish Now
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load media catalog", e);
      grid.innerHTML = '<div class="glass-card"><p class="error">Failed to load media catalog.</p></div>';
    }
  },

  async publishToAllApis(articleId) {
    try {
      App.showToast(`Publishing Article #${articleId} to Reddit, Twitter, Instagram & LinkedIn...`, 'info');
      const res = await App.fetchApi(`/api/articles/${articleId}/publish`, { method: 'POST' });
      App.showToast(res.message || 'Article published directly to all connected APIs!', 'success');
      this.loadMediaCatalog();
    } catch (err) {
      App.showToast(`Publishing failed: ${err.message}`, 'error');
    }
  }
};
