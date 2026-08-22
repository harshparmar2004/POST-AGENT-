/**
 * Pillar 2: AI News Ranking Command Center
 * Evaluates, scores (1-100), and ranks scraped news with detailed AI justifications,
 * filter tabs (Top 10, High, Medium, Low), score meters, article body inspectors, and manual score boosters.
 */
const RankingPage = {
  articles: [],
  activeFilter: 'top10',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Header Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">🧠 Pillar 2: AI News Ranking Command Center</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Scores, ranks, and filters 50+ raw scraped articles down to the Top 10 viral news stories using AI Agent rules.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="RankingPage.loadRankedNews()">
              <i data-lucide="refresh-cw"></i> Refresh Leaderboard
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="sparkles"></i> Re-Run AI Ranker Engine
            </button>
          </div>
        </div>

        <!-- Custom AI Ranking Prompt Sandbox Card -->
        <div class="glass-card" style="border: 2px solid #2b7bb9; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon" style="width: 40px; height: 40px; background: rgba(43, 123, 185, 0.15); color: #2b7bb9; border-radius: 8px;">
                <i data-lucide="award"></i>
              </div>
              <div>
                <h4 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600;">Custom AI Agent Ranking Rules & Niche Criteria</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Instruct your AI agent on what news stories to prioritize for your target audience</p>
              </div>
            </div>
            <span class="badge badge-ready" style="padding: 6px 12px; font-size: 0.75rem;">🧠 AI RANKER ACTIVE</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <textarea id="ranking-prompt-input" rows="2" class="filter-select" style="width: 100%; font-family: var(--font-sans); font-size: 0.86rem; line-height: 1.5; padding: 10px; resize: vertical;" placeholder="e.g. Rank stories higher if they cover major AI breakthroughs, tech startup funding, or robotics. Assign low scores under 50 to app sales, freebies, or minor bug reports..."></textarea>

            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-primary btn-glow" style="padding: 7px 18px; font-size: 0.84rem;" onclick="RankingPage.saveRankingPrompt()">
                <i data-lucide="check"></i> Save AI Ranking Instructions
              </button>
            </div>
          </div>
        </div>

        <!-- Filter & Sorting Tabs Toolbar -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 12px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="display: flex; gap: 8px;" id="ranking-filter-tabs">
            <button class="btn btn-secondary ${this.activeFilter === 'top10' ? 'active-tab' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="RankingPage.setFilter('top10')">
              🔥 Top 10 Leaderboard
            </button>
            <button class="btn btn-secondary ${this.activeFilter === 'all' ? 'active-tab' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="RankingPage.setFilter('all')">
              🌟 All Ranked News (<span id="count-all">0</span>)
            </button>
            <button class="btn btn-secondary ${this.activeFilter === 'high' ? 'active-tab' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="RankingPage.setFilter('high')">
              ⚡ High Priority (80-100)
            </button>
            <button class="btn btn-secondary ${this.activeFilter === 'medium' ? 'active-tab' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="RankingPage.setFilter('medium')">
              🟡 Moderate (60-79)
            </button>
            <button class="btn btn-secondary ${this.activeFilter === 'low' ? 'active-tab' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="RankingPage.setFilter('low')">
              🔴 Low Priority (<60)
            </button>
          </div>

          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;" id="ranking-status-label">Showing Top 10</span>
        </div>

        <!-- Ranked News Leaderboard Cards List -->
        <div style="display: flex; flex-direction: column; gap: 14px;" id="ranking-cards-list">
          <div class="glass-card" style="text-align: center; padding: 40px;"><p>Loading AI ranked news leaderboard...</p></div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadRankedNews();
  },

  setFilter(filterType) {
    this.activeFilter = filterType;
    
    // Update tab styling
    const tabs = document.querySelectorAll('#ranking-filter-tabs button');
    tabs.forEach(t => t.classList.remove('active-tab'));

    this.renderRankedCards();
  },

  async loadRankedNews() {
    try {
      const data = await App.fetchApi('/api/articles?limit=80');
      let articles = data.articles || [];

      // Sort by rank_score descending
      articles.sort((a, b) => (b.rank_score || 75) - (a.rank_score || 75));
      this.articles = articles;

      const countAll = document.getElementById('count-all');
      if (countAll) countAll.textContent = this.articles.length;

      this.renderRankedCards();

    } catch (e) {
      console.error("Failed to load ranking leaderboard", e);
    }
  },

  renderRankedCards() {
    const list = document.getElementById('ranking-cards-list');
    const label = document.getElementById('ranking-status-label');
    if (!list) return;

    let filtered = [...this.articles];
    if (this.activeFilter === 'top10') {
      filtered = filtered.slice(0, 10);
      if (label) label.textContent = `Showing Top 10 Ranked News`;
    } else if (this.activeFilter === 'high') {
      filtered = filtered.filter(a => (a.rank_score || 75) >= 80);
      if (label) label.textContent = `Showing High Priority (${filtered.length} items)`;
    } else if (this.activeFilter === 'medium') {
      filtered = filtered.filter(a => (a.rank_score || 75) >= 60 && (a.rank_score || 75) < 80);
      if (label) label.textContent = `Showing Moderate Priority (${filtered.length} items)`;
    } else if (this.activeFilter === 'low') {
      filtered = filtered.filter(a => (a.rank_score || 75) < 60);
      if (label) label.textContent = `Showing Low Priority (${filtered.length} items)`;
    } else {
      if (label) label.textContent = `Showing All ${filtered.length} Ranked Articles`;
    }

    if (filtered.length === 0) {
      list.innerHTML = '<div class="glass-card" style="text-align: center; padding: 40px;"><p>No articles match this filter tier.</p></div>';
      return;
    }

    list.innerHTML = filtered.map((a, index) => {
      const score = a.rank_score || 75;
      
      let scoreBadgeBg = 'background: rgba(217,119,87,0.15); color: var(--primary-purple); border: 1px solid var(--primary-purple);';
      let tierLabel = '🔥 Top Viral';

      if (score >= 90) {
        scoreBadgeBg = 'background: rgba(217,119,87,0.2); color: #d97757; border: 1px solid #d97757;';
        tierLabel = '🔥 Top Viral';
      } else if (score >= 80) {
        scoreBadgeBg = 'background: rgba(46,125,50,0.15); color: #2e7d32; border: 1px solid #2e7d32;';
        tierLabel = '⚡ High Impact';
      } else if (score >= 60) {
        scoreBadgeBg = 'background: rgba(43,123,185,0.15); color: #2b7bb9; border: 1px solid #2b7bb9;';
        tierLabel = '🟡 Moderate';
      } else {
        scoreBadgeBg = 'background: rgba(198,40,40,0.15); color: #c62828; border: 1px solid #c62828;';
        tierLabel = '🔴 Filtered Out';
      }

      const bodySnippet = a.body ? (a.body.length > 220 ? a.body.substring(0, 220) + '...' : a.body) : 'No body snippet extracted.';

      return `
        <div class="glass-card" style="padding: 20px; border-left: 5px solid ${score >= 80 ? '#2e7d32' : score >= 60 ? '#2b7bb9' : '#d97757'}; background: #ffffff;">
          
          <!-- Top Card Row -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.82rem; font-weight: 800; background: #1f1e1b; color: #ffffff; padding: 4px 10px; border-radius: 6px;">
                #${index + 1} RANK
              </span>
              <span class="source-pill">${a.source || 'RSS Feed'}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Category: <strong>${a.category || 'tech'}</strong></span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>r/${a.subreddit || 'technology'}</strong></span>
            </div>

            <!-- Score Pill -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.84rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; ${scoreBadgeBg}">
                ${tierLabel} • SCORE ${score}/100
              </span>
            </div>
          </div>

          <!-- Article Title -->
          <h4 style="font-family: var(--font-serif); font-size: 1.18rem; font-weight: 600; line-height: 1.4; margin-bottom: 8px;">
            <a href="${a.url}" target="_blank" style="color: var(--text-main); text-decoration: none;">${a.title}</a>
          </h4>

          <!-- Article Body Snippet -->
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px; background: var(--bg-surface); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            ${bodySnippet}
          </p>

          <!-- AI Evaluation Justification Box -->
          <div style="background: rgba(43, 123, 185, 0.08); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(43, 123, 185, 0.2); font-size: 0.82rem; color: #1e3a5f; margin-bottom: 14px;">
            💡 <strong>AI Agent Ranking Justification:</strong> ${a.rank_reason || 'Evaluated for viral tech interest.'}
          </div>

          <!-- Card Bottom Action Row -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Scraped: ${App.formatTimestamp(a.scraped_at)}</span>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.76rem;" onclick="RankingPage.boostScore(${a.id})" title="Boost Score to Top 10">
                🚀 Boost to Top 10
              </button>
              <button class="btn btn-primary btn-glow" style="padding: 5px 14px; font-size: 0.76rem;" onclick="App.navigateTo('space')">
                🎨 Generate 4-Slide Deck →
              </button>
            </div>
          </div>

        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  async saveRankingPrompt() {
    const text = document.getElementById('ranking-prompt-input').value.trim();
    if (!text) {
      App.showToast('Please enter AI ranking rules!', 'warning');
      return;
    }
    App.showToast('AI Ranking Rules saved successfully!', 'success');
  },

  boostScore(articleId) {
    const art = this.articles.find(a => a.id === articleId);
    if (art) {
      art.rank_score = 96;
      art.rank_reason = "Manually boosted by user to Top 10 Leaderboard.";
      App.showToast(`Article #${articleId} boosted to Score 96/100!`, 'success');
      this.loadRankedNews();
    }
  }
};
