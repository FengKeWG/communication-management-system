const DATA_DIR = './data';

// 当切换到备份管理板块时，自动获取备份列表
function fetchBackups() {
    const contentDiv = document.getElementById('backup-list-content');
    const backupStatus = document.getElementById('backup-status');
    if (!contentDiv) return;

    contentDiv.innerHTML = '<p>正在加载备份列表...</p>';
    if (backupStatus) backupStatus.textContent = '';

    fetch('/api/backups') // API 端点不变
        .then(response => {
            if (!response.ok) {
                // 尝试解析 JSON 错误
                return response.json().then(err => {
                    throw new Error(err.error || `HTTP error ${response.status}`);
                }).catch(() => {
                    // 如果 JSON 解析失败，抛出通用 HTTP 错误
                    throw new Error(`无法获取备份列表，服务器状态: ${response.status}`);
                });
            }
            return response.json(); // 解析 JSON 响应体
        })
        .then(data => {
            // 检查 API 返回的数据结构是否正确
            if (!data || !Array.isArray(data.backups)) {
                console.error("API 返回的备份数据格式不正确:", data);
                throw new Error("服务器返回的备份数据格式无效。");
            }
            // *** 调用修改后的 generateBackupListHTML ***
            generateBackupListHTML(data.backups); // data.backups 现在是 [{filename: '...', timestamp: '...'}, ...]
        })
        .catch(error => {
            console.error("获取备份列表失败:", error);
            contentDiv.innerHTML = `<p style="color: red;">获取备份列表失败: ${error.message}</p>`;
            showCustomAlert(`获取备份列表失败: ${error.message}`, 'error');
        });
}



// 根据备份文件名数组生成 HTML 表格
function generateBackupListHTML(backups) { // 参数名改为 backups (对象数组)
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

    backups.forEach(backup => { // 遍历对象数组
        // 直接使用 backup.filename 和 backup.timestamp
        const filename = backup.filename;
        const formattedTime = backup.timestamp; // 直接使用后端格式化的时间

        // 对文件名进行编码，用于 JS 函数调用
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
    updateHoverTargets(); // 确保新按钮有悬停效果
}

// 从备份文件名解析大致的时间戳（假设格式为 backup_YYYYMMDD_HHMMSS.tar.gz）
function parseTimestampFromBackupFilename(filename) {
    const match = filename.match(/backup_(\d{8})_(\d{6})\.tar\.gz$/);
    if (match && match[1] && match[2]) {
        const datePart = match[1]; // YYYYMMDD
        const timePart = match[2]; // HHMMSS
        const year = datePart.substring(0, 4);
        const month = datePart.substring(4, 6);
        const day = datePart.substring(6, 8);
        const hour = timePart.substring(0, 2);
        const minute = timePart.substring(2, 4);
        const second = timePart.substring(4, 6);
        // 创建 Date 对象 (月份是从 0 开始的，所以需要减 1)
        // 注意：这创建的是本地时间
        try {
            return new Date(year, month - 1, day, hour, minute, second);
        } catch (e) {
            console.error("解析日期时出错:", e);
            return null;
        }
    }
    return null; // 格式不匹配
}

// 格式化 Date 对象为可读字符串
function formatTimestamp(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return '无效日期';
    }
    // 使用 toLocaleString 提供本地化友好的格式
    return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false // 使用24小时制
    });
}


// 触发创建备份
function createBackup() {
    const createBtn = document.getElementById('createBackupBtn');
    const backupStatus = document.getElementById('backup-status');
    if (createBtn.disabled) return; // 防止重复点击

    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="material-icons-outlined spin" style="vertical-align: middle; margin-right: 5px;">sync</span>处理中...'; // 添加旋转图标
    if (backupStatus) backupStatus.textContent = '正在请求创建备份...';

    fetch('/api/backups', { method: 'POST' })
        .then(response => {
            // 请求完成后立即恢复按钮状态，无论成功与否
            createBtn.disabled = false;
            createBtn.innerHTML = '<span class="material-icons-outlined" style="vertical-align: middle; margin-right: 5px;">add_circle_outline</span>创建新备份';

            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || `HTTP error ${response.status}`) });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) { // API 可能在成功状态码下返回错误消息
                throw new Error(data.error);
            }
            showCustomAlert(data.message || '备份创建请求已发送！', 'success');
            if (backupStatus) backupStatus.textContent = '备份创建成功！稍后请刷新列表。';
            // 短暂延迟后刷新列表，给后端一点时间生成文件
            setTimeout(fetchBackups, 2000);
        })
        .catch(error => {
            console.error("创建备份失败:", error);
            if (backupStatus) backupStatus.textContent = `备份创建失败: ${error.message}`;
            showCustomAlert(`创建备份失败: ${error.message}`, 'error');
        });
}

// 删除备份
function deleteBackup(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename); // 解码文件名
    showCustomConfirm(
        `确定要永久删除备份文件 "${filename}" 吗？此操作无法撤销。`,
        "确认删除",
        () => {
            // 显示进行中状态 (可选)
            const row = document.querySelector(`td button[onclick="deleteBackup('${encodedFilename}')"]`)?.closest('tr');
            if (row) row.style.opacity = '0.5'; // 例如，使行半透明

            fetch(`/api/backups/${encodedFilename}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.error || `HTTP error ${response.status}`) });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    showCustomAlert(data.message || `备份 "${filename}" 已删除。`, 'success');
                    fetchBackups(); // 刷新列表
                })
                .catch(error => {
                    console.error(`删除备份 ${filename} 失败:`, error);
                    showCustomAlert(`删除备份失败: ${error.message}`, 'error');
                    if (row) row.style.opacity = '1'; // 恢复行状态
                });
        }
        // 如果用户取消，什么也不做
    );
}

// 恢复备份
function restoreBackup(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename);
    // 现在 DATA_DIR 已经定义，可以在模板字符串中使用
    showCustomConfirm(
        `警告：这将使用备份文件 "${filename}" 覆盖当前的 ${DATA_DIR} 目录内容！当前的所有数据将会丢失。此操作非常危险且无法撤销！\n\n确定要继续恢复吗？`,
        "确认恢复数据",
        () => {
            const backupStatus = document.getElementById('backup-status');
            if (backupStatus) backupStatus.textContent = `正在恢复备份 "${filename}"... 请稍候...`;
            // 禁用所有操作按钮 (可选)
            document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = true);
            const createBtn = document.getElementById('createBackupBtn');
            if (createBtn) createBtn.disabled = true; // 检查是否存在


            fetch(`/api/backups/${encodedFilename}/restore`, { method: 'POST' })
                .then(response => {
                    // 恢复按钮状态 (确保在 finally 或 then/catch 中都执行)
                    document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = false);
                    if (createBtn) createBtn.disabled = false;

                    if (!response.ok) {
                        // 尝试解析 JSON 错误信息
                        return response.json().then(err => {
                            // 抛出包含服务器错误的 Error 对象
                            throw new Error(err.error || `恢复失败，服务器状态码: ${response.status}`);
                        }).catch(() => {
                            // 如果 JSON 解析失败或没有 error 字段，抛出通用错误
                            throw new Error(`恢复失败，服务器状态码: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) { // API 可能在 200 OK 时也返回错误消息
                        throw new Error(data.error);
                    }
                    showCustomAlert(data.message || `从备份 "${filename}" 恢复成功！`, 'success');
                    if (backupStatus) backupStatus.textContent = '恢复成功！建议刷新页面或重新登录以加载最新数据。';
                    // 恢复后可能需要刷新整个页面或提示用户重新登录，因为数据已改变
                    // fetchBackups(); // 只刷新列表可能不够
                })
                .catch(error => {
                    console.error(`恢复备份 ${filename} 失败:`, error);
                    if (backupStatus) backupStatus.textContent = `恢复失败: ${error.message}`;
                    showCustomAlert(`恢复备份失败: ${error.message}`, 'error');
                    // 确保即使出错也恢复按钮状态（如果上面没恢复的话）
                    document.querySelectorAll('#backup-list-content button').forEach(btn => btn.disabled = false);
                    if (createBtn) createBtn.disabled = false;
                });
        }
        // 如果用户取消，什么也不做
    );
}

// 当DOM加载完成后，如果备份部分可见，则加载数据
document.addEventListener('DOMContentLoaded', () => {
    // 确保 fetchBackups 函数在 showMainSection 中被调用
    // (检查 manager.html 中的 showMainSection 函数，确保它处理 backup-section)
    // 或者，如果默认就显示备份区域，可以在这里直接调用
    // if (document.getElementById('backup-section').classList.contains('active')) {
    //     fetchBackups();
    // }
});

// 确保 showMainSection 函数能处理 backup-section 并调用 fetchBackups
// (这段代码应该放在 global.js 或 manager.html 的 <script> 中，
//  或者在 showMainSection 函数定义的地方修改)
/*
// 在 global.js 或 manager.html 中的 showMainSection 函数里找到相关逻辑并修改/添加：
function showMainSection(sectionIdToShow) {
    // ... (前面的逻辑不变) ...

    if (sectionToShow && !sectionToShow.classList.contains('active')) {
        sectionToShow.classList.add('active');
        let defaultViewId = null;
        // ... (其他 section 的 defaultViewId) ...
        else if (sectionIdToShow === 'backup-section') {
            // 添加对备份板块的处理
            setTimeout(() => {
                if (typeof fetchBackups === 'function') {
                    fetchBackups(); // <--- 调用获取备份列表的函数
                }
            }, 50); // 延迟一点确保元素渲染完成
        }
        // ... (后面的逻辑) ...
    }
    // ... (设置导航激活状态等) ...
}
*/