// group.js - 分组管理前端逻辑

// --- 全局变量 ---
let currentGroupSortParams = []; // 存储当前排序键
let currentGroupSearchTerm = ''; // 当前搜索关键词
const groupIndexToSortKey = { // 列索引到排序键的映射
    0: 1, // ID
    1: 2, // 分组名称
    2: 3  // 客户数量
};
// --- 获取并显示分组列表 ---
function fetchGroupData() {
    const contentDiv = document.getElementById('group-list-content');
    const clearBtn = document.getElementById('groupClearSearchButton');
    contentDiv.innerHTML = '<p>正在加载分组列表...</p>';

    let queryParams = [];
    if (currentGroupSearchTerm) { queryParams.push(`query=${encodeURIComponent(currentGroupSearchTerm)}`); }
    if (currentGroupSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentGroupSortParams.join(','))}`); }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    fetch(`/api/fetch_groups${queryString}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text || '获取数据失败'}`); });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateGroupTable(data.output || ""); // 生成表格
            if (clearBtn) { clearBtn.style.display = currentGroupSearchTerm ? 'inline-block' : 'none'; }
            updateHoverTargets();
        })
        .catch(error => {
            contentDiv.innerHTML = `<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">获取分组列表失败: ${error.message || error}</td></tr></tbody></table></div>`;
            showCustomAlert(`获取分组列表失败: ${error.message || error}`, 'error');
        });
}

// --- 生成分组表格 HTML (已修改操作列) ---
function generateGroupTable(output) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('group-list-content');

    if (lines.length === 0) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">没有找到分组数据。</td></tr></tbody></table></div>';
        return;
    }

    const headers = ['ID', '分组名称', '客户数量', '包含客户 (IDs)', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';

    // 生成支持排序的表头
    headers.forEach((headerText, index) => {
        if (groupIndexToSortKey[index] !== undefined) {
            const sortKey = groupIndexToSortKey[index];
            const currentSort = currentGroupSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            tableHTML += `<th data-sort-index="${index}" onclick="handleGroupSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';

    // 生成表格行数据
    lines.forEach(line => {
        const fields = line.split(';');
        if (fields.length < 3) return;
        const groupId = fields[0];
        const groupName = fields[1] || 'N/A';
        const clientCount = fields[2] || '0';
        const clientIdsStr = fields[3] || '';
        const fullDataEscaped = escape(line); // URL编码完整数据

        tableHTML += `<tr data-id="${groupId}" data-full-group-string="${fullDataEscaped}">`;
        tableHTML += `<td>${groupId}</td>`;
        tableHTML += `<td>${groupName}</td>`;
        tableHTML += `<td>${clientCount}</td>`;
        const clientIdsDisplay = clientIdsStr.split(',').filter(id => id.trim()).join(', ');
        tableHTML += `<td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${clientIdsDisplay || '无'}">${clientIdsDisplay || '-'}</td>`;

        // --- 修改后的操作列 ---
        const role = sessionStorage.getItem("role");
        const isManager = (role === 'manager');

        // 应用 white-space: nowrap 防止按钮换行
        tableHTML += `<td class="action-cell" style="white-space: nowrap;">`;
        // 添加 查看详情 按钮
        tableHTML += `<button class="view-btn icon-btn" onclick="viewGroupDetails('${groupId}')" title="查看详情">
                        <span class="material-icons-outlined">visibility</span>
                      </button> `; // 添加空格

        if (isManager) { // 只有经理显示编辑和删除
            tableHTML += `<button class="edit-btn icon-btn action-requires-manager" onclick="editGroupSetup('${groupId}')" title="编辑">
                            <span class="material-icons-outlined">edit</span>
                          </button> `; // 添加空格
            tableHTML += `<button class="delete-btn icon-btn action-requires-manager" onclick="deleteGroup('${groupId}')" title="删除">
                              <span class="material-icons-outlined">delete</span>
                          </button>`;
        }
        // 如果不是经理，编辑和删除按钮不显示，但查看按钮仍然显示（如果需要，可以调整权限）

        tableHTML += `</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
}

// --- 加载客户列表以供选择 ---
function loadClientsForGroupSelection(selectedClientIds = [], isReadOnly = false) { // 添加 isReadOnly 参数
    const container = document.getElementById('group-client-selection');
    container.innerHTML = '<p>正在加载客户列表...</p>';

    fetch('/api/display_client_ids_names')
        .then(response => response.ok ? response.json() : Promise.reject('加载客户列表失败'))
        .then(data => {
            if (data.error) throw new Error(data.error);
            container.innerHTML = '';
            const clientsOutput = data.output || "";
            if (!clientsOutput) {
                container.innerHTML = '<p>没有可供选择的客户。</p>';
                return;
            }

            const clients = clientsOutput.split(';')
                .map(item => {
                    const parts = item.split(',');
                    if (parts.length >= 2 && parts[0].trim()) {
                        return { id: parts[0].trim(), name: parts[1] || '未知名称' };
                    }
                    return null;
                })
                .filter(c => c !== null);

            if (clients.length === 0) {
                container.innerHTML = '<p>没有可供选择的客户。</p>';
                return;
            }

            clients.forEach(client => {
                const isChecked = selectedClientIds.includes(parseInt(client.id, 10));
                const label = document.createElement('label');
                // *** 在只读模式下添加 disabled 类 ***
                label.className = `neumorphic-checkbox-card hover-target ${isReadOnly ? 'disabled' : ''}`;
                if (isChecked) label.classList.add('selected');

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.name = 'group_clients';
                input.value = client.id;
                input.checked = isChecked;
                input.id = `group-client-${client.id}`;
                input.disabled = isReadOnly; // *** 设置 input 的 disabled 属性 ***

                // 在非只读模式下才添加事件监听
                if (!isReadOnly) {
                    input.addEventListener('change', (event) => {
                        if (event.target.checked) {
                            label.classList.add('selected');
                        } else {
                            label.classList.remove('selected');
                        }
                    });
                }

                const nameSpan = document.createElement('span');
                nameSpan.className = 'client-name';
                nameSpan.textContent = client.name;

                const idSpan = document.createElement('span');
                idSpan.className = 'client-id-display';
                idSpan.textContent = `ID: ${client.id}`;

                label.htmlFor = input.id;
                label.appendChild(input);
                label.appendChild(nameSpan);
                label.appendChild(idSpan);
                container.appendChild(label);
            });
            updateHoverTargets();
        })
        .catch(error => {
            container.innerHTML = `<p style="color: red;">加载客户列表出错: ${error.message || error}</p>`;
            showCustomAlert(`加载客户列表出错: ${error.message || error}`, 'error');
        });
}


// --- 表单重置与准备 ---
function resetAndPrepareGroupAddForm() {
    setGroupFormReadOnly(false); // 确保表单不是只读状态
    const form = document.getElementById('group-form');
    form.reset();
    document.getElementById('editing-group-id').value = '';
    document.getElementById('group-form-title').textContent = '添加新分组';
    document.getElementById('group-submit-btn').textContent = '提交分组信息';
    document.getElementById('group-submit-btn').onclick = submitGroup;
    document.getElementById('group-submit-btn').style.display = 'inline-block'; // 确保提交按钮可见
    document.getElementById('group-cancel-btn').style.display = 'none'; // 隐藏取消按钮

    // 移除可能存在的 "返回列表" 按钮
    const returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove();

    // 清空并重新加载客户选择 (非只读模式)
    const clientSelection = document.getElementById('group-client-selection');
    clientSelection.innerHTML = '<p>正在加载客户列表...</p>';
    loadClientsForGroupSelection([], false); // 传入空的已选列表和 false (非只读)

    // 移除只读模式的类
    document.getElementById('add-group-view').classList.remove('form-view-mode');
}

// --- *** 新增: 设置表单只读状态 *** ---
function setGroupFormReadOnly(isReadOnly) {
    const form = document.getElementById('group-form');
    const formView = document.getElementById('add-group-view'); // 获取表单容器视图

    // 添加/移除 CSS 类以改变整体外观（可选，如果 form-view-mode 有对应样式）
    if (isReadOnly) {
        formView.classList.add('form-view-mode');
    } else {
        formView.classList.remove('form-view-mode');
    }

    // 禁用/启用所有输入框和选择框
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
        el.disabled = isReadOnly;
    });

    // 特别处理客户选择复选框及其标签样式
    const clientSelectionContainer = document.getElementById('group-client-selection');
    clientSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.disabled = isReadOnly;
        const label = clientSelectionContainer.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
            if (isReadOnly) {
                label.classList.add('disabled'); // 添加视觉禁用样式
            } else {
                label.classList.remove('disabled');
            }
        }
    });

    // 禁用/启用 添加/移除 按钮 (如果表单内有动态增减的按钮)
    // form.querySelectorAll('.add-btn, .remove-btn').forEach(btn => btn.disabled = isReadOnly);
}


// --- 填充编辑表单 ---
function populateGroupForm(groupId, fullGroupString) {
    setGroupFormReadOnly(false); // 确保开始填充时表单可写
    const form = document.getElementById('group-form');
    form.reset(); // 先重置

    const fields = fullGroupString.split(';');
    const groupName = fields[1] || '';
    const clientIdsStr = fields[3] || '';
    const selectedClientIds = clientIdsStr.split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);

    document.getElementById('editing-group-id').value = groupId;
    document.getElementById('group-name').value = groupName;

    // 加载客户并选中已关联的 (非只读模式)
    loadClientsForGroupSelection(selectedClientIds, false); // 传入 false
}

// --- 提交新分组 ---
function submitGroup() {
    const form = document.getElementById('group-form');
    const groupName = form.elements['group-name'].value.trim();

    if (!groupName) {
        showCustomAlert('分组名称不能为空！', 'warning');
        return;
    }
    const selectedCheckboxes = form.querySelectorAll('input[name="group_clients"]:checked');
    const selectedClientIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    const clientIdsString = selectedClientIds.join(',');
    const groupDataString = `0;${groupName};${clientIdsString}`;

    fetch('/api/add_group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupData: groupDataString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '添加分组成功！', 'success');
            resetAndPrepareGroupAddForm();
            showView('group-list-view', 'group-section');
            // fetchGroupData(); // showView 通常会触发加载
        })
        .catch(error => {
            showCustomAlert('添加分组失败: ' + (error.message || '未知错误'), 'error');
        });
}

// --- *** 新增: 查看分组详情 *** ---
function viewGroupDetails(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    if (!row) { showCustomAlert("无法加载分组数据。", 'error'); return; }
    const fullGroupString = unescape(row.dataset.fullGroupString);
    if (!fullGroupString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true); // 锁定应用状态

    // 填充表单，但这次要确保客户列表是只读的
    // 解析数据获取选中的客户ID
    const fields = fullGroupString.split(';');
    const selectedClientIds = (fields[3] || '').split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);

    // 填充基础信息
    const form = document.getElementById('group-form');
    form.reset();
    document.getElementById('editing-group-id').value = groupId; // 虽然是查看，但ID还是需要的
    document.getElementById('group-name').value = fields[1] || '';

    // 加载客户列表并设为只读
    loadClientsForGroupSelection(selectedClientIds, true); // 传入 true 表示只读

    showView('add-group-view', 'group-section'); // 切换到表单视图
    setGroupFormReadOnly(true); // 将整个表单设为只读

    // 更新标题和按钮状态
    document.getElementById('group-form-title').textContent = '分组详细信息'; // 改标题
    document.getElementById('group-submit-btn').style.display = 'none'; // 隐藏提交按钮
    document.getElementById('group-cancel-btn').style.display = 'none'; // 隐藏取消按钮

    // 动态添加“返回列表”按钮
    const formActions = document.querySelector('#add-group-view .form-actions');
    let returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove(); // 如果已存在则移除

    returnBtn = document.createElement('button');
    returnBtn.id = 'group-return-btn';
    returnBtn.type = 'button';
    returnBtn.className = 'section-btn cancel-btn hover-target'; // 使用取消按钮的样式
    returnBtn.textContent = '返回列表';
    returnBtn.style.marginLeft = '0px'; // 居中或调整间距
    returnBtn.onclick = () => {
        setAppLockedState(false); // 解锁应用状态
        resetAndPrepareGroupAddForm(); // 重置表单为添加状态
        showView('group-list-view', 'group-section'); // 返回列表视图
    };
    formActions.appendChild(returnBtn); // 添加到表单操作区域
    o(returnBtn); // 应用自定义光标效果 (如果你的 global.js 里有 o 函数)

    window.scrollTo(0, 0); // 滚动到页面顶部
}


// --- 编辑分组设置 ---
function editGroupSetup(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    if (!row) { showCustomAlert("无法加载分组数据。", 'error'); return; }
    const fullGroupString = unescape(row.dataset.fullGroupString);
    if (!fullGroupString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true);
    populateGroupForm(groupId, fullGroupString); // 填充表单（此时客户列表应为可编辑）

    document.getElementById('group-form-title').textContent = '编辑分组信息';
    const submitBtn = document.getElementById('group-submit-btn');
    submitBtn.textContent = '更新分组信息';
    submitBtn.onclick = submitGroupUpdate;
    submitBtn.style.display = 'inline-block'; // 显示提交按钮

    const cancelBtn = document.getElementById('group-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelGroupUpdate;

    // 移除可能存在的“返回列表”按钮
    const returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove();

    showView('add-group-view', 'group-section');
    setGroupFormReadOnly(false); // 确保表单可编辑
    window.scrollTo(0, 0);
}

// --- 提交分组更新 ---
function submitGroupUpdate() {
    const form = document.getElementById('group-form');
    const groupId = document.getElementById('editing-group-id').value;
    const groupName = form.elements['group-name'].value.trim();

    if (!groupName) {
        showCustomAlert('分组名称不能为空！', 'warning');
        return;
    }
    const selectedCheckboxes = form.querySelectorAll('input[name="group_clients"]:checked');
    const selectedClientIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    const clientIdsString = selectedClientIds.join(',');
    const groupDataString = `${groupId};${groupName};${clientIdsString}`;

    fetch('/api/update_group', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupData: groupDataString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '分组信息已更新！', 'success');
            setAppLockedState(false);
            resetAndPrepareGroupAddForm();
            showView('group-list-view', 'group-section');
            // fetchGroupData(); // showView 通常会触发加载
        })
        .catch(error => {
            showCustomAlert('更新分组失败: ' + (error.message || '未知错误'), 'error');
        });
}


// --- 取消更新 ---
function cancelGroupUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失。",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false);
            resetAndPrepareGroupAddForm();
            showView('group-list-view', 'group-section');
        }
    );
}

// --- 删除分组 ---
function deleteGroup(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    const groupName = row ? row.cells[1].textContent : `ID ${groupId}`;

    showCustomConfirm(
        `分组 "${groupName}" 将被永久删除，此操作无法撤销。`,
        `确定要删除此分组吗？`,
        () => { // onConfirm
            fetch(`/api/delete_group/${groupId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert('删除分组失败：' + data.error, 'error');
                    } else {
                        showCustomAlert(data.output || `分组 "${groupName}" 已删除。`, 'success');
                        fetchGroupData(); // 刷新列表
                    }
                })
                .catch(error => {
                    showCustomAlert("删除分组时发生网络错误。", 'error');
                });
        }
    );
}

// --- 搜索处理 ---
function handleGroupSearchInputKey(event) {
    if (event.key === 'Enter') {
        performGroupSearch();
    }
}

function performGroupSearch() {
    currentGroupSearchTerm = document.getElementById('groupSearchInput').value.trim();
    fetchGroupData();
}

function clearGroupSearch() {
    const searchInput = document.getElementById('groupSearchInput');
    if (searchInput) searchInput.value = '';
    currentGroupSearchTerm = '';
    fetchGroupData();
    const clearBtn = document.getElementById('groupClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

// --- 排序处理 ---
function handleGroupSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);

    if (groupIndexToSortKey[columnIndex] === undefined) {
        return;
    }
    const sortKey = groupIndexToSortKey[columnIndex];
    const existingIndex = currentGroupSortParams.findIndex(p => Math.abs(p) === sortKey);

    if (existingIndex === -1) {
        currentGroupSortParams.push(sortKey);
    } else {
        const currentValue = currentGroupSortParams[existingIndex];
        if (currentValue > 0) {
            currentGroupSortParams[existingIndex] = -sortKey;
        } else {
            currentGroupSortParams.splice(existingIndex, 1);
        }
    }
    console.log("新的分组排序参数:", currentGroupSortParams);
    fetchGroupData();
}