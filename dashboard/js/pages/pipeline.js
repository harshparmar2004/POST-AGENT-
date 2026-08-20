/**
 * Pipeline Flow & Agentic Node Workflow Renderer — Clean n8n style workflow visualizer & execution history
 */
const PipelinePage = {
  async render(container) {
    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem;">Agentic Node Workflow (n8n Engine)</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Real-time visual node flow tracking articles from RSS/Web ingest down to multi-API publishing.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-secondary" onclick="PipelinePage.loadPipelineData()">
            <i data-lucide="refresh-cw"></i> Refresh Workflow
          </button>
          <button class="btn btn-primary btn-glow" id="run-pipeline-flow-btn" onclick="App.triggerPipeline()">
            <i data-lucide="play"></i> Execute Agentic Pipeline
          </button>
        </div>
      </div>

      <!-- n8n Clean Node Workflow Diagram Card -->
      <div class="glass-card" style="padding: 26px; margin-bottom: 28px; background: var(--bg-card); overflow-x: auto;">
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 850px;">
          
          <!-- Node 1: Ingestion -->
          <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; text-align: center; position: relative;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; position: absolute; top: 12px; right: 12px;"></div>
            <div class="stat-icon" style="margin: 0 auto 10px; width: 44px; height: 44px; background: rgba(217, 119, 87, 0.15); color: var(--primary-purple);">
              <i data-lucide="rss"></i>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 4px;">1. News Ingestion</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">18 Sources (RSS + ScrapeGraphAI)</p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 1.1rem; color: var(--primary-purple);" id="node-ingest-count">0 Scraped</div>
          </div>

          <!-- Connecting Arrow 1 -->
          <div style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 1.2rem;">
            <i data-lucide="arrow-right"></i>
          </div>

          <!-- Node 2: Dedupe & Storage -->
          <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; text-align: center; position: relative;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; position: absolute; top: 12px; right: 12px;"></div>
            <div class="stat-icon" style="margin: 0 auto 10px; width: 44px; height: 44px; background: rgba(43, 123, 185, 0.15); color: var(--color-twitter);">
              <i data-lucide="database"></i>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 4px;">2. Deduplication DB</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">SHA-256 Hashing & SQLite</p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 1.1rem; color: var(--color-twitter);" id="node-db-count">0 Stored</div>
          </div>

          <!-- Connecting Arrow 2 -->
          <div style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 1.2rem;">
            <i data-lucide="arrow-right"></i>
          </div>

          <!-- Node 3: Multi-LLM Rewrite Agent -->
          <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; text-align: center; position: relative;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; position: absolute; top: 12px; right: 12px;"></div>
            <div class="stat-icon" style="margin: 0 auto 10px; width: 44px; height: 44px; background: rgba(123, 31, 162, 0.15); color: #a855f7;">
              <i data-lucide="sparkles"></i>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 4px;">3. LLM Rewriter</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Gemini 2.5 (4 Formats)</p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 1.1rem; color: #a855f7;" id="node-llm-count">0 Ready</div>
          </div>

          <!-- Connecting Arrow 3 -->
          <div style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 1.2rem;">
            <i data-lucide="arrow-right"></i>
          </div>

          <!-- Node 4: Nano Banana Image Studio -->
          <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; text-align: center; position: relative;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; position: absolute; top: 12px; right: 12px;"></div>
            <div class="stat-icon" style="margin: 0 auto 10px; width: 44px; height: 44px; background: rgba(193, 53, 132, 0.15); color: var(--color-instagram);">
              <i data-lucide="image"></i>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 4px;">4. Image Studio</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Nano Banana (Imagen 3)</p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 1.1rem; color: var(--color-instagram);" id="node-img-count">0 Images</div>
          </div>

          <!-- Connecting Arrow 4 -->
          <div style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 1.2rem;">
            <i data-lucide="arrow-right"></i>
          </div>

          <!-- Node 5: Multi-API Publisher -->
          <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; text-align: center; position: relative;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; position: absolute; top: 12px; right: 12px;"></div>
            <div class="stat-icon" style="margin: 0 auto 10px; width: 44px; height: 44px; background: rgba(46, 125, 50, 0.15); color: #2e7d32;">
              <i data-lucide="send"></i>
            </div>
            <h4 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 4px;">5. Multi-API Post</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Reddit, X, Insta, LinkedIn</p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 1.1rem; color: #2e7d32;" id="node-pub-count">0 Published</div>
          </div>

        </div>
      </div>

      <!-- Execution Runs History Table -->
      <div class="glass-card table-card">
        <div class="table-header-tools">
          <h3 style="font-size: 1.15rem; font-weight: 600; font-family: var(--font-serif);">Pipeline Execution History & Saved Logs</h3>
          <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 14px;" onclick="PipelinePage.loadPipelineData()">
            <i data-lucide="rotate-cw" style="width: 14px;"></i> Refresh History
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Status</th>
              <th>Started At</th>
              <th>Scraped</th>
              <th>Rewritten</th>
              <th>Images</th>
              <th>Published</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody id="pipeline-history-tbody">
            <tr><td colspan="8">Loading execution history...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadPipelineData();
  },

  async loadPipelineData() {
    try {
      const stats = await App.fetchApi('/api/stats');
      const historyData = await App.fetchApi('/api/pipeline/history?limit=50');

      // Update node counts
      document.getElementById('node-ingest-count').textContent = `${stats.summary.total} Scraped`;
      document.getElementById('node-db-count').textContent = `${stats.summary.total} Stored`;
      document.getElementById('node-llm-count').textContent = `${stats.summary.ready} Ready`;
      document.getElementById('node-img-count').textContent = `${stats.summary.ready + stats.summary.published} Images`;
      document.getElementById('node-pub-count').textContent = `${stats.summary.published + stats.summary.queued} Published`;

      // Update history table
      const tbody = document.getElementById('pipeline-history-tbody');
      if (!tbody) return;

      const runs = historyData.history;
      if (!runs || runs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No execution history recorded yet. Click "Execute Agentic Pipeline" above!</td></tr>';
        return;
      }

      tbody.innerHTML = runs.map(r => `
        <tr>
          <td><strong>#RUN-${r.id}</strong></td>
          <td><span class="badge badge-published">${r.status}</span></td>
          <td style="color: var(--text-muted); font-size: 0.84rem;">${r.started_at ? new Date(r.started_at).toLocaleString() : 'N/A'}</td>
          <td><strong>${r.articles_scraped}</strong></td>
          <td><strong>${r.articles_rewritten}</strong></td>
          <td><strong>${r.images_generated}</strong></td>
          <td><strong style="color: #2e7d32;">${r.published_count}</strong></td>
          <td><span style="font-family: var(--font-mono); font-size: 0.82rem;">${r.duration_seconds}s</span></td>
        </tr>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load pipeline flow page", e);
    }
  }
};
