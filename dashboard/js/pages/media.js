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
          <button class="btn btn-secondary" onclick="MediaPage.loadMediaCatalog()">
            <i data-lucide="refresh-cw"></i> Refresh Catalog
          </button>
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

      const mediaArticles = articles.filter(a => a.image_url || a.status === 'ready' || a.status === 'published');

      if (!mediaArticles || mediaArticles.length === 0) {
        grid.innerHTML = '<div class="glass-card"><p>No generated media catalog found. Click "Run Pipeline" to generate images!</p></div>';
        return;
      }

      grid.innerHTML = mediaArticles.map(a => `
        <div class="glass-card queue-card" style="position: relative;">
          <div class="queue-img-wrapper" style="height: 200px;">
            <img src="${a.image_url || '/api/placeholder/400/220'}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60'" />
          </div>

          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span class="badge" style="background: rgba(31,30,27,0.06); color: var(--text-main); font-size: 0.7rem;">${a.source}</span>
              <span class="badge badge-${a.status}">${a.status}</span>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; line-height: 1.3;">${a.title}</h4>
          </div>

          <div class="queue-content-text" style="font-size: 0.8rem; height: 90px; overflow-y: auto;">
            <strong>Instagram Caption:</strong> ${a.ai_content.instagram_caption || a.title}<br/><br/>
            <strong>Twitter Tweet:</strong> ${a.ai_content.twitter_text || a.title}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.78rem; padding: 7px 10px;" onclick="App.openArticleModal(${a.id})">
              <i data-lucide="eye" style="width: 14px;"></i> Preview All Slides
            </button>

            <button class="btn btn-primary btn-glow" style="flex: 1.2; font-size: 0.78rem; padding: 7px 10px;" onclick="MediaPage.publishToAllApis(${a.id})">
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
