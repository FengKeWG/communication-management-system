let currentUserSortParams = [];
let currentUserSearchTerm = '';
const userIndexToSortKeyRevised = { 0: 1, 1: 2, 2: 3, 3: 4 };
const userRoleSelect = document.getElementById('user-role');
const salesLinkSection = document.getElementById('user-sales-link-section');
const salesSelection = document.getElementById('user-sales-selection');
if (userRoleSelect && salesLinkSection && salesSelection) {
    userRoleSelect.addEventListener('change', function () {
        const isSalesRole = (this.value === 'sales');
        salesLinkSection.style.display = isSalesRole ? 'block' : 'none';
        if (isSalesRole) {
            loadUnlinkedSalespersons();
        } else {
            salesSelection.value = "0";
        }
    });
} else {
    console.warn("User form role select or sales link section not found.");
}
function loadUnlinkedSalespersons(selectedSalesId = null) {
    if (!salesSelection) return;
    const currentEditingUserId = document.getElementById('editing-user-id').value;
    salesSelection.innerHTML = '<option value="0">加载中...</option>';
    fetch('/api/fetch_unlinked_sales')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load unlinked salespersons');
            return response.json();
        })
        .then(data => {
            salesSelection.innerHTML = '<option value="0">-- 选择业务员 --</option>';
            let foundSelected = false;
            if (data.output) {
                const salesList = data.output.split(';');
                salesList.forEach(item => {
                    const parts = item.split(',');
                    if (parts.length === 2) {
                        const id = parts[0].trim();
                        const name = parts[1].trim();
                        if (id && name) {
                            const option = document.createElement('option');
                            option.value = id;
                            option.textContent = `${name} (ID: ${id})`;
                            if (selectedSalesId && id === selectedSalesId) {
                                option.selected = true;
                                foundSelected = true;
                            }
                            salesSelection.appendChild(option);
                        }
                    }
                });
            }
            if (selectedSalesId && selectedSalesId !== "0" && !foundSelected && currentEditingUserId) {
                console.warn(`User ${currentEditingUserId} is linked to Sales ID ${selectedSalesId}, which is already linked or unavailable.`);
                const option = document.createElement('option');
                option.value = selectedSalesId;
                option.textContent = `当前关联: ID ${selectedSalesId} (已关联)`;
                option.selected = true;
                salesSelection.appendChild(option);
            }
            if (salesSelection.options.length <= 1 && !(selectedSalesId && selectedSalesId !== "0")) {
                const emptyOption = document.createElement('option');
                emptyOption.value = "0";
                emptyOption.textContent = "无未关联业务员";
                emptyOption.disabled = true;
                if (salesSelection.options[0].value === "0") salesSelection.remove(0);
                salesSelection.appendChild(emptyOption);
                salesSelection.value = "0";
            }
        })
        .catch(error => {
            console.error("Error loading unlinked salespersons:", error);
            salesSelection.innerHTML = '<option value="0">加载失败</option>';
            showCustomAlert("加载未关联业务员列表失败", "error");
        });
}
function fetchUserData() {
    const contentDiv = document.getElementById('user-list-content');
    const clearBtn = document.getElementById('userClearSearchButton');
    contentDiv.innerHTML = '<p>正在加载用户列表...</p>';
    let queryParams = [];
    if (currentUserSearchTerm) { queryParams.push(`query=${encodeURIComponent(currentUserSearchTerm)}`); }
    if (currentUserSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentUserSortParams.join(','))}`); }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    fetch(`/api/fetch_users${queryString}`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateUserTable(data.output || "");
            if (clearBtn) clearBtn.style.display = currentUserSearchTerm ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="5">获取用户列表失败: ${error.message || error}</td></tr></tbody></table>`;
            showCustomAlert(`获取用户列表失败: ${error.message || error}`, 'error');
        });
}
function generateUserTable(output) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('user-list-content');
    const role = sessionStorage.getItem("role");
    if (lines.length === 0) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">没有找到用户数据。</td></tr></tbody></table></div>';
        return;
    }
    const headers = ['ID', '账号', '角色', '关联业务员ID', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';
    headers.forEach((headerText, index) => {
        const actionColumnIndex = headers.length - 1;
        if (index !== actionColumnIndex && userIndexToSortKeyRevised[index] !== undefined) {
            const sortKey = userIndexToSortKeyRevised[index];
            const currentSort = currentUserSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            tableHTML += `<th data-sort-index="${index}" onclick="handleUserSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';
    lines.forEach(line => {
        const fields = line.split(';');
        if (fields.length < 5 || !fields[0]) return;
        const userId = fields[0];
        const username = fields[1] || '';
        const userRole = fields[3] || '';
        const salesId = fields[4] || '0';
        const userDataForEdit = escape(`${userId};${username};;${userRole};${salesId}`);
        tableHTML += `<tr data-id="${userId}" data-user-string="${userDataForEdit}">`;
        tableHTML += `<td>${userId}</td>`;
        tableHTML += `<td>${username}</td>`;
        tableHTML += `<td>${userRole}</td>`;
        tableHTML += `<td>${(salesId === '0' || salesId === '-1') ? '-' : salesId}</td>`;
        tableHTML += `<td class="action-cell" style="white-space: nowrap;">`;
        tableHTML += `<button class="view-btn icon-btn" onclick="viewUserDetails('${userId}')" title="查看详情">
                            <span class="material-icons-outlined">visibility</span>
                        </button>`;
        if (role === 'manager') {
            tableHTML += `<button class="edit-btn icon-btn action-requires-manager" onclick="editUserSetup('${userId}')" title="编辑用户">
                                <span class="material-icons-outlined">edit</span>
                           </button>
                           <button class="delete-btn icon-btn action-requires-manager" onclick="deleteUser('${userId}')" title="删除用户">
                                <span class="material-icons-outlined">delete</span>
                           </button>`;
        }
        tableHTML += `</td>`;
        tableHTML += `</tr>`;
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    updateHoverTargets();
}
function handleUserSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);
    if (userIndexToSortKeyRevised[columnIndex] === undefined) return;
    const sortKey = userIndexToSortKeyRevised[columnIndex];
    const existingIndex = currentUserSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) {
        currentUserSortParams = [sortKey];
    } else {
        const currentValue = currentUserSortParams[existingIndex];
        if (currentValue > 0) {
            currentUserSortParams[existingIndex] = -sortKey;
        } else {
            currentUserSortParams.splice(existingIndex, 1);
        }
    }
    fetchUserData();
}
function handleUserSearchInputKey(event) {
    if (event.key === 'Enter') performUserSearch();
}
function performUserSearch() {
    currentUserSearchTerm = document.getElementById('userSearchInput').value.trim();
    fetchUserData();
}
function clearUserSearch() {
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) searchInput.value = '';
    currentUserSearchTerm = '';
    fetchUserData();
    const clearBtn = document.getElementById('userClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}
function resetAndPrepareUserAddForm() {
    setUserFormReadOnly(false);
    const form = document.getElementById('user-form');
    form.reset();
    document.getElementById('editing-user-id').value = '';
    document.getElementById('user-form-title').textContent = '添加新用户';
    const passwordInput = document.getElementById('user-password');
    passwordInput.placeholder = '添加时必需，编辑时留空则不修改';
    passwordInput.required = true;
    document.getElementById('user-submit-btn').textContent = '提交用户信息';
    document.getElementById('user-submit-btn').onclick = submitUser;
    document.getElementById('user-submit-btn').style.display = 'inline-block';
    document.getElementById('user-cancel-btn').style.display = 'none';
    if (salesLinkSection) salesLinkSection.style.display = 'none';
    if (salesSelection) salesSelection.innerHTML = '<option value="0">-- 选择业务员 --</option>';
    const tempHidden = document.getElementById('hidden-editing-sales-id');
    if (tempHidden) tempHidden.remove();
    const returnBtn = document.getElementById('user-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-user-view').classList.remove('form-view-mode');
    if (userRoleSelect) {
        userRoleSelect.dispatchEvent(new Event('change'));
    }
    setAppLockedState(false);
}
function setUserFormReadOnly(isReadOnly) {
    const form = document.getElementById('user-form');
    const formView = document.getElementById('add-user-view');
    if (isReadOnly) formView.classList.add('form-view-mode');
    else formView.classList.remove('form-view-mode');
    form.querySelectorAll('input:not([type="hidden"]), select').forEach(el => el.disabled = isReadOnly);
}
function submitUser() {
    const form = document.getElementById('user-form');
    const usernameInput = form.querySelector('#user-username');
    const passwordInput = form.querySelector('#user-password');
    const roleSelect = form.querySelector('#user-role');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleSelect.value;
    let salesId = "0";
    if (!username || !password || !role) {
        showCustomAlert('账号、密码和角色都不能为空！', 'warning');
        return;
    }
    if (role === 'sales') {
        salesId = salesSelection ? salesSelection.value : "0";
        if (salesId === "0") {
            showCustomAlert('请为业务员角色选择一个关联的业务员记录！', 'warning');
            return;
        }
    }
    const finalUserString = `0;${username};${password};${role};${salesId}`;
    fetch('/api/add_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: finalUserString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            showCustomAlert(data.output || '添加用户成功！', 'success');
            resetAndPrepareUserAddForm();
            showView('user-list-view', 'user-section');
        })
        .catch(error => {
            const errorMsg = error.message || '添加用户时发生未知错误';
            showCustomAlert('添加用户失败: ' + errorMsg, 'error');
        });
}
function viewUserDetails(userId) {
    const row = document.querySelector(`#user-list-content tr[data-id="${userId}"]`);
    if (!row) { showCustomAlert("无法加载用户数据。", 'error'); return; }
    const userDataString = unescape(row.dataset.userString);
    if (!userDataString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateUserForm(userId, userDataString);
    showView('add-user-view', 'user-section');
    setUserFormReadOnly(true);
    document.getElementById('user-form-title').textContent = '用户详细信息';
    document.getElementById('user-submit-btn').style.display = 'none';
    document.getElementById('user-cancel-btn').style.display = 'none';
    const formActions = document.querySelector('#add-user-view .form-actions');
    let returnBtn = document.getElementById('user-return-btn');
    if (!returnBtn) {
        returnBtn = document.createElement('button');
        returnBtn.id = 'user-return-btn';
        returnBtn.type = 'button';
        returnBtn.className = 'section-btn cancel-btn hover-target';
        returnBtn.textContent = '返回列表';
        returnBtn.style.marginLeft = '15px';
        returnBtn.onclick = () => {
            setAppLockedState(false);
            resetAndPrepareUserAddForm();
            showView('user-list-view', 'user-section');
        };
        formActions.appendChild(returnBtn);
        o(returnBtn);
    }
    window.scrollTo(0, 0);
}
function editUserSetup(userId) {
    const row = document.querySelector(`#user-list-content tr[data-id="${userId}"]`);
    if (!row) { showCustomAlert("无法加载用户数据。", 'error'); return; }
    const userDataString = unescape(row.dataset.userString);
    if (!userDataString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateUserForm(userId, userDataString);
    document.getElementById('user-form-title').textContent = '编辑用户信息';
    const submitBtn = document.getElementById('user-submit-btn');
    submitBtn.textContent = '更新用户信息';
    submitBtn.onclick = submitUserUpdate;
    submitBtn.style.display = 'inline-block';
    const cancelBtn = document.getElementById('user-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelUserUpdate;
    const returnBtn = document.getElementById('user-return-btn');
    if (returnBtn) returnBtn.remove();
    const passwordInput = document.getElementById('user-password');
    passwordInput.placeholder = '留空表示不修改密码';
    passwordInput.required = false;
    showView('add-user-view', 'user-section');
    setUserFormReadOnly(false);
    window.scrollTo(0, 0);
}
function populateUserForm(userId, userDataString) {
    const form = document.getElementById('user-form');
    form.reset();
    document.getElementById('editing-user-id').value = userId;
    const fields = userDataString.split(';');
    if (fields.length < 5) {
        console.error("PopulateUserForm: Invalid userDataString format", userDataString);
        showCustomAlert("加载用户数据格式错误", "error");
        return;
    }
    form.elements['user-username'].value = fields[1] || '';
    form.elements['user-role'].value = fields[3] || '';
    const salesId = fields[4] || '0';
    form.elements['user-password'].value = '';
    if (userRoleSelect) {
        userRoleSelect.dispatchEvent(new Event('change'));
    } else {
        console.warn("populateUserForm: userRoleSelect not found");
    }
    if (fields[3] === 'sales' && salesId !== '0') {
        loadUnlinkedSalespersons(salesId);
    } else if (salesSelection) {
        salesSelection.value = "0";
    }
}
function submitUserUpdate() {
    const form = document.getElementById('user-form');
    const userId = document.getElementById('editing-user-id').value;
    const username = form.elements['user-username'].value.trim();
    const password = form.elements['user-password'].value.trim();
    const role = form.elements['user-role'].value;
    let salesId = "0";
    if (!username || !role) {
        showCustomAlert('账号和角色不能为空！', 'warning');
        return;
    }
    if (role === 'sales') {
        salesId = salesSelection ? salesSelection.value : "0";
        if (salesId === "0") {
            showCustomAlert('请为业务员角色选择一个关联的业务员记录！', 'warning');
            return;
        }
    }
    const finalUserString = `${userId};${username};${password};${role};${salesId}`;
    fetch('/api/update_user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: finalUserString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '用户信息已更新！', 'success');
            setAppLockedState(false);
            resetAndPrepareUserAddForm();
            showView('user-list-view', 'user-section');
        })
        .catch(error => {
            const errorMsg = error.message || '未知错误';
            showCustomAlert('更新用户失败: ' + errorMsg, 'error');
            setAppLockedState(false);
        });
    const tempHidden = document.getElementById('hidden-editing-sales-id');
    if (tempHidden) tempHidden.remove();
}
function cancelUserUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失。",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false);
            resetAndPrepareUserAddForm();
            showView('user-list-view', 'user-section');
        }
    );
}
function deleteUser(userId) {
    showCustomConfirm(
        `用户 ID 为 ${userId} 的账号将被永久删除，此操作无法撤销。`,
        `确定要删除此用户吗？`,
        () => {
            fetch(`/api/delete_user/${userId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert('删除用户失败：' + data.error, 'error');
                    } else {
                        showCustomAlert(data.output || `用户 ${userId} 已删除。`, 'success');
                        fetchUserData();
                    }
                })
                .catch(error => {
                    showCustomAlert("删除用户时发生网络错误。", 'error');
                });
        }
    );
}