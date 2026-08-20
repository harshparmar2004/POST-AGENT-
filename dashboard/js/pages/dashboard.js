/**
 * Dashboard Overview Page Renderer
 */
const DashboardPage = {
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

      <!-- Charts Section -->
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

      <!-- Recent Articles Table -->
      <div class="glass-card table-card">
        <div class="table-header-tools">
          <h3 style="font-size: 1.05rem; font-weight: 600;">Recent Scraped Articles</h3>
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
            <tr><td colspan="5">Loading recent articles...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    // Re-create icons for freshly inserted DOM
    if (window.lucide) window.lucide.createIcons();

    // Fetch data and render charts
    await this.loadData();
  },

  async loadData() {
    try {
      const stats = await App.fetchApi('/api/stats');
      const timeline = await App.fetchApi('/api/stats/timeline?days=14');
      const articles = await App.fetchApi('/api/articles?limit=8');

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

      // Render Timeline Chart
      this.renderTimelineChart(timeline);

      // Render Platform Chart
      this.renderPlatformChart(stats.platforms);

      // Render Table
      this.renderRecentTable(articles.articles);

    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
  },

  renderTimelineChart(data) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total Scraped',
            data: data.totals,
            borderColor: '#d97757',
            backgroundColor: 'rgba(217, 119, 87, 0.12)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Published',
            data: data.published,
            borderColor: '#2e7d32',
            backgroundColor: 'transparent',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6e6b65', font: { family: 'Inter' } } }
        },
        scales: {
          x: { grid: { color: '#eae5dd' }, ticks: { color: '#6e6b65' } },
          y: { grid: { color: '#eae5dd' }, ticks: { color: '#6e6b65', precision: 0 } }
        }
      }
    });
  },

  renderPlatformChart(platforms) {
    const ctx = document.getElementById('platformChart');
    if (!ctx) return;

    new Chart(ctx, {
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

  renderRecentTable(articles) {
    const tbody = document.getElementById('recent-articles-tbody');
    if (!tbody) return;

    if (!articles || articles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No articles scraped yet. Click "Run Pipeline" above!</td></tr>';
      return;
    }

    tbody.innerHTML = articles.map(a => `
      <tr onclick="App.openArticleModal(${a.id})">
        <td class="article-title-cell">${a.title}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06); color: #e5e7eb;">${a.source}</span></td>
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
