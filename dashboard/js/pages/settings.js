/**
 * Settings Page Renderer — Simplified, Step-by-Step Centered Layout for API Credentials
 */
const SettingsPage = {
  async render(container) {
    container.innerHTML = `
      <div style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 20px 24px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.3rem;">API Credentials Setup</h3>
            <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 2px;">
              Configure your AI key and social media accounts step by step.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <span id="save-status-msg" style="font-size: 0.85rem; color: #2e7d32; font-weight: 600;"></span>
            <button class="btn btn-primary btn-glow" onclick="SettingsPage.saveSettings()">
              <i data-lucide="zap"></i> Activate & Save All Keys
            </button>
          </div>
        </div>

        <!-- Step 1: Google Gemini AI (Required) -->
        <div class="glass-card" style="position: relative;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--primary-purple); background: rgba(217, 119, 87, 0.12); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="sparkles"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">1. Google Gemini AI (Required)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Powers article rewriting & thumbnail image generation</p>
              </div>
            </div>
            <span class="badge badge-scraped" style="font-size: 0.7rem;">REQUIRED</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 0.84rem; font-weight: 600;">GOOGLE_API_KEY</label>
            <div style="display: flex; gap: 10px;">
              <input type="password" id="input-GOOGLE_API_KEY" class="filter-select" style="flex: 1;" placeholder="Enter Gemini API key (AIzaSy...)" />
              <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-GOOGLE_API_KEY')">Show/Hide</button>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-dim); margin-top: 2px;">
              Get your free key at: <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--primary-purple); font-weight: 600;">aistudio.google.com/apikey</a>
            </span>
          </div>
        </div>

        <!-- Step 2: Instagram Graph API -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--color-instagram); background: rgba(193, 53, 132, 0.12); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="instagram"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">2. Instagram Graph API (Auto-Upload Post)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Live auto-posting. Leave empty to use local queue folder.</p>
              </div>
            </div>
            <span class="badge" style="font-size: 0.7rem; background: rgba(31,30,27,0.06); color: var(--text-muted);">OPTIONAL</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">INSTAGRAM_ACCESS_TOKEN</label>
              <input type="password" id="input-INSTAGRAM_ACCESS_TOKEN" class="filter-select" placeholder="Meta Graph API Token" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">INSTAGRAM_ACCOUNT_ID</label>
              <input type="text" id="input-INSTAGRAM_ACCOUNT_ID" class="filter-select" placeholder="Business Account ID" />
            </div>
          </div>
        </div>

        <!-- Step 3: Twitter / X API -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--color-twitter); background: rgba(43, 123, 185, 0.12); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="twitter"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">3. Twitter / X API (Live Text Tweets)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Posts news summaries directly to Twitter via Tweepy (1,500 free tweets/month)</p>
              </div>
            </div>
            <span class="badge" style="font-size: 0.7rem; background: rgba(31,30,27,0.06); color: var(--text-muted);">OPTIONAL</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">TWITTER_API_KEY</label>
              <input type="text" id="input-TWITTER_API_KEY" class="filter-select" placeholder="API Key" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">TWITTER_API_SECRET</label>
              <input type="password" id="input-TWITTER_API_SECRET" class="filter-select" placeholder="API Secret" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">TWITTER_ACCESS_TOKEN</label>
              <input type="text" id="input-TWITTER_ACCESS_TOKEN" class="filter-select" placeholder="Access Token" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">TWITTER_ACCESS_SECRET</label>
              <input type="password" id="input-TWITTER_ACCESS_SECRET" class="filter-select" placeholder="Access Secret" />
            </div>
          </div>
        </div>

        <!-- Step 4: Reddit API -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--color-reddit); background: rgba(224, 83, 38, 0.12); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="message-square"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">4. Reddit API (Live Posting)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Auto-posts text & images directly to targeted subreddits via PRAW</p>
              </div>
            </div>
            <span class="badge" style="font-size: 0.7rem; background: rgba(31,30,27,0.06); color: var(--text-muted);">OPTIONAL</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">REDDIT_CLIENT_ID</label>
              <input type="text" id="input-REDDIT_CLIENT_ID" class="filter-select" placeholder="Client ID" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">REDDIT_CLIENT_SECRET</label>
              <input type="password" id="input-REDDIT_CLIENT_SECRET" class="filter-select" placeholder="Client Secret" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">REDDIT_USERNAME</label>
              <input type="text" id="input-REDDIT_USERNAME" class="filter-select" placeholder="Reddit Username" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">REDDIT_PASSWORD</label>
              <input type="password" id="input-REDDIT_PASSWORD" class="filter-select" placeholder="Reddit Password" />
            </div>
          </div>
        </div>

        <!-- Step 5: LinkedIn API -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--color-linkedin); background: rgba(0, 119, 181, 0.12); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="linkedin"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">5. LinkedIn REST API (Live Auto-Post)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Direct live posting via LinkedIn API. Leave empty to use local queue folder.</p>
              </div>
            </div>
            <span class="badge" style="font-size: 0.7rem; background: rgba(31,30,27,0.06); color: var(--text-muted);">OPTIONAL</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">LINKEDIN_ACCESS_TOKEN</label>
              <input type="password" id="input-LINKEDIN_ACCESS_TOKEN" class="filter-select" placeholder="OAuth Access Token" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.84rem; font-weight: 600;">LINKEDIN_AUTHOR_URN</label>
              <input type="text" id="input-LINKEDIN_AUTHOR_URN" class="filter-select" placeholder="urn:li:person:XXXXXX or Org URN" />
            </div>
          </div>
        </div>

        <!-- Bottom Save Button -->
        <div style="display: flex; align-items: center; justify-content: center; margin-top: 10px; margin-bottom: 30px;">
          <button class="btn btn-primary btn-glow" onclick="SettingsPage.saveSettings()" style="padding: 14px 40px; font-size: 1rem;">
            <i data-lucide="zap"></i> Activate & Save All API Keys
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
      "INSTAGRAM_ACCESS_TOKEN",
      "INSTAGRAM_ACCOUNT_ID",
      "TWITTER_API_KEY",
      "TWITTER_API_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_SECRET",
      "REDDIT_CLIENT_ID",
      "REDDIT_CLIENT_SECRET",
      "REDDIT_USERNAME",
      "REDDIT_PASSWORD",
      "LINKEDIN_ACCESS_TOKEN",
      "LINKEDIN_AUTHOR_URN",
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

      App.showToast('All API Keys activated and saved to .env!', 'success');
      const msg = document.getElementById('save-status-msg');
      if (msg) {
        msg.textContent = "Saved & Activated!";
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
