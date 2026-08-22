/**
 * 3D Interactive n8n Agentic Canvas Space Renderer (Pillar 1 -> 2 -> 3 -> 4)
 * Provides a 3D visual workspace to observe, prompt, and execute the content automation pipeline.
 */
const SpacePage = {
  articles: [],
  selectedArticleId: null,

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Header Controls -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">🌌 3D Interactive Agentic Canvas Space</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Visual n8n-style node pipeline: Web Scraper ➔ AI News Ranker ➔ Nano Banana 4-Slide Studio ➔ Multi-API Dispatch.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="SpacePage.loadSpaceData()">
              <i data-lucide="refresh-cw"></i> Refresh 3D Space
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="play"></i> Run Agentic Pipeline
            </button>
          </div>
        </div>

        <!-- 3D Isometric Agentic Canvas Space -->
        <div class="glass-card" style="position: relative; overflow: hidden; min-height: 480px; background: #FAF7F2; border: 2px solid var(--primary-purple); padding: 30px;">
          
          <!-- Background 3D Perspective Grid -->
          <div style="position: absolute; inset: 0; background-image: radial-gradient(#d97757 0.75px, transparent 0.75px), radial-gradient(#2b7bb9 0.75px, #faf7f2 0.75px); background-size: 30px 30px; background-position: 0 0, 15px 15px; opacity: 0.25; transform: perspective(1000px) rotateX(15deg); pointer-events: none;"></div>

          <!-- 4 Node Connections Grid -->
          <div style="position: relative; z-index: 10; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: center; justify-content: center; margin-top: 20px;">
            
            <!-- Node 1: Web Scraper -->
            <div class="node-3d-card" onclick="SpacePage.openNodeModal(1)">
              <div class="node-badge" style="background: rgba(217,119,87,0.15); color: var(--primary-purple);">NODE 1 • SCRAPER</div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--primary-purple); color: #fff; display: flex; align-items: center; justify-content: center; margin: 12px auto;">
                <i data-lucide="rss" style="width: 24px; height: 24px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 4px;">1. Web Scraper Engine</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">Scrapes 50+ news items from 18 feeds</p>
              <div style="margin-top: 12px; font-size: 1.25rem; font-weight: 700; color: var(--primary-purple);" id="space-n1-count">50 Scraped</div>
              <span class="btn-node-inspect">Click to Inspect 🔍</span>
            </div>

            <!-- Node Connector 1 -> 2 -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i data-lucide="arrow-right" style="width: 28px; height: 28px; color: var(--primary-purple); animation: pulse 1.5s infinite;"></i>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">50 News</span>
            </div>

            <!-- Node 2: AI Agent News Ranker -->
            <div class="node-3d-card" onclick="SpacePage.openNodeModal(2)">
              <div class="node-badge" style="background: rgba(43,123,185,0.15); color: #2b7bb9;">NODE 2 • AI AGENT</div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #2b7bb9; color: #fff; display: flex; align-items: center; justify-content: center; margin: 12px auto;">
                <i data-lucide="award" style="width: 24px; height: 24px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 4px;">2. AI News Ranker</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">Scores 1-100 & filters Top 10 news</p>
              <div style="margin-top: 12px; font-size: 1.25rem; font-weight: 700; color: #2b7bb9;" id="space-n2-count">Top 10 Ranked</div>
              <span class="btn-node-inspect">Prompt Agent 🧠</span>
            </div>

            <!-- Node Connector 2 -> 3 -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i data-lucide="arrow-right" style="width: 28px; height: 28px; color: #2b7bb9; animation: pulse 1.5s infinite;"></i>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">Top 10 Posts</span>
            </div>

            <!-- Node 3: Nano Banana Carousel Studio -->
            <div class="node-3d-card" onclick="SpacePage.openNodeModal(3)">
              <div class="node-badge" style="background: rgba(193,53,132,0.15); color: #c13584;">NODE 3 • NANO BANANA</div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #c13584; color: #fff; display: flex; align-items: center; justify-content: center; margin: 12px auto;">
                <i data-lucide="wand-2" style="width: 24px; height: 24px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 4px;">3. 4-Slide Studio</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">1 Banner + 3 Context Description Cards</p>
              <div style="margin-top: 12px; font-size: 1.25rem; font-weight: 700; color: #c13584;" id="space-n3-count">40 Slide Cards</div>
              <span class="btn-node-inspect">View Carousel 🎨</span>
            </div>

            <!-- Node Connector 3 -> 4 -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i data-lucide="arrow-right" style="width: 28px; height: 28px; color: #c13584; animation: pulse 1.5s infinite;"></i>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">Live Catalog</span>
            </div>

            <!-- Node 4: Multi-API Social Posting -->
            <div class="node-3d-card" onclick="SpacePage.openNodeModal(4)">
              <div class="node-badge" style="background: rgba(46,125,50,0.15); color: #2e7d32;">NODE 4 • PUBLISHER</div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #2e7d32; color: #fff; display: flex; align-items: center; justify-content: center; margin: 12px auto;">
                <i data-lucide="send" style="width: 24px; height: 24px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 4px;">4. Multi-API Publisher</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">Direct API post to Insta, X, LinkedIn, Reddit</p>
              <div style="margin-top: 12px; font-size: 1.25rem; font-weight: 700; color: #2e7d32;" id="space-n4-count">Ready to Dispatch</div>
              <span class="btn-node-inspect">Publish All 🚀</span>
            </div>

          </div>
        </div>

        <!-- Selected Top 10 Article 4-Slide Catalog Carousel Section -->
        <div class="glass-card" style="border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <h4 style="font-family: var(--font-serif); font-size: 1.2rem;">🎨 Nano Banana 4-Slide Catalog Preview (1 Banner + 3 Context Slides)</h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Select a top-ranked article to preview its complete 4-image slide deck</p>
            </div>
            <select id="space-article-select" class="filter-select" style="padding: 8px 14px;" onchange="SpacePage.onSelectArticle(this.value)">
              <option value="">-- Select Top 10 Article --</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;" id="space-slides-preview-grid">
            <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
              <p>Select a top-ranked article above to load its 4-slide catalog cards.</p>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadSpaceData();
  },

  async loadSpaceData() {
    try {
      const data = await App.fetchApi('/api/articles?limit=50');
      let articles = data.articles || [];

      // Sort by rank_score descending to get Top 10
      articles.sort((a, b) => (b.rank_score || 75) - (a.rank_score || 75));
      this.articles = articles;

      const top10 = articles.slice(0, 10);
      const select = document.getElementById('space-article-select');
      
      if (select && top10.length > 0) {
        select.innerHTML = '<option value="">-- Select Top 10 Article --</option>' +
          top10.map(a => `<option value="${a.id}">Article #${a.id} [Score ${a.rank_score || 75}/100]: ${a.title.substring(0, 40)}...</option>`).join('');
        
        // Default select first top article
        select.value = top10[0].id;
        this.onSelectArticle(top10[0].id);
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      console.error("Failed to load 3D space data", e);
    }
  },

  async onSelectArticle(articleId) {
    if (!articleId) return;
    this.selectedArticleId = articleId;
    const grid = document.getElementById('space-slides-preview-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 30px;"><p>Generating 4-slide catalog deck with Nano Banana...</p></div>';

    try {
      // Trigger 4-slide generation if not generated
      const res = await App.fetchApi(`/api/articles/${articleId}/slides`, { method: 'POST' });
      const slides = res.slides || [
        `/api/images/${articleId}_slide1.png`,
        `/api/images/${articleId}_slide2.png`,
        `/api/images/${articleId}_slide3.png`,
        `/api/images/${articleId}_slide4.png`
      ];

      const labels = [
        "🖼️ Slide 1: Main Title Banner Card",
        "🖼️ Slide 2: Key Context & Background",
        "🖼️ Slide 3: Detailed Breakdown",
        "🖼️ Slide 4: Community Discussion & CTA"
      ];

      grid.innerHTML = slides.map((imgUrl, i) => `
        <div class="glass-card" style="padding: 10px; text-align: center;">
          <div style="position: relative; height: 180px; border-radius: 6px; overflow: hidden; background: #ffffff; border: 1px solid var(--border-color); margin-bottom: 8px;">
            <img src="${imgUrl}" alt="${labels[i]}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='/api/placeholder/400/220'" />
          </div>
          <span style="font-size: 0.76rem; font-weight: 600; color: var(--text-main); font-family: var(--font-serif);">${labels[i]}</span>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      grid.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 20px;"><p class="error">Failed to generate 4-slide deck: ${err.message}</p></div>`;
    }
  },

  openNodeModal(nodeId) {
    if (nodeId === 1) App.navigateTo('sources');
    else if (nodeId === 2) App.navigateTo('ranking');
    else if (nodeId === 3) App.navigateTo('media');
    else if (nodeId === 4) App.navigateTo('queue');
  }
};
