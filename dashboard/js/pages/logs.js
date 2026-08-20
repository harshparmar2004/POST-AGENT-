/**
 * Logs Page Renderer — Terminal-style log viewer
 */
const LogsPage = {
  autoScroll: true,
  logInterval: null,

  async render(container) {
    container.innerHTML = `
      <div class="terminal-window">
        <div class="terminal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="terminal" style="width: 16px;"></i>
            <span>logs/pipeline.log</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <label style="font-size: 0.8rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="autoscroll-chk" ${this.autoScroll ? 'checked' : ''}> Auto-scroll
            </label>
            <button class="btn btn-secondary" id="refresh-logs-btn" style="padding: 4px 10px; font-size: 0.75rem;">
              <i data-lucide="refresh-cw"></i> Refresh Now
            </button>
          </div>
        </div>

        <div class="terminal-body" id="terminal-body">
          <div class="log-line INFO">Loading log stream...</div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('refresh-logs-btn').addEventListener('click', () => this.loadLogs());
    document.getElementById('autoscroll-chk').addEventListener('change', (e) => {
      this.autoScroll = e.target.checked;
    });

    await this.loadLogs();
  },

  async loadLogs() {
    const body = document.getElementById('terminal-body');
    if (!body) return;

    try {
      const data = await App.fetchApi('/api/logs?lines=250');
      const lines = data.logs;

      if (!lines || lines.length === 0) {
        body.innerHTML = '<div class="log-line DEBUG">Log file is empty. Run the pipeline to see log output.</div>';
        return;
      }

      body.innerHTML = lines.map(line => {
        let levelClass = 'INFO';
        if (line.includes('│ ERROR   │')) levelClass = 'ERROR';
        else if (line.includes('│ WARNING │')) levelClass = 'WARNING';
        else if (line.includes('│ DEBUG   │')) levelClass = 'DEBUG';

        return `<div class="log-line ${levelClass}">${this.escapeHtml(line)}</div>`;
      }).join('');

      if (this.autoScroll) {
        body.scrollTop = body.scrollHeight;
      }

    } catch (e) {
      console.error("Failed to load logs page", e);
    }
  },

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};
