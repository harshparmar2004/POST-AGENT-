/**
 * Dashboard Overview Page Renderer — Rich Visualization Features & Soft Claude Theme
 */
const DashboardPage = {
  currentDashboardFilter: 'all',
  charts: {},

  async render(container) {
    container.innerHTML = `
      <!-- Stats Cards Row -->
      <div class="stats-grid">
        <div class="glass-card stat-card total">
          <div class="stat-icon"><i data-lucide="layers"></i></div>
          <div class="stat-data">
            <h3 id="stat-total">0</h3>
            <p>Total Articles Scraped</p>
          </div>
        </div>

        <div class="glass-card stat-card scraped">
          <div class="stat-icon"><i data-lucide="database"></i></div>
          <div class="stat-data">
            <h3 id="stat-scraped">0</h3>
            <p>Scraped (Pending AI)</p>
          </div>
        </div>

        <div class="glass-card stat-card ready">
          <div class="stat-icon"><i data-lucide="sparkles"></i></div>
          <div class="stat-data">
            <h3 id="stat-ready">0</h3>
            <p>Ready (AI Rewritten)</p>
          </div>
        </div>

        <div class="glass-card stat-card published">
          <div class="stat-icon"><i data-lucide="check-circle"></i></div>
          <div class="stat-data">
            <h3 id="stat-published">0</h3>
            <p>Published / Queued</p>
          </div>
        </div>
      </div>

      <!-- Charts Section (Row 1) -->
      <div class="charts-grid">
        <div class="glass-card chart-card">
          <h3>
            <span>Articles Processing Timeline</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">Last 14 Days</span>
          </h3>
          <div class="chart-container">
            <canvas id="timelineChart"></canvas>
          </div>
        </div>

        <div class="glass-card chart-card">
          <h3>Platform Distribution</h3>
          <div class="chart-container">
            <canvas id="platformChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Visualizations Row 2: Category Breakdown & Platform Progress -->
      <div class="charts-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;">
        <div class="glass-card chart-card">
          <h3>Category Distribution</h3>
          <div class="chart-container">
            <canvas id="categoryChart"></canvas>
          </div>
        </div>

        <div class="glass-card chart-card">
          <h3>Platform Pipeline Status</h3>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;" id="platform-progress-container">
            <p>Loading platform progress...</p>
          </div>
        </div>
      </div>

      <!-- Recent Articles Table with Quick Filter Chips -->
      <div class="glass-card table-card">
        <div class="table-header-tools">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <h3 style="font-size: 1.05rem; font-weight: 600; font-family: var(--font-serif);">Recent Articles</h3>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DashboardPage.filterArticles('all')">All</button>
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DashboardPage.filterArticles('scraped')">Scraped</button>
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DashboardPage.filterArticles('ready')">Ready</button>
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DashboardPage.filterArticles('published')">Published</button>
            </div>
          </div>
          <a href="#articles" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 14px;">View All Articles →</a>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Article Headline</th>
              <th>Source</th>
              <th>Status</th>
              <th>Platforms</th>
              <th>Scraped At</th>
            </tr>
          </thead>
          <tbody id="recent-articles-tbody">
            <tr><td colspan="5">Loading articles...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadData();
  },

  async loadData() {
    try {
      const stats = await App.fetchApi('/api/stats');
      const timeline = await App.fetchApi('/api/stats/timeline?days=14');
      const articles = await App.fetchApi(`/api/articles?limit=8${this.currentDashboardFilter !== 'all' ? '&status=' + this.currentDashboardFilter : ''}`);

      // Update counters
      document.getElementById('stat-total').textContent = stats.summary.total;
      document.getElementById('stat-scraped').textContent = stats.summary.scraped;
      document.getElementById('stat-ready').textContent = stats.summary.ready;
      document.getElementById('stat-published').textContent = stats.summary.published + stats.summary.queued;

      // Update navbar badges
      const navArticles = document.getElementById('nav-count-articles');
      const navQueue = document.getElementById('nav-count-queue');
      if (navArticles) navArticles.textContent = stats.summary.total;
      if (navQueue) navQueue.textContent = stats.summary.queued;

      // Render Charts safely
      this.renderTimelineChart(timeline);
      this.renderPlatformChart(stats.platforms);
      this.renderCategoryChart(stats.categories);
      this.renderPlatformProgress(stats.platforms, stats.summary.total);

      // Render Table
      this.renderRecentTable(articles.articles);

    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
  },

  renderTimelineChart(data) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    if (this.charts.timeline) this.charts.timeline.destroy();

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total Scraped',
            data: data.totals,
            borderColor: '#d97757',
            backgroundColor: 'rgba(217, 119, 87, 0.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Published',
            data: data.published,
            borderColor: '#2e7d32',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6e6b65', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: '#e5e0d8' }, ticks: { color: '#6e6b65' } },
          y: { grid: { color: '#e5e0d8' }, ticks: { color: '#6e6b65', precision: 0 } }
        }
      }
    });
  },

  renderPlatformChart(platforms) {
    const ctx = document.getElementById('platformChart');
    if (!ctx) return;
    if (this.charts.platform) this.charts.platform.destroy();

    this.charts.platform = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Reddit (Live)', 'Twitter (Live)', 'Instagram (Queue)', 'LinkedIn (Queue)'],
        datasets: [{
          data: [platforms.reddit, platforms.twitter, platforms.instagram, platforms.linkedin],
          backgroundColor: ['#e05326', '#2b7bb9', '#c13584', '#0077b5'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#6e6b65', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  },

  renderCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    if (this.charts.category) this.charts.category.destroy();

    const labels = Object.keys(categories || {});
    const values = Object.values(categories || {});

    this.charts.category = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Tech', 'General', 'AI'],
        datasets: [{
          label: 'Articles',
          data: values.length ? values : [0, 0, 0],
          backgroundColor: '#d97757',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6e6b65' } },
          y: { grid: { color: '#e5e0d8' }, ticks: { color: '#6e6b65', precision: 0 } }
        }
      }
    });
  },

  renderPlatformProgress(platforms, totalArticles) {
    const container = document.getElementById('platform-progress-container');
    if (!container) return;

    const total = totalArticles || 1;
    const items = [
      { name: 'Reddit Live Posts', count: platforms.reddit, color: '#e05326' },
      { name: 'Twitter / X Live Tweets', count: platforms.twitter, color: '#2b7bb9' },
      { name: 'Instagram Queued Posts', count: platforms.instagram, color: '#c13584' },
      { name: 'LinkedIn Queued Posts', count: platforms.linkedin, color: '#0077b5' },
    ];

    container.innerHTML = items.map(item => {
      const pct = Math.min(100, Math.round((item.count / total) * 100));
      return `
        <div class="progress-bar-wrapper">
          <div class="progress-bar-header">
            <span><strong>${item.name}</strong></span>
            <span style="color: var(--text-muted);">${item.count} posts (${pct}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${item.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterArticles(status) {
    this.currentDashboardFilter = status;
    this.loadData();
  },

  renderRecentTable(articles) {
    const tbody = document.getElementById('recent-articles-tbody');
    if (!tbody) return;

    if (!articles || articles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No articles found. Click "Run Pipeline" above!</td></tr>';
      return;
    }

    tbody.innerHTML = articles.map(a => `
      <tr onclick="App.openArticleModal(${a.id})">
        <td class="article-title-cell">${a.title}</td>
        <td><span class="badge" style="background: rgba(31,30,27,0.06); color: var(--text-main);">${a.source}</span></td>
        <td><span class="badge badge-${a.status}">${a.status}</span></td>
        <td>
          <div class="platform-chips">
            <span class="platform-chip reddit ${a.platforms.reddit ? 'active' : ''}"><i data-lucide="message-square"></i></span>
            <span class="platform-chip twitter ${a.platforms.twitter ? 'active' : ''}"><i data-lucide="twitter"></i></span>
            <span class="platform-chip instagram ${a.platforms.instagram ? 'active' : ''}"><i data-lucide="instagram"></i></span>
            <span class="platform-chip linkedin ${a.platforms.linkedin ? 'active' : ''}"><i data-lucide="linkedin"></i></span>
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">
          ${a.scraped_at ? new Date(a.scraped_at).toLocaleTimeString() : 'N/A'}
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }
};
