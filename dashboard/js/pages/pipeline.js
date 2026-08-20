/**
 * Pipeline Page Renderer — n8n Visual Node Workflow & Article Lifecycle Progress Tracker
 */
const PipelinePage = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">Agentic Node Workflow (n8n Engine Visualizer)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Real-time visual node flow tracking articles from RSS/Web ingest down to multi-API publishing.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="PipelinePage.loadPipelineData()">
              <i data-lucide="refresh-cw"></i> Refresh Workflow
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="play"></i> Execute Agentic Pipeline
            </button>
          </div>
        </div>

        <!-- Visual n8n Agentic Node Workflow Banner -->
        <div class="glass-card" style="padding: 24px; border: 1px solid var(--border-color); background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; overflow-x: auto; padding: 10px 0;">
            
            <!-- Node 1: Scraper Ingestion -->
            <div class="glass-card" style="flex: 1; min-width: 190px; text-align: center; border: 2px solid var(--primary-purple); background: var(--bg-surface); padding: 18px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(217,119,87,0.15); color: var(--primary-purple); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                <i data-lucide="rss" style="width: 22px; height: 22px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600;">1. News Ingestion</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">18 RSS & ScrapeGraphAI Feeds</p>
              <div style="margin-top: 10px; font-size: 1.3rem; font-weight: 700; color: var(--primary-purple);" id="node-1-count">--</div>
            </div>

            <i data-lucide="arrow-right" style="color: var(--text-muted); width: 24px; height: 24px; flex-shrink: 0;"></i>

            <!-- Node 2: AI Agent Curator & Rewriter -->
            <div class="glass-card" style="flex: 1; min-width: 190px; text-align: center; border: 2px solid #2b7bb9; background: var(--bg-surface); padding: 18px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(43,123,185,0.15); color: #2b7bb9; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                <i data-lucide="sparkles" style="width: 22px; height: 22px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600;">2. AI Agent Curator</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">Groq / Gemini (Niche Filter)</p>
              <div style="margin-top: 10px; font-size: 1.3rem; font-weight: 700; color: #2b7bb9;" id="node-2-count">--</div>
            </div>

            <i data-lucide="arrow-right" style="color: var(--text-muted); width: 24px; height: 24px; flex-shrink: 0;"></i>

            <!-- Node 3: Nano Banana Image Studio MCP -->
            <div class="glass-card" style="flex: 1; min-width: 190px; text-align: center; border: 2px solid #c13584; background: var(--bg-surface); padding: 18px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(193,53,132,0.15); color: #c13584; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                <i data-lucide="wand-2" style="width: 22px; height: 22px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600;">3. Nano Banana Studio</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">Imagen 3 MCP & Slide Cards</p>
              <div style="margin-top: 10px; font-size: 1.3rem; font-weight: 700; color: #c13584;" id="node-3-count">--</div>
            </div>

            <i data-lucide="arrow-right" style="color: var(--text-muted); width: 24px; height: 24px; flex-shrink: 0;"></i>

            <!-- Node 4: Multi-Channel Publishing -->
            <div class="glass-card" style="flex: 1; min-width: 190px; text-align: center; border: 2px solid #2e7d32; background: var(--bg-surface); padding: 18px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(46,125,50,0.15); color: #2e7d32; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                <i data-lucide="send" style="width: 22px; height: 22px;"></i>
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600;">4. Multi-API Publisher</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">Reddit, Twitter, Insta, LinkedIn</p>
              <div style="margin-top: 10px; font-size: 1.3rem; font-weight: 700; color: #2e7d32;" id="node-4-count">--</div>
            </div>

          </div>
        </div>

        <!-- Article Lifecycle Progress Table -->
        <div class="glass-card table-card">
          <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
            <h4 style="font-family: var(--font-serif); font-size: 1.15rem;">Live Content Lifecycle Progress Board</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Step 1 (Ingest) ➔ Step 2 (Curate) ➔ Step 3 (Studio) ➔ Step 4 (Publish)</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35%;">ARTICLE HEADLINE</th>
                <th style="width: 15%;">SOURCE</th>
                <th style="width: 35%;">CURRENT PIPELINE STEP</th>
                <th style="width: 15%;">SCRAPED AT</th>
              </tr>
            </thead>
            <tbody id="pipeline-articles-tbody">
              <tr><td colspan="4" style="text-align: center; padding: 30px;">Loading article workflow progression...</td></tr>
            </tbody>
          </table>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadPipelineData();
  },

  async loadPipelineData() {
    const node1 = document.getElementById('node-1-count');
    const node2 = document.getElementById('node-2-count');
    const node3 = document.getElementById('node-3-count');
    const node4 = document.getElementById('node-4-count');
    const tbody = document.getElementById('pipeline-articles-tbody');

    try {
      const stats = await App.fetchApi('/api/stats');
      if (node1) node1.textContent = `${stats.total_articles} Scraped`;
      if (node2) node2.textContent = `${stats.ready_articles} Rewritten`;
      if (node3) node3.textContent = `${stats.images_generated || stats.ready_articles} Cards`;
      if (node4) node4.textContent = `${stats.published_articles} Published`;

      const data = await App.fetchApi('/api/articles?limit=15');
      const articles = data.articles || [];

      if (!tbody) return;

      if (articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">No articles found in pipeline database.</td></tr>';
        return;
      }

      tbody.innerHTML = articles.map(a => {
        const hasRewrites = a.status === 'ready' || a.status === 'published';
        const hasImage = a.image_url ? true : false;
        const isQueuedOrPublished = a.status === 'published' || (a.platforms && (a.platforms.instagram || a.platforms.linkedin));

        return `
          <tr>
            <td class="article-title-cell" onclick="App.openArticleModal(${a.id})" title="${a.title}">
              ${a.title}
            </td>
            <td><span class="source-pill" style="font-size: 0.68rem; padding: 2px 7px;">${a.source}</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 600;">
                <span class="badge badge-scraped" style="padding: 2px 6px;">Step 1: Scraped 🟢</span>
                <i data-lucide="chevron-right" style="width: 12px; color: var(--text-muted);"></i>
                <span class="badge ${hasRewrites ? 'badge-ready' : 'badge-scraped'}" style="padding: 2px 6px; opacity: ${hasRewrites ? 1 : 0.4};">Step 2: AI Rewritten ${hasRewrites ? '🟢' : '⏳'}</span>
                <i data-lucide="chevron-right" style="width: 12px; color: var(--text-muted);"></i>
                <span class="badge ${hasImage ? 'badge-ready' : 'badge-scraped'}" style="padding: 2px 6px; opacity: ${hasImage ? 1 : 0.4};">Step 3: Studio ${hasImage ? '🟢' : '⏳'}</span>
                <i data-lucide="chevron-right" style="width: 12px; color: var(--text-muted);"></i>
                <span class="badge ${isQueuedOrPublished ? 'badge-published' : 'badge-scraped'}" style="padding: 2px 6px; opacity: ${isQueuedOrPublished ? 1 : 0.4};">Step 4: Queue/Post ${isQueuedOrPublished ? '🚀' : '⏳'}</span>
              </div>
            </td>
            <td style="color: var(--text-muted); font-size: 0.74rem;">${App.formatTimestamp(a.scraped_at)}</td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load pipeline visualizer", e);
    }
  }
};
