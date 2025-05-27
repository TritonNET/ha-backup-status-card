class TritonnetBackupStatusCard extends HTMLElement {
    set hass(hass) {
        if (!this.content) {
            const style = document.createElement("style");
            style.textContent = `
        .backup-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Segoe UI', sans-serif;
          font-size: 12px;
          background-color: #1e1e1e;
          color: #cccccc;
        }
        .backup-table th, .backup-table td {
          border: 1px solid #333;
          padding: 6px 10px;
          text-align: left;
          white-space: nowrap;
        }
        .backup-table th.group-header {
          text-align: center;
          background-color: #2a2a2a;
        }
        .backup-table th {
          background-color: #2a2a2a;
        }
        .status-icon {
          font-size: 1.2em;
        }
        .status-running { color: #f0ad4e; }
        .status-run_success, .status-upload_success, .status-completed { color: #5cb85c; }
        .status-run_failed, .status-upload_failed, .status-cleanup_failed { color: #d9534f; }
        .status-uploading, .status-cleaningup { color: #5bc0de; }
      `;

            const card = document.createElement("ha-card");
            this.content = document.createElement("div");

            card.appendChild(style);
            card.appendChild(this.content);
            this.appendChild(card);
        }

        const config = this._config;

        const statusIcon = (status) => {
            const iconMap = {
                "running": "mdi:progress-clock",
                "run_success": "mdi:check-circle-outline",
                "run_failed": "mdi:close-circle-outline",
                "uploading": "mdi:cloud-upload-outline",
                "upload_success": "mdi:cloud-check-outline",
                "upload_failed": "mdi:cloud-alert-outline",
                "cleaningup": "mdi:broom",
                "cleanup_failed": "mdi:broom-alert",
                "completed": "mdi:check-bold"
            };
            const icon = iconMap[status] || "mdi:help-circle-outline";
            return `<ha-icon icon="${icon}" class="status-icon status-${status}"></ha-icon>`;
        };

        const rows = config.backups.map(backup => {
            const lastRun = hass.states["input_datetime." + backup.last_run_entity_id]?.state || "Unknown";
            const status = hass.states["input_text." + backup.status_entity_id]?.state || "unknown";

            const runDuration = parseInt(hass.states["input_number." + backup.duration_entity_id]?.state || "0");
            const uploadDuration = parseInt(hass.states["input_number." + backup.upload_duration_entity_id]?.state || "0");
            const cleanupDuration = parseInt(hass.states["input_number." + backup.cleanup_duration_entity_id]?.state || "0");

            return `
        <tr>
          <td>${backup.title}</td>
          <td>${lastRun}</td>
          <td>${statusIcon(status)}</td>
          <td>${runDuration}ms</td>
          <td>${uploadDuration}ms</td>
          <td>${cleanupDuration}ms</td>
        </tr>
      `;
        }).join("");

        this.content.innerHTML = `
      <table class="backup-table">
        <thead>
          <tr>
            <th rowspan="2">Backup</th>
            <th rowspan="2">Last Run</th>
            <th rowspan="2">Status</th>
            <th class="group-header" colspan="3">Duration</th>
          </tr>
          <tr>
            <th>Run</th>
            <th>Upload</th>
            <th>Cleanup</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    }

    setConfig(config) {
        this._config = config;
    }

    getCardSize() {
        return 3;
    }
}

customElements.define('ha-backup-status-card', TritonnetBackupStatusCard);
