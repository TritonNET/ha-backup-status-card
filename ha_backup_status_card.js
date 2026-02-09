class TritonnetBackupStatusCard extends HTMLElement {
    set hass(hass) {
        if (!this.content) {
            const style = document.createElement("style");
            style.textContent = `
        .backup-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Inter, Helvetica, Arial, sans-serif;
          font-size: 12px;
          background-color: #1e1e1e;
          color: #d4d4d4;
        }
        .backup-table th, .backup-table td {
          border: 1px solid #333;
          padding: 4px 8px;
          white-space: nowrap;
        }
        .backup-table th {
          background-color: #181A1E;
          text-align: center;
        }
        .group-header {
          background-color: #181A1E;
          text-align: center;
        }
        .backup-table tbody tr {
          background-color: #212326;
        }
        .status-icon {
          font-size: 1.2em;
          display: flex;
          justify-content: center;
        }
        .status-running { color: #f0ad4e; }
        .status-run_success, .status-upload_success, .status-completed { color: #5cb85c; }
        .status-run_failed, .status-upload_failed, .status-cleanup_failed { color: #d9534f; }
        .status-uploading, .status-cleaningup { color: #5bc0de; }
        .stale-time { color: #ff6b6b; }
      `;

            const card = document.createElement("ha-card");
            this.content = document.createElement("div");

            card.appendChild(style);
            card.appendChild(this.content);
            this.appendChild(card);
        }

        const MAX_AGE_HOURS = 25;
        const config = this._config;

        const formatDuration = (ms) => {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${Math.floor(ms / 1000)}s ${ms % 1000}ms`;
            const min = Math.floor(ms / 60000);
            const sec = Math.floor((ms % 60000) / 1000);
            const remMs = ms % 1000;
            return `${min}m ${sec}s ${remMs}ms`;
        };

        const formatBytes = (bytes) => {
            if (bytes === 0 || isNaN(bytes)) return "0 B";
            const k = 1024;
            const sizes = ["B", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

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

        const now = new Date();
        const rows = config.backups.map(backup => {
            const lastRunRaw = hass.states["input_datetime." + backup.last_run_entity_id]?.state || "Unknown";
            const status = hass.states["input_text." + backup.status_entity_id]?.state || "unknown";
            const runDuration = parseInt(hass.states["input_number." + backup.duration_entity_id]?.state || "0");
            const uploadDuration = parseInt(hass.states["input_number." + backup.upload_duration_entity_id]?.state || "0");
            const cleanupDuration = parseInt(hass.states["input_number." + backup.cleanup_duration_entity_id]?.state || "0");
            const archiveSizeBytes = parseInt(hass.states["input_number." + backup.archive_size_entity_id]?.state || "0");

            let lastRunDisplay = lastRunRaw;
            let isStale = false;

            if (lastRunRaw && lastRunRaw !== "Unknown") {
                const lastRunDate = new Date(lastRunRaw);
                const ageMs = now - lastRunDate;
                const ageHours = ageMs / (1000 * 60 * 60);
                if (ageHours > MAX_AGE_HOURS) {
                    isStale = true;
                }
            }

            return `
        <tr>
          <td style="text-align: left;">${backup.title}</td>
          <td class="${isStale ? "stale-time" : ""}" style="text-align: center;">${lastRunDisplay}</td>
          <td style="text-align: center;">${statusIcon(status)}</td>
          <td style="text-align: center;">${formatDuration(runDuration)}</td>
          <td style="text-align: center;">${formatDuration(uploadDuration)}</td>
          <td style="text-align: center;">${formatDuration(cleanupDuration)}</td>
          <td style="text-align: center;">${formatBytes(archiveSizeBytes)}</td>
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
            <th rowspan="2">Size</th>
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
