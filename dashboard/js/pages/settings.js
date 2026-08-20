/**
 * Settings Page Renderer — Target Niche Focus + Multi-LLM Support + Social Media APIs
 */
const SettingsPage = {
  async render(container) {
    container.innerHTML = `
      <div style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 20px 24px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.3rem;">API Credentials & Multi-LLM Setup</h3>
            <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 2px;">
              Connect your choice of LLM provider (Groq, OpenAI, Claude, or Gemini) + social media accounts.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <span id="save-status-msg" style="font-size: 0.85rem; color: #2e7d32; font-weight: 600;"></span>
            <button class="btn btn-primary btn-glow" onclick="SettingsPage.saveSettings()">
              <i data-lucide="zap"></i> Activate & Save All Keys
            </button>
          </div>
        </div>

        <!-- Target Niche Focus Box -->
        <div class="glass-card" style="border: 1px solid var(--primary-purple);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div class="stat-icon" style="color: var(--primary-purple); background: rgba(217, 119, 87, 0.15); width: 38px; height: 38px; border-radius: 8px;">
              <i data-lucide="target"></i>
            </div>
            <div>
              <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">🎯 Target Niche & AI Agent Focus</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">Tell your AI Agent what niche to filter and tailor news for (e.g. Tech, Politics, AI, Finance, Crypto, Health)</p>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 0.84rem; font-weight: 600;">NICHE_FOCUS</label>
            <input type="text" id="input-NICHE_FOCUS" class="filter-select" placeholder="e.g. Artificial Intelligence, Tech News & Innovation" value="Artificial Intelligence, Tech News & Innovation" />
            <span style="font-size: 0.76rem; color: var(--text-dim);">The LLM agent uses this topic prompt to select and format relevant news for your target audience.</span>
          </div>
        </div>

        <!-- Step 1: Multi-LLM Provider Selection (Groq, OpenAI, Claude, Gemini) -->
        <div class="glass-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stat-icon" style="color: var(--primary-purple); background: rgba(217, 119, 87, 0.15); width: 40px; height: 40px; border-radius: 8px;">
                <i data-lucide="cpu"></i>
              </div>
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.15rem;">1. Choose LLM Provider (Any LLM API Key)</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Powers article rewriting & content generation. Use Groq, OpenAI, Claude, or Gemini!</p>
              </div>
            </div>
            <span class="badge badge-scraped" style="font-size: 0.7rem;">REQUIRED (PICK ANY 1)</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Groq API Key -->
            <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.84rem; font-weight: 700; color: var(--primary-purple);">⚡ Groq API Key (Llama 3.3 70B — Fast & Free)</label>
                <span style="font-size: 0.76rem; color: var(--text-dim);">Get key: <a href="https://console.groq.com/keys" target="_blank" style="color: var(--primary-purple); font-weight: 600;">console.groq.com/keys</a></span>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <input type="password" id="input-GROQ_API_KEY" class="filter-select" style="flex: 1; background: var(--bg-card);" placeholder="Enter Groq key (gsk_...)" />
                <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-GROQ_API_KEY')">Show/Hide</button>
              </div>
            </div>

            <!-- OpenAI API Key -->
            <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.84rem; font-weight: 700; color: #2b7bb9;">🟢 OpenAI ChatGPT API Key (GPT-4o / GPT-4o mini)</label>
                <span style="font-size: 0.76rem; color: var(--text-dim);">Get key: <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #2b7bb9; font-weight: 600;">platform.openai.com/api-keys</a></span>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <input type="password" id="input-OPENAI_API_KEY" class="filter-select" style="flex: 1; background: var(--bg-card);" placeholder="Enter OpenAI key (sk-proj-...)" />
                <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-OPENAI_API_KEY')">Show/Hide</button>
              </div>
            </div>

            <!-- Anthropic Claude API Key -->
            <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.84rem; font-weight: 700; color: #d97757;">🧡 Anthropic Claude API Key (Claude 3.5 Sonnet)</label>
                <span style="font-size: 0.76rem; color: var(--text-dim);">Get key: <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #d97757; font-weight: 600;">console.anthropic.com/settings/keys</a></span>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <input type="password" id="input-ANTHROPIC_API_KEY" class="filter-select" style="flex: 1; background: var(--bg-card);" placeholder="Enter Anthropic key (sk-ant-api...)" />
                <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-ANTHROPIC_API_KEY')">Show/Hide</button>
              </div>
            </div>

            <!-- Google Gemini API Key -->
            <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.84rem; font-weight: 700; color: #a855f7;">✨ Google Gemini API Key (Gemini 2.5 Flash)</label>
                <span style="font-size: 0.76rem; color: var(--text-dim);">Get key: <a href="https://aistudio.google.com/apikey" target="_blank" style="color: #a855f7; font-weight: 600;">aistudio.google.com/apikey</a></span>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <input type="password" id="input-GOOGLE_API_KEY" class="filter-select" style="flex: 1; background: var(--bg-card);" placeholder="Enter Gemini key (AIzaSy...)" />
                <button class="btn btn-secondary" onclick="SettingsPage.toggleVisibility('input-GOOGLE_API_KEY')">Show/Hide</button>
              </div>
            </div>

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
      "NICHE_FOCUS",
      "GOOGLE_API_KEY",
      "GROQ_API_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
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

      App.showToast('Target Niche & API Keys activated and saved!', 'success');
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
