/**
 * Articles Page Renderer — Searchable, filterable table with modal preview
 */
const ArticlesPage = {
  currentPageNum: 1,
  currentStatus: 'all',
  currentSearch: '',

  async render(container) {
    container.innerHTML = `
      <div class="glass-card table-card">
        <div class="table-header-tools">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" id="articles-search-input" placeholder="Search headlines, body or source..." value="${this.currentSearch}">
          </div>

          <div style="display: flex; gap: 10px;">
            <select id="status-filter-select" class="filter-select">
              <option value="all" ${this.currentStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="scraped" ${this.currentStatus === 'scraped' ? 'selected' : ''}>Scraped</option>
              <option value="ready" ${this.currentStatus === 'ready' ? 'selected' : ''}>Ready</option>
              <option value="published" ${this.currentStatus === 'published' ? 'selected' : ''}>Published</option>
              <option value="queued" ${this.currentStatus === 'queued' ? 'selected' : ''}>Queued</option>
            </select>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Headline</th>
              <th>Source</th>
              <th>Status</th>
              <th>Platforms</th>
              <th>Scraped At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="articles-tbody">
            <tr><td colspan="6">Loading articles...</td></tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px;">
          <span style="font-size: 0.85rem; color: var(--text-muted);" id="pagination-info">Page 1 of 1</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="prev-page-btn" style="padding: 6px 12px; font-size: 0.8rem;">← Previous</button>
            <button class="btn btn-secondary" id="next-page-btn" style="padding: 6px 12px; font-size: 0.8rem;">Next →</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Event listeners
    const searchInput = document.getElementById('articles-search-input');
    const statusSelect = document.getElementById('status-filter-select');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentSearch = e.target.value;
          this.currentPageNum = 1;
          this.loadArticles();
        }, 300);
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.currentStatus = e.target.value;
        this.currentPageNum = 1;
        this.loadArticles();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPageNum > 1) {
          this.currentPageNum--;
          this.loadArticles();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPageNum++;
        this.loadArticles();
      });
    }

    await this.loadArticles();
  },

  async loadArticles() {
    const tbody = document.getElementById('articles-tbody');
    const info = document.getElementById('pagination-info');
    if (!tbody) return;

    try {
      let url = `/api/articles?page=${this.currentPageNum}&limit=12`;
      if (this.currentStatus !== 'all') url += `&status=${this.currentStatus}`;
      if (this.currentSearch) url += `&search=${encodeURIComponent(this.currentSearch)}`;

      const data = await App.fetchApi(url);
      const articles = data.articles;
      const pag = data.pagination;

      if (info) {
        info.textContent = `Page ${pag.page} of ${pag.total_pages} (${pag.total} total articles)`;
      }

      if (!articles || articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No articles found matching filters.</td></tr>';
        return;
      }

      tbody.innerHTML = articles.map(a => `
        <tr>
          <td class="article-title-cell" onclick="App.openArticleModal(${a.id})">${a.title}</td>
          <td onclick="App.openArticleModal(${a.id})">
            <span class="badge" style="background: rgba(255,255,255,0.06); color: #e5e7eb;">${a.source}</span>
          </td>
          <td onclick="App.openArticleModal(${a.id})">
            <span class="badge badge-${a.status}">${a.status}</span>
          </td>
          <td onclick="App.openArticleModal(${a.id})">
            <div class="platform-chips">
              <span class="platform-chip reddit ${a.platforms.reddit ? 'active' : ''}"><i data-lucide="message-square"></i></span>
              <span class="platform-chip twitter ${a.platforms.twitter ? 'active' : ''}"><i data-lucide="twitter"></i></span>
              <span class="platform-chip instagram ${a.platforms.instagram ? 'active' : ''}"><i data-lucide="instagram"></i></span>
              <span class="platform-chip linkedin ${a.platforms.linkedin ? 'active' : ''}"><i data-lucide="linkedin"></i></span>
            </div>
          </td>
          <td style="color: var(--text-muted); font-size: 0.8rem;" onclick="App.openArticleModal(${a.id})">
            ${App.formatTimestamp(a.scraped_at)}
          </td>
          <td>
            <button class="btn-icon" style="color: var(--status-failed);" onclick="ArticlesPage.deleteArticle(${a.id}, event)" title="Delete Article">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load articles page", e);
    }
  },

  async deleteArticle(id, event) {
    if (event) event.stopPropagation();
    if (!confirm(`Are you sure you want to delete article #${id}?`)) return;

    try {
      await App.fetchApi(`/api/articles/${id}`, { method: 'DELETE' });
      App.showToast(`Deleted article #${id}`, 'info');
      this.loadArticles();
    } catch (err) {
      App.showToast(`Failed to delete article: ${err.message}`, 'error');
    }
  }
};
