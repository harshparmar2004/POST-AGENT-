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

    // Run Pipeline button handler
    const runBtn = document.getElementById('run-pipeline-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.triggerPipeline());
    }

    // Modal close handler
    const closeBtn = document.getElementById('modal-close-btn');
    const backdrop = document.querySelector('.modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

    // Initial page load
    const initialPage = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialPage);

    // Start background status polling
    this.checkPipelineStatus();
    setInterval(() => this.checkPipelineStatus(), 5000);
  },

  navigateTo(page, updateHash = true) {
    if (!['dashboard', 'articles', 'sources', 'queue', 'logs', 'settings'].includes(page)) {
      page = 'dashboard';
    }

    this.currentPage = page;
    if (updateHash) {
      window.location.hash = page;
    }

    // Update active navbar item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });

    // Update header title & subtitle
    const pageTitles = {
      dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time automation analytics and content pipeline status' },
      articles: { title: 'Articles Browser', subtitle: 'Manage scraped articles, AI rewrites, and platform status' },
      sources: { title: 'News Sources', subtitle: 'Configured RSS feeds and ScrapeGraphAI web sources' },
      queue: { title: 'Local Queue Viewer', subtitle: 'Prepared content for Instagram and LinkedIn manual posting' },
      logs: { title: 'System Execution Logs', subtitle: 'Live terminal stream from pipeline.log' },
      settings: { title: 'API Keys & Configuration', subtitle: 'Manage Gemini, Reddit, and Twitter API credentials directly from UI' }
    };

    const header = pageTitles[page] || pageTitles.dashboard;
    document.getElementById('page-title').textContent = header.title;
    document.getElementById('page-subtitle').textContent = header.subtitle;

    // Render target page
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
    } else if (page === 'logs' && typeof LogsPage !== 'undefined') {
      LogsPage.render(container);
    } else if (page === 'settings' && typeof SettingsPage !== 'undefined') {
      SettingsPage.render(container);
    }

    // Re-initialize Lucide icons
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
    const runBtn = document.getElementById('run-pipeline-btn');
    if (this.pipelineRunning) {
      this.showToast('Pipeline is already running!', 'warning');
      return;
    }

    try {
      if (runBtn) runBtn.disabled = true;
      const res = await this.fetchApi('/api/pipeline/run', { method: 'POST' });
      this.showToast(res.message || 'Pipeline started!', 'success');
      this.checkPipelineStatus();
    } catch (err) {
      this.showToast('Failed to trigger pipeline', 'error');
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
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
      } else {
        if (this.pipelineRunning) {
          // It was running, now finished
          this.showToast('Pipeline run completed!', 'success');
          // Refresh current page
          this.navigateTo(this.currentPage, false);
        }
        this.pipelineRunning = false;
        if (dot) dot.className = 'dot-pulse green';
        if (text) text.textContent = data.last_run ? `Last run: ${new Date(data.last_run).toLocaleTimeString()}` : 'Idle (Ready)';
      }
    } catch (e) {
      console.warn("Status check failed", e);
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
      meta.textContent = `${data.source} • Category: ${data.category || 'General'} • Subreddit: r/${data.subreddit || 'technology'}`;
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
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
