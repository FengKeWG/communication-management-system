let currentGroupSortParams = [];
let currentGroupGeneralSearch = '';
let currentGroupNameSearch = '';
let currentGroupClientCountSearch = '';
const groupIndexToSortKey = { 0: 1, 1: 2, 2: 3 };

function fetchGroupData() {
    const contentDiv = document.getElementById('group-list-content');
    const clearBtn = document.getElementById('groupClearSearchButton');
    const resultCountDiv = document.getElementById('group-search-result-count');
    contentDiv.innerHTML = '<p>正在加载分组列表...</p>';
    if (resultCountDiv) resultCountDiv.style.display = 'none';
    let queryParams = [];
    if (currentGroupGeneralSearch) queryParams.push(`query=${encodeURIComponent(currentGroupGeneralSearch)}`);
    if (currentGroupNameSearch) queryParams.push(`name=${encodeURIComponent(currentGroupNameSearch)}`);
    if (currentGroupClientCountSearch) queryParams.push(`client_count=${encodeURIComponent(currentGroupClientCountSearch)}`);
    if (currentGroupSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentGroupSortParams.join(','))}`); }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    fetch(`/api/fetch_groups${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            generateGroupTable(data.output, data.count);
            const hasSearchTerms = currentGroupGeneralSearch || currentGroupNameSearch || currentGroupClientCountSearch;
            if (clearBtn) { clearBtn.style.display = hasSearchTerms ? 'inline-block' : 'none'; }
            updateHoverTargets();
        })
        .catch(error => {
            contentDiv.innerHTML = `<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">获取分组列表失败: ${error.message || error}</td></tr></tbody></table></div>`;
            showCustomAlert(`获取分组列表失败: ${error.message || error}`, 'error');
            if (resultCountDiv) resultCountDiv.style.display = 'none';
        });
}

function generateGroupTable(output, totalCount) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('group-list-content');
    const resultCountDiv = document.getElementById('group-search-result-count');
    if (resultCountDiv) {
        if (lines.length > 0 || (typeof totalCount !== 'undefined' && totalCount > 0)) {
            const countToShow = (typeof totalCount !== 'undefined' && totalCount >= 0) ? totalCount : lines.length;
            resultCountDiv.textContent = `找到 ${countToShow} 条结果`;
            resultCountDiv.style.display = 'inline-block';
        } else {
            resultCountDiv.textContent = '没有找到匹配的结果';
            resultCountDiv.style.display = 'inline-block';
        }
    }
    if (lines.length === 0 && (typeof totalCount === 'undefined' || totalCount === 0)) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">没有找到分组数据。</td></tr></tbody></table></div>';
        return;
    }
    const headers = ['ID', '分组名称', '客户数量', '包含客户 (IDs)', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';
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
    lines.forEach(line => {
        const fields = line.split('\x1C');
        if (fields.length < 3) return;
        const groupId = fields[0];
        const groupName = fields[1] || 'N/A';
        const clientCount = fields[2] || '0';
        const clientIdsStr = fields[3] || '';
        const fullDataEscaped = escape(line);
        tableHTML += `<tr data-id="${groupId}" data-full-group-string="${fullDataEscaped}">`;
        tableHTML += `<td>${groupId}</td>`;
        tableHTML += `<td>${groupName}</td>`;
        tableHTML += `<td>${clientCount}</td>`;
        const clientIdsDisplay = clientIdsStr.split('\x1D').filter(id => id.trim()).join(', ');
        tableHTML += `<td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${clientIdsDisplay || '无'}">${clientIdsDisplay || '-'}</td>`;
        tableHTML += `<td class="action-cell" style="white-space: nowrap;"></td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    const tableRows = container.querySelectorAll('.data-table tbody tr');
    const role = sessionStorage.getItem("role");
    const isManager = (role === 'manager');
    tableRows.forEach(row => {
        const groupId = row.dataset.id;
        const actionCell = row.querySelector('.action-cell');
        if (groupId && actionCell) {
            let buttonsHTML = `<button class="view-btn icon-btn" onclick="viewGroupDetails('${groupId}')" title="查看详情">
                                   <span class="material-icons-outlined">visibility</span>
                                </button>`;
            if (isManager) {
                buttonsHTML += ` <button class="edit-btn icon-btn action-requires-manager" onclick="editGroupSetup('${groupId}')" title="编辑">
                                      <span class="material-icons-outlined">edit</span>
                                   </button>
                                   <button class="delete-btn icon-btn action-requires-manager" onclick="deleteGroup('${groupId}')" title="删除">
                                       <span class="material-icons-outlined">delete</span>
                                   </button>`;
            }
            actionCell.innerHTML = buttonsHTML;
        }
    });
    updateHoverTargets();
}

function loadClientsForGroupSelection(selectedClientIds = [], isReadOnly = false) {
    const container = document.getElementById('group-client-selection');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names')
        .then(response => response.ok ? response.json() : Promise.reject('加载客户列表失败'))
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            container.innerHTML = '';
            const clientsOutput = data.output;
            if (!clientsOutput) {
                container.innerHTML = '<p>没有可供选择的客户。</p>';
                return;
            }
            const clients = clientsOutput.split('\x1C')
                .map(item => {
                    const parts = item.split('\x1D');
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
                label.className = `neumorphic-checkbox-card hover-target ${isReadOnly ? 'disabled' : ''}`;
                if (isChecked) label.classList.add('selected');
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.name = 'group_clients';
                input.value = client.id;
                input.checked = isChecked;
                input.id = `group-client-${client.id}`;
                input.disabled = isReadOnly;
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

function resetAndPrepareGroupAddForm() {
    setGroupFormReadOnly(false);
    const form = document.getElementById('group-form');
    form.reset();
    document.getElementById('editing-group-id').value = '';
    document.getElementById('group-form-title').textContent = '添加新分组';
    document.getElementById('group-submit-btn').textContent = '提交分组信息';
    document.getElementById('group-submit-btn').onclick = submitGroup;
    document.getElementById('group-submit-btn').style.display = 'inline-block';
    document.getElementById('group-cancel-btn').style.display = 'none';
    const returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove();
    const clientSelection = document.getElementById('group-client-selection');
    clientSelection.innerHTML = '<p>正在加载客户列表...</p>';
    loadClientsForGroupSelection([], false);
    document.getElementById('add-group-view').classList.remove('form-view-mode');
}

function setGroupFormReadOnly(isReadOnly) {
    const form = document.getElementById('group-form');
    const formView = document.getElementById('add-group-view');
    if (isReadOnly) {
        formView.classList.add('form-view-mode');
    } else {
        formView.classList.remove('form-view-mode');
    }
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
        el.disabled = isReadOnly;
    });
    const clientSelectionContainer = document.getElementById('group-client-selection');
    clientSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.disabled = isReadOnly;
        const label = clientSelectionContainer.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
            if (isReadOnly) {
                label.classList.add('disabled');
            } else {
                label.classList.remove('disabled');
            }
        }
    });
}

function populateGroupForm(groupId, fullGroupString) {
    setGroupFormReadOnly(false);
    const form = document.getElementById('group-form');
    form.reset();
    const fields = fullGroupString.split('\x1C');
    const groupName = fields[1] || '';
    const clientIdsStr = fields[3] || '';
    const selectedClientIds = clientIdsStr.split('\x1D')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);
    document.getElementById('editing-group-id').value = groupId;
    document.getElementById('group-name').value = groupName;
    loadClientsForGroupSelection(selectedClientIds, false);
}

function submitGroup() {
    const form = document.getElementById('group-form');
    const groupName = form.elements['group-name'].value.trim();
    if (!groupName) {
        showCustomAlert('分组名称不能为空！', 'warning');
        return;
    }
    const selectedCheckboxes = form.querySelectorAll('input[name="group_clients"]:checked');
    const selectedClientIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    const clientIdsString = selectedClientIds.join('\x1D');
    const groupIdToSend = document.getElementById('editing-group-id').value || '0';
    const groupDataString = `${groupIdToSend}\x1C${groupName}\x1C${clientIdsString}`;
    fetch('/api/add_group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupData: groupDataString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            showCustomAlert(data.output, 'success');
            resetAndPrepareGroupAddForm();
            showView('group-list-view', 'group-section');
        })
        .catch(error => {
            showCustomAlert('添加分组失败: ' + (error.message || '未知错误'), 'error');
        });
}

function viewGroupDetails(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    if (!row) { showCustomAlert("无法加载分组数据。", 'error'); return; }
    const fullGroupString = unescape(row.dataset.fullGroupString);
    if (!fullGroupString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    const fields = fullGroupString.split('\x1C');
    const selectedClientIds = (fields[3] || '').split('\x1D')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);
    const form = document.getElementById('group-form');
    form.reset();
    document.getElementById('editing-group-id').value = groupId;
    document.getElementById('group-name').value = fields[1] || '';
    loadClientsForGroupSelection(selectedClientIds, true);
    showView('add-group-view', 'group-section');
    setGroupFormReadOnly(true);
    document.getElementById('group-form-title').textContent = '分组详细信息';
    document.getElementById('group-submit-btn').style.display = 'none';
    document.getElementById('group-cancel-btn').style.display = 'none';
    const formActions = document.querySelector('#add-group-view .form-actions');
    let returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove();
    returnBtn = document.createElement('button');
    returnBtn.id = 'group-return-btn';
    returnBtn.type = 'button';
    returnBtn.className = 'section-btn cancel-btn hover-target';
    returnBtn.textContent = '返回列表';
    returnBtn.style.marginLeft = '0px';
    returnBtn.onclick = () => {
        setAppLockedState(false);
        resetAndPrepareGroupAddForm();
        showView('group-list-view', 'group-section');
    };
    formActions.appendChild(returnBtn);
    o(returnBtn);
    window.scrollTo(0, 0);
}

function editGroupSetup(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    if (!row) { showCustomAlert("无法加载分组数据。", 'error'); return; }
    const fullGroupString = unescape(row.dataset.fullGroupString);
    if (!fullGroupString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateGroupForm(groupId, fullGroupString);
    document.getElementById('group-form-title').textContent = '编辑分组信息';
    const submitBtn = document.getElementById('group-submit-btn');
    submitBtn.textContent = '更新分组信息';
    submitBtn.onclick = submitGroupUpdate;
    submitBtn.style.display = 'inline-block';
    const cancelBtn = document.getElementById('group-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelGroupUpdate;
    const returnBtn = document.getElementById('group-return-btn');
    if (returnBtn) returnBtn.remove();
    showView('add-group-view', 'group-section');
    setGroupFormReadOnly(false);
    window.scrollTo(0, 0);
}

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
    const clientIdsString = selectedClientIds.join('\x1D');
    const groupDataString = `${groupId}\x1C${groupName}\x1C${clientIdsString}`;
    fetch('/api/update_group', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupData: groupDataString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            showCustomAlert(data.output, 'success');
            setAppLockedState(false);
            resetAndPrepareGroupAddForm();
            showView('group-list-view', 'group-section');
        })
        .catch(error => {
            showCustomAlert('更新分组失败: ' + (error.message || '未知错误'), 'error');
        });
}

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

function deleteGroup(groupId) {
    const row = document.querySelector(`#group-list-content tr[data-id="${groupId}"]`);
    const groupName = row ? row.cells[1].textContent : `ID ${groupId}`;
    showCustomConfirm(
        `分组 "${groupName}" 将被永久删除，此操作无法撤销。`,
        `确定要删除此分组吗？`,
        () => {
            fetch(`/api/delete_group/${groupId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert(data.error, 'error');
                    } else {
                        showCustomAlert(data.output, 'success');
                        fetchGroupData();
                    }
                })
                .catch(error => {
                    showCustomAlert("删除分组时发生网络错误。", 'error');
                });
        }
    );
}

function handleGroupSearchInputKey(event) {
    if (event.key === 'Enter') {
        performGroupSearch();
    }
}

function performGroupSearch() {
    currentGroupGeneralSearch = document.getElementById('groupSearchInput').value.trim();
    currentGroupNameSearch = document.getElementById('groupNameSearchInput').value.trim();
    currentGroupClientCountSearch = document.getElementById('groupClientCountSearchInput').value.trim();
    fetchGroupData();
}

function clearGroupSearch() {
    const inputs = ['groupSearchInput', 'groupNameSearchInput', 'groupClientCountSearchInput'];
    inputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) inputElement.value = '';
    });
    currentGroupGeneralSearch = '';
    currentGroupNameSearch = '';
    currentGroupClientCountSearch = '';
    const detailedArea = document.getElementById('detailed-group-search-area');
    const toggleBtn = document.getElementById('toggleDetailedGroupSearchBtn');
    if (detailedArea) detailedArea.classList.remove('show');
    if (toggleBtn) toggleBtn.classList.remove('active');
    fetchGroupData();
    const clearBtn = document.getElementById('groupClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

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