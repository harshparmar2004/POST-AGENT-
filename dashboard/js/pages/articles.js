/**
 * Articles Page Renderer — Searchable, filterable table with high-contrast UI & social logos
 */
const ArticlesPage = {
  currentPageNum: 1,
  currentStatus: 'all',
  currentSearch: '',

  async render(container) {
    container.innerHTML = `
      <div class="glass-card table-card">
        <div class="table-header-tools" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px;">
          <div class="search-box" style="position: relative; flex: 1; max-width: 480px;">
            <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); width: 18px; height: 18px; pointer-events: none;"></i>
            <input type="text" id="articles-search-input" placeholder="Search headlines, body text or sources..." value="${this.currentSearch}" style="width: 100%; padding: 10px 14px 10px 42px; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.88rem; outline: none;">
          </div>

          <div style="display: flex; gap: 10px;">
            <select id="status-filter-select" class="filter-select" style="padding: 10px 16px; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
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
              <th style="width: 38%;">HEADLINE</th>
              <th style="width: 15%;">SOURCE</th>
              <th style="width: 12%;">STATUS</th>
              <th style="width: 15%;">PLATFORMS</th>
              <th style="width: 14%;">SCRAPED AT</th>
              <th style="width: 6%; text-align: center;">ACTION</th>
            </tr>
          </thead>
          <tbody id="articles-tbody">
            <tr><td colspan="6" style="text-align: center; padding: 30px;">Loading articles...</td></tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-color);">
          <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;" id="pagination-info">Page 1 of 1</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="prev-page-btn" style="padding: 6px 14px; font-size: 0.8rem;">← Previous</button>
            <button class="btn btn-secondary" id="next-page-btn" style="padding: 6px 14px; font-size: 0.8rem;">Next →</button>
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No articles found matching your criteria.</td></tr>';
        return;
      }

      tbody.innerHTML = articles.map(a => {
        const isReddit = a.platforms && a.platforms.reddit;
        const isTwitter = a.platforms && a.platforms.twitter;
        const isInsta = a.platforms && a.platforms.instagram;
        const isLinkedIn = a.platforms && a.platforms.linkedin;

        return `
          <tr>
            <td class="article-title-cell" onclick="App.openArticleModal(${a.id})" title="${a.title}">
              ${a.title}
            </td>
            <td onclick="App.openArticleModal(${a.id})">
              <span class="source-pill">${a.source}</span>
            </td>
            <td onclick="App.openArticleModal(${a.id})">
              <span class="badge badge-${a.status}">${a.status}</span>
            </td>
            <td onclick="App.openArticleModal(${a.id})">
              <div class="platform-chips">
                <span class="platform-chip reddit ${isReddit ? 'active' : ''}" title="Reddit (${isReddit ? 'Published' : 'Pending'})">
                  <i data-lucide="message-square"></i>
                </span>
                <span class="platform-chip twitter ${isTwitter ? 'active' : ''}" title="Twitter/X (${isTwitter ? 'Published' : 'Pending'})">
                  <i data-lucide="share-2"></i>
                </span>
                <span class="platform-chip instagram ${isInsta ? 'active' : ''}" title="Instagram (${isInsta ? 'Queued/Published' : 'Pending'})">
                  <i data-lucide="camera"></i>
                </span>
                <span class="platform-chip linkedin ${isLinkedIn ? 'active' : ''}" title="LinkedIn (${isLinkedIn ? 'Queued/Published' : 'Pending'})">
                  <i data-lucide="briefcase"></i>
                </span>
              </div>
            </td>
            <td style="color: var(--text-muted); font-size: 0.74rem; font-weight: 500;" onclick="App.openArticleModal(${a.id})">
              ${App.formatTimestamp(a.scraped_at)}
            </td>
            <td style="text-align: center;">
              <button class="btn-icon" style="color: var(--status-failed); width: 30px; height: 30px;" onclick="ArticlesPage.deleteArticle(${a.id}, event)" title="Delete Article">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

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
