// frontend/js/backup.js

/**
 * 获取并显示备份列表
 */
function fetchBackups() {
    const contentDiv = document.getElementById('backup-list-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '<p>正在加载备份列表...</p>';

    fetch('/api/backups')
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || `HTTP ${response.status}`); });
            }
            // 检查 Content-Type 是否为 application/json
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                // 如果不是 JSON，尝试作为文本处理（适配 C 直接输出字符串的情况）
                return response.text().then(text => ({ output: text }));
            }
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateBackupList(data.output || ""); // 假设后端返回以换行符分隔的备份名称列表
        })
        .catch(error => {
            contentDiv.innerHTML = `<p style="color: red;">获取备份列表失败: ${error.message}</p>`;
            showCustomAlert(`获取备份列表失败: ${error.message}`, 'error');
        });
}

/**
 * 根据后端返回的字符串生成备份列表的 HTML
 * @param {string} output - 后端返回的备份名称列表，以换行符分隔
 */
function generateBackupList(output) {
    const contentDiv = document.getElementById('backup-list-content');
    if (!contentDiv) return;

    const backupNames = output.trim().split('\n').filter(name => name.trim() !== '');

    if (backupNames.length === 0) {
        contentDiv.innerHTML = '<p>没有找到任何备份记录。</p>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>备份时间 / 名称</th>
                        <th style="text-align: right;">操作</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // 通常备份是按时间倒序排列比较好，这里假设后端返回的就是需要的顺序，或者前端排序
    // backupNames.sort().reverse(); // 简单的字母倒序

    backupNames.forEach(name => {
        const backupName = name.trim();
        // 尝试从文件名解析日期时间 (假设格式为 backup_YYYYMMDD_HHMMSS.zip)
        let displayDate = backupName;
        const match = backupName.match(/backup_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.zip/);
        if (match) {
            displayDate = `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
        }

        tableHTML += `
            <tr>
                <td>${displayDate} <small>(${backupName})</small></td>
                <td class="action-cell" style="text-align: right; white-space: nowrap;">
                    <button class="section-btn restore-btn hover-target" onclick="restoreBackup('${backupName}')" title="从此备份恢复">
                        <span class="material-icons-outlined" style="font-size: 18px;">restore</span> 恢复
                    </button>
                    <button class="delete-btn icon-btn hover-target" onclick="deleteBackup('${backupName}')" title="删除此备份">
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
        <style>
            .restore-btn {
                background-color: #ffc107; /* Warning color */
                color: #333;
                margin-right: 8px;
            }
            .restore-btn:hover {
                background-color: #e0a800;
                color: #000;
            }
            .restore-btn .material-icons-outlined {
                 vertical-align: middle;
                 margin-right: 3px;
            }
        </style>
    `;

    contentDiv.innerHTML = tableHTML;
    updateHoverTargets(); // 应用悬停效果
}


/**
 * 触发创建新备份的操作
 */
function createBackup() {
    const createBtn = document.getElementById('createBackupBtn');
    const statusP = document.getElementById('backup-status');
    if (!createBtn || !statusP) return;

    createBtn.disabled = true;
    createBtn.innerHTML = `<span class="material-icons-outlined" style="vertical-align: middle; margin-right: 5px;">hourglass_top</span> 处理中...`;
    statusP.textContent = '正在创建备份，请稍候...';
    statusP.style.color = '#ffa500'; // Orange color for processing

    fetch('/api/backups', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                // 如果是非 OK 状态，尝试解析 JSON 错误信息
                return response.json().then(err => {
                    // 如果解析成功且有 error 字段，抛出该错误
                    if (err && err.error) {
                        throw new Error(err.error);
                    }
                    // 否则，抛出 HTTP 状态错误
                    throw new Error(`服务器错误: ${response.status}`);
                }).catch(() => {
                    // 如果 JSON 解析失败，也抛出 HTTP 状态错误
                    throw new Error(`服务器错误: ${response.status}`);
                });
            }
            return response.json(); // 假设成功时返回 JSON
        })
        .then(data => {
            // 检查后端返回的 JSON 中是否有 output 或 message
            const message = data.output || data.message || '备份成功完成！';
            showCustomAlert(message, 'success');
            statusP.textContent = `最后备份状态: ${message}`;
            statusP.style.color = 'green';
            fetchBackups(); // 成功后刷新列表
        })
        .catch(error => {
            showCustomAlert(`创建备份失败: ${error.message}`, 'error');
            statusP.textContent = `备份失败: ${error.message}`;
            statusP.style.color = 'red';
        })
        .finally(() => {
            createBtn.disabled = false;
            createBtn.innerHTML = `<span class="material-icons-outlined" style="vertical-align: middle; margin-right: 5px;">add_circle_outline</span> 创建新备份`;
            updateHoverTargets();
        });
}

/**
 * 删除指定的备份
 * @param {string} backupName - 要删除的备份文件名
 */
function deleteBackup(backupName) {
    showCustomConfirm(
        `备份文件 '${backupName}' 将被永久删除，此操作无法撤销。`,
        `确定要删除此备份吗？`,
        () => {
            fetch(`/api/backups/${encodeURIComponent(backupName)}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.error || `HTTP ${response.status}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    const message = data.output || data.message || `备份 '${backupName}' 已删除。`;
                    showCustomAlert(message, 'success');
                    fetchBackups(); // 删除成功后刷新列表
                })
                .catch(error => {
                    showCustomAlert(`删除备份 '${backupName}' 失败: ${error.message}`, 'error');
                });
        }
    );
}

/**
 * 从指定的备份恢复数据
 * @param {string} backupName - 用于恢复的备份文件名
 */
function restoreBackup(backupName) {
    showCustomConfirm(
        `【高风险操作】这将使用备份 '${backupName}' 覆盖当前的 data 目录！当前所有数据将被替换，此操作无法撤销，并可能导致短暂的服务中断。请确保您了解后果！`,
        `⚠️ 确认要恢复数据吗？`,
        () => {
            // 二次确认，增加输入要求
            const confirmationText = "确认恢复";
            const userInput = prompt(`为确认恢复操作，请输入 "${confirmationText}"：`);

            if (userInput !== confirmationText) {
                showCustomAlert("恢复操作已取消，确认文本不匹配。", "info");
                return;
            }


            const statusP = document.getElementById('backup-status');
            if (statusP) {
                statusP.textContent = `正在从 '${backupName}' 恢复数据，请稍候... 这可能需要一些时间。`;
                statusP.style.color = '#ffa500';
            }
            // 可以考虑显示一个全局的加载覆盖层


            fetch(`/api/backups/${encodeURIComponent(backupName)}/restore`, { method: 'POST' })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.error || `HTTP ${response.status}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    const message = data.output || data.message || `数据已从 '${backupName}' 成功恢复。建议刷新页面或重新登录以确保数据同步。`;
                    showCustomAlert(message, 'success', 10000); // 显示更长时间
                    if (statusP) {
                        statusP.textContent = `恢复完成: ${message}`;
                        statusP.style.color = 'green';
                    }
                    // 恢复后可能需要刷新页面或提示用户刷新
                    // fetchBackups(); // 恢复操作不影响备份列表本身，无需刷新
                })
                .catch(error => {
                    const errorMsg = `从 '${backupName}' 恢复数据失败: ${error.message}`;
                    showCustomAlert(errorMsg, 'error');
                    if (statusP) {
                        statusP.textContent = `恢复失败: ${error.message}`;
                        statusP.style.color = 'red';
                    }
                })
                .finally(() => {
                    // 隐藏全局加载覆盖层
                });
        }
    );
}