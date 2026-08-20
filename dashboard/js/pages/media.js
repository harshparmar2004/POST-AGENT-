/**
 * Media Catalog & Nano Banana Image Studio — Custom Prompt Studio & Visual Catalog
 */
const MediaPage = {
  articles: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 28px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">🎨 Nano Banana MCP Image Studio & Prompt Console</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Custom AI image prompt editor powered by Google AI Pro (Imagen 3 / Nano Banana) & PIL Fallback Engine.</p>
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

        <!-- Nano Banana Custom Prompt Sandbox Card -->
        <div class="glass-card" style="border: 2px solid var(--primary-purple); background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon" style="width: 40px; height: 40px; background: rgba(217, 119, 87, 0.15); color: var(--primary-purple); border-radius: 8px;">
                <i data-lucide="wand-2"></i>
              </div>
              <div>
                <h4 style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600;">Nano Banana Custom Prompt Studio (MCP Engine)</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Enter custom visual instructions or prompts for Nano Banana to generate targeted news slide graphics</p>
              </div>
            </div>
            <span class="badge badge-scraped" style="padding: 6px 12px; font-size: 0.75rem;">🍌 NANO BANANA ACTIVE</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); display: block; margin-bottom: 4px;">
                Custom Image Generation Prompt Instructions:
              </label>
              <textarea id="nano-banana-prompt-text" rows="3" class="filter-select" style="width: 100%; font-family: var(--font-sans); font-size: 0.88rem; line-height: 1.5; padding: 12px; resize: vertical;" placeholder="e.g. Modern minimalist tech news infographic card, dark mode with neon terracotta accents, bold title typography, high resolution 1:1 square ratio..."></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 14px;">
              <div>
                <label style="font-size: 0.82rem; font-weight: 600;">Visual Style Preset:</label>
                <select id="nano-banana-style-preset" class="filter-select" style="width: 100%; margin-top: 4px; padding: 9px;">
                  <option selected>Warm Claude Minimal (Terracotta & Cream)</option>
                  <option>Futuristic Dark Neon Tech</option>
                  <option>Clean Editorial Infographic</option>
                  <option>Bold Gradient Social Slide Card</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 600;">Target Aspect Ratio:</label>
                <select id="nano-banana-aspect-ratio" class="filter-select" style="width: 100%; margin-top: 4px; padding: 9px;">
                  <option selected>1:1 Square Instagram (1080 x 1080)</option>
                  <option>4:5 Instagram Portrait (1080 x 1350)</option>
                  <option>16:9 Banner (1200 x 675)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 600;">Target Article to Apply:</label>
                <select id="nano-banana-target-article" class="filter-select" style="width: 100%; margin-top: 4px; padding: 9px;">
                  <option value="">-- Apply to All Scraped Articles --</option>
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
              <button class="btn btn-primary btn-glow" style="padding: 10px 24px;" onclick="MediaPage.generateCustomNanoBananaImage()">
                <i data-lucide="sparkles"></i> 🎨 Generate Image with Nano Banana MCP
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Media Catalog Grid Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h4 style="font-family: var(--font-serif); font-size: 1.15rem;">Generated Media Catalog Cards</h4>
        <span style="font-size: 0.8rem; color: var(--text-muted);" id="media-catalog-count">Showing 0 media items</span>
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
    const countLabel = document.getElementById('media-catalog-count');
    const articleSelect = document.getElementById('nano-banana-target-article');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/articles?limit=50');
      this.articles = data.articles || [];

      if (countLabel) countLabel.textContent = `Showing ${this.articles.length} media items`;

      // Populate article target dropdown
      if (articleSelect && this.articles.length > 0) {
        articleSelect.innerHTML = '<option value="">-- Apply to All Scraped Articles --</option>' +
          this.articles.map(a => `<option value="${a.id}">Article #${a.id}: ${a.title.substring(0, 45)}...</option>`).join('');
      }

      if (!this.articles || this.articles.length === 0) {
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

      grid.innerHTML = this.articles.map(a => `
        <div class="glass-card queue-card" style="position: relative; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="queue-img-wrapper" style="height: 200px; position: relative;">
              <img src="${a.image_url || '/api/placeholder/400/220'}" alt="${a.title}" onerror="this.src='/api/placeholder/400/220'" />
            </div>

            <div style="margin-top: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span class="source-pill" style="font-size: 0.68rem; padding: 2px 7px;">${a.source}</span>
                <span class="badge badge-${a.status}">${a.status}</span>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; line-height: 1.3; margin-bottom: 8px;">${a.title}</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted);">Scraped: ${App.formatTimestamp(a.scraped_at)}</p>
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

  async generateCustomNanoBananaImage() {
    const promptText = document.getElementById('nano-banana-prompt-text').value.trim();
    const stylePreset = document.getElementById('nano-banana-style-preset').value;
    const aspectRatio = document.getElementById('nano-banana-aspect-ratio').value;
    const articleId = document.getElementById('nano-banana-target-article').value;

    if (!promptText) {
      App.showToast('Please enter prompt instructions for Nano Banana!', 'warning');
      return;
    }

    try {
      App.showToast('Sending prompt to Nano Banana MCP Engine...', 'info');
      const res = await App.fetchApi('/api/image-gen/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          style_preset: stylePreset,
          aspect_ratio: aspectRatio,
          article_id: articleId ? parseInt(articleId) : null
        })
      });

      App.showToast(res.message, 'success');
      this.loadMediaCatalog();
    } catch (err) {
      App.showToast(`Nano Banana generation failed: ${err.message}`, 'error');
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
