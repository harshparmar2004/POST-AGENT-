/**
 * Articles Vault Renderer — Interactive Box Card Grid System
 * Each scraped article is displayed in a clean, readable card box with full title,
 * body excerpt, AI Rank Score, platform chips, and click-to-open detail modal.
 */
const ArticlesPage = {
  currentPageNum: 1,
  currentStatus: 'all',
  currentSearch: '',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Search & Filter Controls Toolbar -->
        <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px;">
          <div class="search-box" style="position: relative; flex: 1; max-width: 480px;">
            <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); width: 18px; height: 18px; pointer-events: none;"></i>
            <input type="text" id="articles-search-input" placeholder="Search scraped headlines, body text, or sources..." value="${this.currentSearch}" style="width: 100%; padding: 10px 14px 10px 42px; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.88rem; outline: none;">
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <select id="status-filter-select" class="filter-select" style="padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">
              <option value="all" ${this.currentStatus === 'all' ? 'selected' : ''}>All Scraped Articles</option>
              <option value="ready" ${this.currentStatus === 'ready' ? 'selected' : ''}>Ready for Posting</option>
              <option value="scraped" ${this.currentStatus === 'scraped' ? 'selected' : ''}>Scraped Only</option>
              <option value="published" ${this.currentStatus === 'published' ? 'selected' : ''}>Published Live</option>
            </select>
          </div>
        </div>

        <!-- Articles Grid of Box Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px;" id="articles-boxes-grid">
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>Loading scraped articles vault...</p></div>
        </div>

        <!-- Pagination Controls -->
        <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px;">
          <span style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600;" id="pagination-info">Page 1 of 1</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="prev-page-btn" style="padding: 7px 16px; font-size: 0.82rem;">← Previous</button>
            <button class="btn btn-secondary" id="next-page-btn" style="padding: 7px 16px; font-size: 0.82rem;">Next →</button>
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
    const grid = document.getElementById('articles-boxes-grid');
    const info = document.getElementById('pagination-info');
    if (!grid) return;

    try {
      let url = `/api/articles?page=${this.currentPageNum}&limit=12`;
      if (this.currentStatus !== 'all') url += `&status=${this.currentStatus}`;
      if (this.currentSearch) url += `&search=${encodeURIComponent(this.currentSearch)}`;

      const data = await App.fetchApi(url);
      const articles = data.articles;
      const pag = data.pagination;

      if (info) {
        info.textContent = `Page ${pag.page} of ${pag.total_pages} (${pag.total} total scraped articles)`;
      }

      if (!articles || articles.length === 0) {
        grid.innerHTML = '<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>No articles found in vault. Run the web scraper to ingest articles.</p></div>';
        return;
      }

      grid.innerHTML = articles.map(a => {
        const isReddit = a.platforms && a.platforms.reddit;
        const isTwitter = a.platforms && a.platforms.twitter;
        const isInsta = a.platforms && a.platforms.instagram;
        const isLinkedIn = a.platforms && a.platforms.linkedin;

        const score = a.rank_score || 75;
        const scoreColor = score >= 80 ? '#2e7d32' : score >= 60 ? '#2b7bb9' : '#d97757';
        const bodySnippet = a.body ? (a.body.length > 180 ? a.body.substring(0, 180) + '...' : a.body) : 'Scraped headline available.';

        return `
          <div class="glass-card article-box-card" onclick="App.openArticleModal(${a.id})">
            
            <!-- Box Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="source-pill">${a.source}</span>
                <span class="badge badge-${a.status}">${a.status.toUpperCase()}</span>
              </div>
              <span style="font-size: 0.78rem; font-weight: 700; color: ${scoreColor}; background: var(--bg-surface); padding: 3px 8px; border-radius: 4px; border: 1px solid ${scoreColor};">
                ★ ${score}/100
              </span>
            </div>

            <!-- Box Headline -->
            <h4 class="article-box-title">
              ${a.title}
            </h4>

            <!-- Box Body Snippet -->
            <p class="article-box-body">
              ${bodySnippet}
            </p>

            <!-- Box Footer: Platforms & Actions -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              
              <!-- Social Chips -->
              <div class="platform-chips">
                <span class="platform-chip reddit ${isReddit ? 'active' : ''}" title="Reddit">
                  <i data-lucide="message-square"></i>
                </span>
                <span class="platform-chip twitter ${isTwitter ? 'active' : ''}" title="Twitter/X">
                  <i data-lucide="share-2"></i>
                </span>
                <span class="platform-chip instagram ${isInsta ? 'active' : ''}" title="Instagram">
                  <i data-lucide="camera"></i>
                </span>
                <span class="platform-chip linkedin ${isLinkedIn ? 'active' : ''}" title="LinkedIn">
                  <i data-lucide="briefcase"></i>
                </span>
              </div>

              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.75rem; color: var(--primary-purple); font-weight: 600;">Inspect Box 🔍</span>
                <button class="btn-icon danger" style="width: 28px; height: 28px;" onclick="ArticlesPage.deleteArticle(${a.id}, event)" title="Delete Article">
                  <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                </button>
              </div>

            </div>

          </div>
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
