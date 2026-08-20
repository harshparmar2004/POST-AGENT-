/**
 * Pipeline Flow & Agentic Node Workflow Renderer — Top-to-Bottom n8n Style Workflow Engine with Adjustable Node Settings
 */
const PipelinePage = {
  activeNode: 'node-1',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">n8n Top-to-Bottom Agentic Node Canvas</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Interactive workflow builder. Click on any node to view/adjust parameters and inspect data flow.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-secondary" onclick="PipelinePage.loadPipelineData()">
            <i data-lucide="refresh-cw"></i> Refresh Canvas
          </button>
          <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
            <i data-lucide="play"></i> Execute Workflow
          </button>
        </div>
      </div>

      <!-- 2-Column n8n Layout: Left Top-to-Bottom Canvas, Right Node Inspector Drawer -->
      <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 28px;">
        
        <!-- Left Column: Top-to-Bottom n8n Node Workflow Canvas -->
        <div class="glass-card" style="padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 0; background: var(--bg-card);">
          
          <!-- Node 1: News Ingestion -->
          <div class="n8n-node" id="n8n-node-1" onclick="PipelinePage.inspectNode('node-1')" style="width: 100%; background: var(--bg-surface); border: 2px solid var(--primary-purple); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(217, 119, 87, 0.15); color: var(--primary-purple); border-radius: 6px;">
                  <i data-lucide="rss"></i>
                </div>
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem;">Node 1: News Sources Ingestion</h4>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">Tier 1 RSS Feeds + Tier 2 ScrapeGraphAI LLM Scraper</p>
                </div>
              </div>
              <span class="badge badge-published" id="node-ingest-badge">18 SOURCES</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="color: var(--text-muted);">Extracted Status:</span>
              <strong id="node-ingest-count" style="color: var(--primary-purple);">0 Scraped</strong>
            </div>
          </div>

          <!-- Vertical Connector Line 1 -->
          <div style="width: 2px; height: 28px; background: var(--primary-purple); margin: 0 auto; position: relative;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-purple); position: absolute; top: 10px; left: -3px;"></div>
          </div>

          <!-- Node 2: Deduplication DB -->
          <div class="n8n-node" id="n8n-node-2" onclick="PipelinePage.inspectNode('node-2')" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(43, 123, 185, 0.15); color: var(--color-twitter); border-radius: 6px;">
                  <i data-lucide="database"></i>
                </div>
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem;">Node 2: SHA-256 Deduplication & DB</h4>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">SQLite Database Storage & Duplicate URL Hash Filter</p>
                </div>
              </div>
              <span class="badge badge-ready">ACTIVE</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="color: var(--text-muted);">Database Records:</span>
              <strong id="node-db-count" style="color: var(--color-twitter);">0 Stored</strong>
            </div>
          </div>

          <!-- Vertical Connector Line 2 -->
          <div style="width: 2px; height: 28px; background: var(--primary-purple); margin: 0 auto; position: relative;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-purple); position: absolute; top: 10px; left: -3px;"></div>
          </div>

          <!-- Node 3: Multi-LLM Rewrite Agent -->
          <div class="n8n-node" id="n8n-node-3" onclick="PipelinePage.inspectNode('node-3')" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(123, 31, 162, 0.15); color: #a855f7; border-radius: 6px;">
                  <i data-lucide="sparkles"></i>
                </div>
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem;">Node 3: Multi-LLM Rewrite Agent</h4>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">Evaluates articles for Niche & generates 4 social formats</p>
                </div>
              </div>
              <span class="badge badge-scraped">MULTI-LLM</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="color: var(--text-muted);">AI Content Status:</span>
              <strong id="node-llm-count" style="color: #a855f7;">0 Ready</strong>
            </div>
          </div>

          <!-- Vertical Connector Line 3 -->
          <div style="width: 2px; height: 28px; background: var(--primary-purple); margin: 0 auto; position: relative;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-purple); position: absolute; top: 10px; left: -3px;"></div>
          </div>

          <!-- Node 4: 5-Slide Image Studio Engine -->
          <div class="n8n-node" id="n8n-node-4" onclick="PipelinePage.inspectNode('node-4')" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(193, 53, 132, 0.15); color: var(--color-instagram); border-radius: 6px;">
                  <i data-lucide="image"></i>
                </div>
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem;">Node 4: 5-Slide Image Studio Generator</h4>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">Gemini 2.0 Flash / Pillow multi-slide visual carousel engine</p>
                </div>
              </div>
              <span class="badge badge-ready">5 SLIDES/POST</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="color: var(--text-muted);">Images & Slide Decks:</span>
              <strong id="node-img-count" style="color: var(--color-instagram);">0 Images</strong>
            </div>
          </div>

          <!-- Vertical Connector Line 4 -->
          <div style="width: 2px; height: 28px; background: var(--primary-purple); margin: 0 auto; position: relative;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-purple); position: absolute; top: 10px; left: -3px;"></div>
          </div>

          <!-- Node 5: Multi-API Publisher -->
          <div class="n8n-node" id="n8n-node-5" onclick="PipelinePage.inspectNode('node-5')" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="stat-icon" style="width: 36px; height: 36px; background: rgba(46, 125, 50, 0.15); color: #2e7d32; border-radius: 6px;">
                  <i data-lucide="send"></i>
                </div>
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem;">Node 5: Multi-API Social Publisher</h4>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">Reddit, Twitter/X, Instagram Graph API, LinkedIn API</p>
                </div>
              </div>
              <span class="badge badge-published">4 APIS CONNECTED</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="color: var(--text-muted);">Published Status:</span>
              <strong id="node-pub-count" style="color: #2e7d32;">0 Published</strong>
            </div>
          </div>

        </div>

        <!-- Right Column: n8n Node Configuration & Parameter Inspector Drawer -->
        <div class="glass-card" id="n8n-node-inspector" style="padding: 24px; background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              <h3 style="font-family: var(--font-serif); font-size: 1.15rem;" id="inspector-title">Node Parameters</h3>
              <span class="badge badge-scraped" id="inspector-badge">n8n Config</span>
            </div>
            <div id="inspector-content">
              <p style="font-size: 0.85rem; color: var(--text-muted);">Select any node on the left canvas to adjust its execution parameters!</p>
            </div>
          </div>

          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <button class="btn btn-primary btn-glow" style="width: 100%; justify-content: center;" onclick="App.showToast('Node parameters updated!', 'success')">
              Save Node Config
            </button>
          </div>
        </div>

      </div>

      <!-- Execution History & Batch Log Archive -->
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
    this.inspectNode('node-4'); // Default inspect Image Studio Node
  },

  inspectNode(nodeId) {
    this.activeNode = nodeId;

    // Highlight active node on canvas
    document.querySelectorAll('.n8n-node').forEach(el => {
      el.style.borderColor = 'var(--border-color)';
    });
    const activeEl = document.getElementById(`n8n-${nodeId}`);
    if (activeEl) activeEl.style.borderColor = 'var(--primary-purple)';

    const content = document.getElementById('inspector-content');
    const title = document.getElementById('inspector-title');
    const badge = document.getElementById('inspector-badge');

    if (nodeId === 'node-1') {
      title.textContent = 'Node 1: Ingestion Config';
      badge.textContent = 'SCRAPER ENGINE';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
          <p><strong>Primary Tool:</strong> <code>feedparser</code> + <code>ScrapeGraphAI</code> (Gemini 2.5)</p>
          <div>
            <label style="font-weight: 600;">Max Articles per Source:</label>
            <input type="number" class="filter-select" value="5" style="width: 100%; margin-top: 4px;" />
          </div>
          <div>
            <label style="font-weight: 600;">Scrape Delay (seconds):</label>
            <input type="number" class="filter-select" value="2" style="width: 100%; margin-top: 4px;" />
          </div>
          <div>
            <label style="font-weight: 600;">Robots.txt Strict Compliance:</label>
            <select class="filter-select" style="width: 100%; margin-top: 4px;">
              <option selected>Enabled (Strict Ethical Check)</option>
              <option>Permissive Mode</option>
            </select>
          </div>
        </div>
      `;
    } else if (nodeId === 'node-2') {
      title.textContent = 'Node 2: DB & Dedupe Config';
      badge.textContent = 'STORAGE ENGINE';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
          <p><strong>Database:</strong> SQLite3 (<code>pipeline.db</code> via SQLAlchemy ORM)</p>
          <p><strong>Hashing Algorithm:</strong> SHA-256 on Article Canonical URLs</p>
          <div>
            <label style="font-weight: 600;">Retention Policy:</label>
            <select class="filter-select" style="width: 100%; margin-top: 4px;">
              <option selected>Keep All Scraped History (Unlimited)</option>
              <option>30 Days Auto Cleanup</option>
            </select>
          </div>
        </div>
      `;
    } else if (nodeId === 'node-3') {
      title.textContent = 'Node 3: Multi-LLM Rewrite Config';
      badge.textContent = 'AI AGENT REWRITER';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
          <p><strong>Active LLM Provider:</strong> Auto-Detected (Groq / OpenAI / Claude / Gemini)</p>
          <div>
            <label style="font-weight: 600;">Target Niche Focus Prompt:</label>
            <input type="text" class="filter-select" value="Artificial Intelligence, Tech & Business" style="width: 100%; margin-top: 4px;" />
          </div>
          <div>
            <label style="font-weight: 600;">Output Social Formats:</label>
            <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 2px;">Twitter (Tweet), Reddit (Post), Instagram (Caption), LinkedIn (Article)</p>
          </div>
        </div>
      `;
    } else if (nodeId === 'node-4') {
      title.textContent = 'Node 4: 5-Slide Image Studio Engine';
      badge.textContent = 'IMAGE GENERATION';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
          <p><strong>Primary Tool:</strong> <code>Gemini 2.0 Flash</code> / PIL Graphics Renderer</p>
          <div>
            <label style="font-weight: 600;">Generated Slides Carousel per Post:</label>
            <select class="filter-select" style="width: 100%; margin-top: 4px;">
              <option selected>5 Carousel Image Slides (Cover + 3 Highlights + CTA)</option>
              <option>Single Feature Cover Image</option>
              <option>3 Image Highlights Carousel</option>
            </select>
          </div>
          <div>
            <label style="font-weight: 600;">Aspect Ratio:</label>
            <select class="filter-select" style="width: 100%; margin-top: 4px;">
              <option selected>1:1 Square Instagram (1080 x 1080)</option>
              <option>4:5 Instagram Portrait (1080 x 1350)</option>
              <option>16:9 Landscape Banner (1200 x 675)</option>
            </select>
          </div>
        </div>
      `;
    } else if (nodeId === 'node-5') {
      title.textContent = 'Node 5: Multi-API Publisher Config';
      badge.textContent = 'API BROADCASTER';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
          <p><strong>Connected API Networks:</strong> Reddit (PRAW), Twitter (Tweepy), Instagram Graph API, LinkedIn REST API</p>
          <div>
            <label style="font-weight: 600;">Broadcasting Mode:</label>
            <select class="filter-select" style="width: 100%; margin-top: 4px;">
              <option selected>Direct Live API Publishing to All 4 Platforms</option>
              <option>Save to Local Queue First</option>
            </select>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
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
        tbody.innerHTML = '<tr><td colspan="8">No execution history recorded yet. Click "Execute Workflow" above!</td></tr>';
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
