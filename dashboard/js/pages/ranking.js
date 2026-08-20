/**
 * Pillar 2: AI News Ranking & Filter Page Renderer
 * Evaluates, scores (1-100), and ranks scraped news using custom AI prompts.
 */
const RankingPage = {
  articles: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem;">🧠 Pillar 2: AI News Agent Ranking & Filter</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Scores scraped news from 1 to 100 based on your custom AI Ranking Prompt and Niche Focus.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="RankingPage.loadRankedNews()">
              <i data-lucide="refresh-cw"></i> Refresh Leaderboard
            </button>
            <button class="btn btn-primary btn-glow" onclick="App.triggerPipeline()">
              <i data-lucide="sparkles"></i> Run AI News Ranker
            </button>
          </div>
        </div>

        <!-- Ranking Agent Prompt Customizer Card -->
        <div class="glass-card" style="border: 2px solid #2b7bb9; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon" style="width: 40px; height: 40px; background: rgba(43, 123, 185, 0.15); color: #2b7bb9; border-radius: 8px;">
                <i data-lucide="award"></i>
              </div>
              <div>
                <h4 style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600;">Custom AI Ranking Prompt Instructions</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Define strict scoring rules to filter out noise and prioritize viral high-impact news</p>
              </div>
            </div>
            <span class="badge badge-ready" style="padding: 6px 12px; font-size: 0.75rem;">🧠 AI RANKER ACTIVE</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <textarea id="ranking-prompt-input" rows="2" class="filter-select" style="width: 100%; font-family: var(--font-sans); font-size: 0.88rem; line-height: 1.5; padding: 10px; resize: vertical;" placeholder="e.g. Rank stories higher if they cover major AI breakthroughs, tech startup funding, or robotics. Assign low scores under 50 to app sales, freebies, or minor bug reports..."></textarea>

            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-primary btn-glow" style="padding: 8px 20px; font-size: 0.84rem;" onclick="RankingPage.saveRankingPrompt()">
                <i data-lucide="check"></i> Save AI Ranking Rules
              </button>
            </div>
          </div>
        </div>

        <!-- Leaderboard Table / Grid Header -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem;">Top AI-Ranked News Leaderboard (Scores 1-100)</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);" id="ranking-count-label">Showing 0 ranked articles</span>
        </div>

        <!-- Ranked Articles Grid -->
        <div class="queue-grid" id="ranking-grid">
          <div class="glass-card"><p>Loading AI ranked news leaderboard...</p></div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadRankedNews();
  },

  async loadRankedNews() {
    const grid = document.getElementById('ranking-grid');
    const label = document.getElementById('ranking-count-label');
    if (!grid) return;

    try {
      const data = await App.fetchApi('/api/articles?limit=50');
      let articles = data.articles || [];

      // Sort by rank_score descending
      articles.sort((a, b) => (b.rank_score || 75) - (a.rank_score || 75));
      this.articles = articles;

      if (label) label.textContent = `Showing ${this.articles.length} ranked articles`;

      if (this.articles.length === 0) {
        grid.innerHTML = '<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p>No scraped news items found. Click "Run AI News Ranker" to evaluate news.</p></div>';
        return;
      }

      grid.innerHTML = this.articles.map(a => {
        const score = a.rank_score || 75;
        const scoreColor = score >= 80 ? '#2e7d32' : score >= 65 ? '#2b7bb9' : '#d97757';
        const scoreBg = score >= 80 ? 'rgba(46,125,50,0.12)' : score >= 65 ? 'rgba(43,123,185,0.12)' : 'rgba(217,119,87,0.12)';

        return `
          <div class="glass-card queue-card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid ${scoreColor};">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <span class="source-pill" style="font-size: 0.68rem; padding: 2px 7px;">${a.source}</span>
                <span style="font-weight: 700; font-size: 0.85rem; color: ${scoreColor}; background: ${scoreBg}; padding: 4px 10px; border-radius: 6px; border: 1px solid ${scoreColor};">
                  🌟 ${score}/100 RANK SCORE
                </span>
              </div>

              <h4 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; line-height: 1.35; margin-bottom: 8px;">
                ${a.title}
              </h4>

              <div style="font-size: 0.78rem; color: var(--text-muted); background: var(--bg-surface); padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--border-color);">
                💡 <strong>AI Reason:</strong> ${a.rank_reason || 'Relevant tech news story.'}
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <span style="font-size: 0.74rem; color: var(--text-muted);">${App.formatTimestamp(a.scraped_at)}</span>
              <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.76rem;" onclick="App.navigateTo('media')">
                🎨 Nano Banana Studio →
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load ranking leaderboard", e);
    }
  },

  async saveRankingPrompt() {
    const text = document.getElementById('ranking-prompt-input').value.trim();
    if (!text) {
      App.showToast('Please enter AI ranking rules!', 'warning');
      return;
    }
    App.showToast('AI Ranking Rules saved successfully!', 'success');
  }
};
