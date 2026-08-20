/**
 * NewsFlow Dashboard — Core SPA Application JS
 * Handles routing, state management, API communication, and UI events.
 */

const App = {
  currentPage: 'dashboard',
  pipelineRunning: false,
  
  init() {
    console.log("🚀 NewsFlow Dashboard Initializing...");
    
    // Bind navigation clicks
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Handle hash change in URL
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateTo(hash, false);
    });

    // Run / Stop Pipeline button handler
    const runBtn = document.getElementById('run-pipeline-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.handlePipelineButtonClick());
    }

    // Auto-Pilot toggle handler
    const apChk = document.getElementById('autopilot-toggle-chk');
    if (apChk) {
      apChk.addEventListener('change', (e) => this.toggleAutoPilot(e.target.checked));
      this.checkAutoPilotStatus();
    }

    // Modal close handlers
    const closeBtn = document.getElementById('modal-close-btn');
    const backdrop = document.querySelector('.modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

    const addSourceCloseBtn = document.getElementById('add-source-close-btn');
    if (addSourceCloseBtn) addSourceCloseBtn.addEventListener('click', () => {
      const modal = document.getElementById('add-source-modal');
      if (modal) modal.classList.remove('active');
    });

    const submitAddSourceBtn = document.getElementById('submit-add-source-btn');
    if (submitAddSourceBtn) {
      submitAddSourceBtn.addEventListener('click', () => this.submitAddSource());
    }

    // Initial page load
    const initialPage = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialPage);

    // Start background status polling
    this.checkPipelineStatus();
    setInterval(() => this.checkPipelineStatus(), 4000);
  },

  async handlePipelineButtonClick() {
    if (this.pipelineRunning) {
      await this.stopPipeline();
    } else {
      await this.triggerPipeline();
    }
  },

  async toggleAutoPilot(enabled) {
    const label = document.getElementById('autopilot-toggle-label');
    try {
      const res = await this.fetchApi('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, interval_minutes: 15 })
      });

      if (label) label.textContent = enabled ? 'Auto-Pilot: ON (15m)' : 'Auto-Pilot: OFF';
      this.showToast(res.message, enabled ? 'success' : 'info');
    } catch (e) {
      const chk = document.getElementById('autopilot-toggle-chk');
      if (chk) chk.checked = !enabled;
    }
  },

  async checkAutoPilotStatus() {
    try {
      const res = await fetch('/api/autopilot');
      if (!res.ok) return;
      const data = await res.json();
      const chk = document.getElementById('autopilot-toggle-chk');
      const label = document.getElementById('autopilot-toggle-label');
      if (chk) chk.checked = data.enabled;
      if (label) label.textContent = data.enabled ? 'Auto-Pilot: ON (15m)' : 'Auto-Pilot: OFF';
    } catch (e) {}
  },

  async submitAddSource() {
    const url = document.getElementById('new-source-url').value.trim();
    const name = document.getElementById('new-source-name').value.trim();
    const category = document.getElementById('new-source-category').value.trim();
    const subreddit = document.getElementById('new-source-subreddit').value.trim();
    const tier = document.getElementById('new-source-tier').value;
    const delay = document.getElementById('new-source-delay').value;

    if (!url) {
      this.showToast('Please enter a website URL', 'warning');
      return;
    }

    try {
      const res = await this.fetchApi('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, url, category, subreddit, tier: parseInt(tier), delay_seconds: parseInt(delay)
        })
      });

      this.showToast(res.message, 'success');
      const modal = document.getElementById('add-source-modal');
      if (modal) modal.classList.remove('active');

      if (this.currentPage === 'sources' && typeof SourcesPage !== 'undefined') {
        SourcesPage.render(document.getElementById('page-container'));
      }
    } catch (err) {
      this.showToast(`Failed to add source: ${err.message}`, 'error');
    }
  },

  navigateTo(page, updateHash = true) {
    if (!['dashboard', 'articles', 'sources', 'queue', 'media', 'pipeline', 'logs', 'settings'].includes(page)) {
      page = 'dashboard';
    }

    this.currentPage = page;
    if (updateHash) {
      window.location.hash = page;
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });

    const pageTitles = {
      dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time automation analytics and content pipeline status' },
      articles: { title: 'Articles Browser', subtitle: 'Manage scraped articles, AI rewrites, and platform status' },
      sources: { title: 'News Sources', subtitle: 'Configured RSS feeds and ScrapeGraphAI web sources' },
      queue: { title: 'Local Queue Viewer', subtitle: 'Prepared content for Instagram and LinkedIn manual posting' },
      media: { title: 'Media Catalog & Studio', subtitle: 'Visual catalog of Gemini AI generated slides & 1-click posting' },
      pipeline: { title: 'Pipeline Flow & History', subtitle: 'n8n-style agentic workflow node visualizer & saved execution logs' },
      logs: { title: 'System Execution Logs', subtitle: 'Live terminal stream from pipeline.log' },
      settings: { title: 'API Keys & Configuration', subtitle: 'Manage Gemini, Reddit, Twitter, Instagram & LinkedIn credentials' }
    };

    const header = pageTitles[page] || pageTitles.dashboard;
    document.getElementById('page-title').textContent = header.title;
    document.getElementById('page-subtitle').textContent = header.subtitle;

    const container = document.getElementById('page-container');
    container.innerHTML = '<div class="glass-card"><p>Loading page content...</p></div>';

    if (page === 'dashboard' && typeof DashboardPage !== 'undefined') {
      DashboardPage.render(container);
    } else if (page === 'articles' && typeof ArticlesPage !== 'undefined') {
      ArticlesPage.render(container);
    } else if (page === 'sources' && typeof SourcesPage !== 'undefined') {
      SourcesPage.render(container);
    } else if (page === 'queue' && typeof QueuePage !== 'undefined') {
      QueuePage.render(container);
    } else if (page === 'media' && typeof MediaPage !== 'undefined') {
      MediaPage.render(container);
    } else if (page === 'pipeline' && typeof PipelinePage !== 'undefined') {
      PipelinePage.render(container);
    } else if (page === 'logs' && typeof LogsPage !== 'undefined') {
      LogsPage.render(container);
    } else if (page === 'settings' && typeof SettingsPage !== 'undefined') {
      SettingsPage.render(container);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  async fetchApi(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error (${url}):`, err);
      this.showToast(`API Request Failed: ${err.message}`, 'error');
      throw err;
    }
  },

  async triggerPipeline() {
    if (this.pipelineRunning) {
      return this.stopPipeline();
    }

    try {
      const res = await this.fetchApi('/api/pipeline/run', { method: 'POST' });
      this.showToast(res.message || 'Pipeline started!', 'success');
      this.pipelineRunning = true;
      this.updatePipelineButtonState();
      this.checkPipelineStatus();
    } catch (err) {
      this.showToast('Failed to trigger pipeline', 'error');
    }
  },

  async stopPipeline() {
    try {
      const res = await fetch('/api/pipeline/stop', { method: 'POST' });
      if (res.status === 405 || res.status === 404) {
        this.showToast('Server update needed: Please restart "python dashboard.py" in your terminal window once!', 'warning');
        this.pipelineRunning = false;
        this.updatePipelineButtonState();
        return;
      }
      const data = await res.json();
      this.showToast(data.message || 'Pipeline execution stopped!', 'info');
      this.pipelineRunning = false;
      this.updatePipelineButtonState();
    } catch (err) {
      this.showToast(`Stop request: ${err.message}`, 'error');
      this.pipelineRunning = false;
      this.updatePipelineButtonState();
    }
  },

  updatePipelineButtonState() {
    const runBtn = document.getElementById('run-pipeline-btn');
    if (!runBtn) return;

    if (this.pipelineRunning) {
      runBtn.innerHTML = '<i data-lucide="square"></i> 🛑 Stop Pipeline';
      runBtn.style.background = '#c62828';
      runBtn.style.color = '#ffffff';
    } else {
      runBtn.innerHTML = '<i data-lucide="play"></i> Run Pipeline';
      runBtn.style.background = 'var(--primary-purple)';
      runBtn.style.color = '#ffffff';
    }
    if (window.lucide) window.lucide.createIcons();
  },

  async checkPipelineStatus() {
    try {
      const res = await fetch('/api/pipeline/status');
      if (!res.ok) return;
      const data = await res.json();
      
      const dot = document.querySelector('.dot-pulse');
      const text = document.getElementById('pipeline-status-text');

      if (data.is_running) {
        this.pipelineRunning = true;
        if (dot) dot.className = 'dot-pulse running';
        if (text) text.textContent = 'Pipeline Running...';
        this.updatePipelineButtonState();
      } else {
        if (this.pipelineRunning) {
          this.showToast('Pipeline run completed!', 'success');
          this.navigateTo(this.currentPage, false);
        }
        this.pipelineRunning = false;
        if (dot) dot.className = 'dot-pulse green';
        if (text) text.textContent = data.last_run ? `Last run: ${new Date(data.last_run).toLocaleTimeString()}` : 'Idle (Ready)';
        this.updatePipelineButtonState();
      }
    } catch (e) {
      console.warn("Status check failed", e);
    }
  },

  formatTimestamp(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      let formattedStr = dateStr;
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
        formattedStr += 'Z';
      }
      const d = new Date(formattedStr);
      if (isNaN(d.getTime())) return dateStr;

      const datePart = d.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const timePart = d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      return `${datePart} at ${timePart} IST`;
    } catch (e) {
      return dateStr;
    }
  },

  async openArticleModal(articleId) {
    const modal = document.getElementById('article-modal');
    const body = document.getElementById('modal-article-body');
    const title = document.getElementById('modal-article-title');
    const meta = document.getElementById('modal-article-meta');
    const badge = document.getElementById('modal-status-badge');

    body.innerHTML = '<p>Loading article details...</p>';
    modal.classList.add('active');

    try {
      const data = await this.fetchApi(`/api/articles/${articleId}`);
      
      title.textContent = data.title;
      meta.textContent = `${data.source} • Scraped: ${this.formatTimestamp(data.scraped_at)} • Category: ${data.category || 'General'}`;
      badge.textContent = data.status;
      badge.className = `badge badge-${data.status.toLowerCase()}`;

      let html = '';

      if (data.image_url) {
        html += `
          <div class="modal-section">
            <h4>Generated Thumbnail Image</h4>
            <div class="queue-img-wrapper" style="height: 240px;">
              <img src="${data.image_url}" alt="Article Thumbnail" />
            </div>
          </div>
        `;
      }

      html += `
        <div class="modal-section">
          <h4>Social Media Platforms Rewrites</h4>
          
          <div class="platform-preview-box">
            <strong style="color: var(--color-twitter);">Twitter / X (Text Only)</strong>
            <p style="margin-top: 6px;">${data.ai_content.twitter_text || 'Not generated yet'}</p>
          </div>

          <div class="platform-preview-box">
            <strong style="color: var(--color-reddit);">Reddit Post</strong>
            <p style="margin-top: 6px; font-weight: 600;">Title: ${data.ai_content.reddit_title || 'N/A'}</p>
            <p style="margin-top: 4px;">${data.ai_content.reddit_body || 'N/A'}</p>
          </div>

          <div class="platform-preview-box">
            <strong style="color: var(--color-instagram);">Instagram Caption</strong>
            <p style="margin-top: 6px;">${data.ai_content.instagram_caption || 'N/A'}</p>
          </div>

          <div class="platform-preview-box">
            <strong style="color: var(--color-linkedin);">LinkedIn Post</strong>
            <p style="margin-top: 6px;">${data.ai_content.linkedin_text || 'N/A'}</p>
          </div>
        </div>

        <div class="modal-section">
          <h4>Original Full Body Text</h4>
          <div class="queue-content-text" style="max-height: 200px;">${data.body}</div>
        </div>
      `;

      body.innerHTML = html;
    } catch (err) {
      body.innerHTML = '<p class="error">Failed to load article details.</p>';
    }
  },

  closeModal() {
    const modal = document.getElementById('article-modal');
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      background: var(--bg-card); border: 1px solid var(--border-color);
      padding: 12px 20px; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease;
      display: flex; align-items: center; gap: 8px; color: var(--text-main);
    `;

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `<i data-lucide="${icon}" style="width: 16px;"></i> ${message}`;

    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Initialize App on DOM load
document.addEventListener('DOMContentLoaded', () => App.init());
