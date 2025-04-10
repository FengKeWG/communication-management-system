const DATA_DIR = './data';
function fetchBackups() {
    const contentDiv = document.getElementById('backup-list-content');
    const backupStatus = document.getElementById('backup-status');
    if (!contentDiv) return;
    contentDiv.innerHTML = '<p>正在加载备份列表...</p>';
    if (backupStatus) backupStatus.textContent = '';
    fetch('/api/backups')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            generateBackupListHTML(data.backups);
        })
        .catch(error => {
            console.error("获取备份列表失败:", error);
            contentDiv.innerHTML = `<p style="color: red;">获取备份列表失败: ${error.message}</p>`;
            showCustomAlert(`获取备份列表失败: ${error.message}`, 'error');
        });
}

function generateBackupListHTML(backups) {
    const contentDiv = document.getElementById('backup-list-content');
    if (!contentDiv) return;
    if (backups.length === 0) {
        contentDiv.innerHTML = '<p>没有找到历史备份文件。</p>';
        return;
    }
    let tableHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>备份文件名</th>
                        <th>备份时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
    `;
    backups.forEach(backup => {
        const filename = backup.filename;
        const formattedTime = backup.timestamp;
        const encodedFilename = encodeURIComponent(filename);
        tableHTML += `
            <tr>
                <td>${filename}</td>
                <td>${formattedTime}</td>
                <td class="action-cell" style="white-space: nowrap;">
                    <button class="restore-btn icon-btn" onclick="restoreBackup('${encodedFilename}')" title="恢复此备份">
                        <span class="material-icons-outlined">restore</span>
                    </button>
                    <button class="delete-btn icon-btn" onclick="deleteBackup('${encodedFilename}')" title="删除此备份">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </td>
            </tr>
        `;
    });
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    contentDiv.innerHTML = tableHTML;
    updateHoverTargets();
}

function parseTimestampFromBackupFilename(filename) {
    const match = filename.match(/backup_(\d{8})_(\d{6})\.tar\.gz$/);
    if (match && match[1] && match[2]) {
        const datePart = match[1];
        const timePart = match[2];
        const year = datePart.substring(0, 4);
        const month = datePart.substring(4, 6);
        const day = datePart.substring(6, 8);
        const hour = timePart.substring(0, 2);
        const minute = timePart.substring(2, 4);
        const second = timePart.substring(4, 6);
        try {
            return new Date(year, month - 1, day, hour, minute, second);
        } catch (e) {
            console.error("解析日期时出错:", e);
            return null;
        }
    }
    return null;
}

function formatTimestamp(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return '无效日期';
    }
    return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
}

function createBackup() {
    const createBtn = document.getElementById('createBackupBtn');
    const backupStatus = document.getElementById('backup-status');
    if (createBtn.disabled) return;
    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="material-icons-outlined spin" style="vertical-align: middle; margin-right: 5px;">sync</span>处理中...';
    if (backupStatus) backupStatus.textContent = '正在请求创建备份...';
    fetch('/api/backups', { method: 'POST' })
        .then(response => {
            createBtn.disabled = false;
            createBtn.innerHTML = '<span class="material-icons-outlined" style="vertical-align: middle; margin-right: 5px;">add_circle_outline</span>创建新备份';
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || `HTTP error ${response.status}`) });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            showCustomAlert(data.message || '备份创建请求已发送！', 'success');
            if (backupStatus) backupStatus.textContent = '备份创建成功！稍后请刷新列表。';
            setTimeout(fetchBackups, 2000);
        })
        .catch(error => {
            console.error("创建备份失败:", error);
            if (backupStatus) backupStatus.textContent = `备份创建失败: ${error.message}`;
            showCustomAlert(`创建备份失败: ${error.message}`, 'error');
        });
}

function deleteBackup(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename);
    showCustomConfirm(
        `确定要永久删除备份文件 "${filename}" 吗？此操作无法撤销。`,
        "确认删除",
        () => {
            const row = document.querySelector(`td button[onclick="deleteBackup('${encodedFilename}')"]`)?.closest('tr');
            if (row) row.style.opacity = '0.5';
            fetch(`/api/backups/${encodedFilename}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert(data.error, 'error');
                    }
                    showCustomAlert(data.output, 'success');
                    fetchBackups();
                })
                .catch(error => {
                    showCustomAlert(`删除备份失败: ${error.message}`, 'error');
                    if (row) row.style.opacity = '1';
                });
        }
    );
}

function restoreBackup(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename);
    showCustomConfirm(
        `警告：这将使用备份文件 "${filename}" 覆盖当前的 ${DATA_DIR} 目录内容！当前的所有数据将会丢失。此操作非常危险且无法撤销！\n\n确定要继续恢复吗？`,
        "确认恢复数据",
        () => {
            const backupStatus = document.getElementById('backup-status');
            if (backupStatus) backupStatus.textContent = `正在恢复备份 "${filename}"... 请稍候...`;
            document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = true);
            const createBtn = document.getElementById('createBackupBtn');
            if (createBtn) createBtn.disabled = true;
            fetch(`/api/backups/${encodedFilename}/restore`, { method: 'POST' })
                .then(response => {
                    document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = false);
                    if (createBtn) createBtn.disabled = false;
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        showCustomAlert(data.error, 'error');
                    }
                    showCustomAlert(data.message, 'success');
                    if (backupStatus) backupStatus.textContent = '恢复成功！建议刷新页面或重新登录以加载最新数据。';
                })
                .catch(error => {
                    if (backupStatus) backupStatus.textContent = `恢复失败: ${error.message}`;
                    showCustomAlert(`恢复备份失败: ${error.message}`, 'error');
                    document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = false);
                    if (createBtn) createBtn.disabled = false;
                });
        }
    );
}