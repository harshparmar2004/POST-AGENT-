/**
 * Settings Page Renderer — GUI manager for API Keys and Environment settings
 */
const SettingsPage = {
  async render(container) {
    container.innerHTML = `
      <div style="max-width: 800px; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Google Gemini Settings -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="stat-icon" style="color: var(--primary-purple); background: rgba(139, 92, 246, 0.15); width: 38px; height: 38px; border-radius: 8px;">
              <i data-lucide="sparkles"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem;">Google Gemini AI (Required)</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">Used for article rewriting (Gemini 2.5 Flash) and image generation (Gemini 2.0 Flash)</p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">GOOGLE_API_KEY</label>
            <div style="display: flex; gap: 8px;">
              <input type="password" id="input-GOOGLE_API_KEY" class="filter-select" style="flex: 1;" placeholder="Enter Gemini API key (AIzaSy...)" />
              <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-GOOGLE_API_KEY')">Show/Hide</button>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-dim);">Get your free API key at: <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--primary-purple);">aistudio.google.com/apikey</a></span>
          </div>
        </div>

        <!-- Reddit API Settings -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="stat-icon" style="color: var(--color-reddit); background: rgba(255, 69, 0, 0.15); width: 38px; height: 38px; border-radius: 8px;">
              <i data-lucide="message-square"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem;">Reddit API Credentials (Live Posting)</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">Used by PRAW to auto-post articles with text and images to target subreddits</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">REDDIT_CLIENT_ID</label>
              <input type="text" id="input-REDDIT_CLIENT_ID" class="filter-select" placeholder="Client ID" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">REDDIT_CLIENT_SECRET</label>
              <input type="password" id="input-REDDIT_CLIENT_SECRET" class="filter-select" placeholder="Client Secret" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">REDDIT_USERNAME</label>
              <input type="text" id="input-REDDIT_USERNAME" class="filter-select" placeholder="Reddit Username" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">REDDIT_PASSWORD</label>
              <input type="password" id="input-REDDIT_PASSWORD" class="filter-select" placeholder="Reddit Password" />
            </div>
          </div>
        </div>

        <!-- Twitter API Settings -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="stat-icon" style="color: var(--color-twitter); background: rgba(29, 161, 242, 0.15); width: 38px; height: 38px; border-radius: 8px;">
              <i data-lucide="twitter"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem;">Twitter / X API Credentials (Live Text Tweets)</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">Used by Tweepy (Free tier) to tweet news summaries (1,500 tweets/month)</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">TWITTER_API_KEY</label>
              <input type="text" id="input-TWITTER_API_KEY" class="filter-select" placeholder="API Key" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">TWITTER_API_SECRET</label>
              <input type="password" id="input-TWITTER_API_SECRET" class="filter-select" placeholder="API Secret" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">TWITTER_ACCESS_TOKEN</label>
              <input type="text" id="input-TWITTER_ACCESS_TOKEN" class="filter-select" placeholder="Access Token" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600;">TWITTER_ACCESS_SECRET</label>
              <input type="password" id="input-TWITTER_ACCESS_SECRET" class="filter-select" placeholder="Access Secret" />
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 16px;">
          <span id="save-status-msg" style="font-size: 0.85rem; color: #10b981;"></span>
          <button class="btn btn-primary btn-glow" onclick="SettingsPage.saveSettings()">
            <i data-lucide="save"></i> Save & Apply API Keys
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await this.loadSettings();
  },

  async loadSettings() {
    try {
      const data = await App.fetchApi('/api/settings');
      const keys = data.keys;

      for (const [key, info] of Object.entries(keys)) {
        const input = document.getElementById(`input-${key}`);
        if (input && info.raw) {
          input.value = info.raw;
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  },

  async saveSettings() {
    const keys = [
      "GOOGLE_API_KEY",
      "REDDIT_CLIENT_ID",
      "REDDIT_CLIENT_SECRET",
      "REDDIT_USERNAME",
      "REDDIT_PASSWORD",
      "TWITTER_API_KEY",
      "TWITTER_API_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_SECRET",
    ];

    const payload = {};
    for (const key of keys) {
      const input = document.getElementById(`input-${key}`);
      if (input) {
        payload[key] = input.value.trim();
      }
    }

    try {
      const res = await App.fetchApi('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      App.showToast('API Keys saved successfully to .env!', 'success');
      const msg = document.getElementById('save-status-msg');
      if (msg) {
        msg.textContent = "Saved to .env & active in memory!";
        setTimeout(() => msg.textContent = "", 4000);
      }
    } catch (err) {
      App.showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  },

  toggleVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};
