/**
 * Local Queue Page Renderer — Instagram & LinkedIn manual posting queue
 */
const QueuePage = {
  currentPlatform: 'instagram',

  async render(container) {
    container.innerHTML = `
      <div class="queue-tabs">
        <button class="tab-btn ${this.currentPlatform === 'instagram' ? 'active' : ''}" id="tab-instagram">
          <i data-lucide="instagram"></i> Instagram Queue
        </button>
        <button class="tab-btn ${this.currentPlatform === 'linkedin' ? 'active' : ''}" id="tab-linkedin">
          <i data-lucide="linkedin"></i> LinkedIn Queue
        </button>
      </div>

      <div class="queue-grid" id="queue-grid">
        <div class="glass-card"><p>Loading local queue items...</p></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('tab-instagram').addEventListener('click', () => {
      this.currentPlatform = 'instagram';
      this.render(container);
    });

    document.getElementById('tab-linkedin').addEventListener('click', () => {
      this.currentPlatform = 'linkedin';
      this.render(container);
    });

    await this.loadQueue();
  },

  async loadQueue() {
    const grid = document.getElementById('queue-grid');
    if (!grid) return;

    try {
      const data = await App.fetchApi(`/api/queue/${this.currentPlatform}`);
      const items = data.items;

      if (!items || items.length === 0) {
        grid.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1;">
            <p>No posts queued in <code>queue/${this.currentPlatform}/</code> directory yet.</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">Articles reach this stage when they have been rewritten and have thumbnails generated.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(item => `
        <div class="glass-card queue-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="badge badge-queued">${this.currentPlatform.toUpperCase()}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Article #${item.article_id}</span>
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 600;">${item.title}</h4>

          ${item.image_url ? `
            <div class="queue-img-wrapper">
              <img src="${item.image_url}" alt="Post Image" />
            </div>
          ` : '<div class="queue-img-wrapper" style="display: flex; align-items: center; justify-content: center; color: var(--text-muted);">No Image</div>'}

          <div>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Caption / Body Text:</span>
            <div class="queue-content-text" id="caption-${item.article_id}">${item.content || 'No text content'}</div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: auto;">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.82rem;" onclick="QueuePage.copyCaption('${item.article_id}')">
              <i data-lucide="copy"></i> Copy Text
            </button>
            <button class="btn btn-secondary" style="font-size: 0.82rem;" onclick="App.openArticleModal(${item.article_id})">
              <i data-lucide="external-link"></i> View Article
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

    } catch (e) {
      console.error("Failed to load queue page", e);
    }
  },

  copyCaption(articleId) {
    const el = document.getElementById(`caption-${articleId}`);
    if (!el) return;

    const text = el.textContent;
    navigator.clipboard.writeText(text).then(() => {
      App.showToast('Copied text to clipboard!', 'success');
    }).catch(err => {
      App.showToast('Failed to copy text', 'error');
    });
  }
};
