let currentUserSortParams = [];
let currentUserSearchTerm = '';
const userIndexToSortKeyRevised = { 0: 1, 1: 2, 2: 3, 3: 4 };
const userRoleSelect = document.getElementById('user-role');
const salesLinkSection = document.getElementById('user-sales-link-section'); // 使用 select 的版本
const salesSelection = document.getElementById('user-sales-selection');

if (userRoleSelect && salesLinkSection && salesSelection) {
    userRoleSelect.addEventListener('change', function () {
        const isSalesRole = (this.value === 'sales');
        salesLinkSection.style.display = isSalesRole ? 'block' : 'none';
        if (isSalesRole) {
            // 只有在选择 'sales' 时才加载未关联的业务员
            loadUnlinkedSalespersons();
        } else {
            // 如果切换到非 sales 角色，重置 sales_id 选择
            salesSelection.value = "0";
        }
        // 如果用手动输入版本
        // if (salesLinkSectionManual && salesIdInput) {
        //     salesLinkSectionManual.style.display = isSalesRole ? 'block' : 'none';
        //     if (!isSalesRole) {
        //         salesIdInput.value = "0"; // 重置
        //     }
        // }
    });
} else {
    console.warn("User form role select or sales link section not found.");
}

function loadUnlinkedSalespersons(selectedSalesId = null) { // 接受一个可选的预选ID
    if (!salesSelection) return;
    const currentEditingUserId = document.getElementById('editing-user-id').value; // 获取当前正在编辑的用户ID (如果有)

    salesSelection.innerHTML = '<option value="0">加载中...</option>'; // 清空并显示加载状态

    fetch('/api/fetch_unlinked_sales')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load unlinked salespersons');
            return response.json();
        })
        .then(data => {
            salesSelection.innerHTML = '<option value="0">-- 选择业务员 --</option>'; // 重置默认选项
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
                                option.selected = true; // 预选
                                foundSelected = true;
                            }
                            salesSelection.appendChild(option);
                        }
                    }
                });
            }

            // --- 处理编辑时的情况 ---
            // 如果提供了 selectedSalesId 但在未关联列表中未找到
            // 这意味着当前用户正关联着一个 *已经* 被其他用户关联的业务员
            // 需要单独获取这个业务员信息并添加到列表（通常设为 disabled 或特殊标记）
            if (selectedSalesId && selectedSalesId !== "0" && !foundSelected && currentEditingUserId) {
                // 为了简单起见，我们先只添加一个表示已关联的选项
                // 更好的做法是再发起一个请求获取这个 specific sales ID 的名字
                console.warn(`User ${currentEditingUserId} is linked to Sales ID ${selectedSalesId}, which is already linked or unavailable.`);
                const option = document.createElement('option');
                option.value = selectedSalesId;
                option.textContent = `当前关联: ID ${selectedSalesId} (已关联)`;
                option.selected = true;
                // option.disabled = true; // 可以禁用，防止误选其他未关联的
                salesSelection.appendChild(option);
            }

            // 如果没有未关联的业务员
            if (salesSelection.options.length <= 1 && !(selectedSalesId && selectedSalesId !== "0")) {
                // 如果列表为空（只有默认选项），并且不是编辑一个已关联的用户
                const emptyOption = document.createElement('option');
                emptyOption.value = "0";
                emptyOption.textContent = "无未关联业务员";
                emptyOption.disabled = true;
                // 移除默认的 "选择业务员" 选项
                if (salesSelection.options[0].value === "0") salesSelection.remove(0);
                salesSelection.appendChild(emptyOption);
                salesSelection.value = "0"; // 确保值是 0
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
    const clearBtn = document.getElementById('userClearSearchButton'); // 修正ID
    contentDiv.innerHTML = '<p>正在加载用户列表...</p>';
    let queryParams = [];
    if (currentUserSearchTerm) { queryParams.push(`query=${encodeURIComponent(currentUserSearchTerm)}`); }
    if (currentUserSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentUserSortParams.join(','))}`); }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    fetch(`/api/fetch_users${queryString}`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateUserTable(data.output || ""); // 生成表格
            if (clearBtn) clearBtn.style.display = currentUserSearchTerm ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="5">获取用户列表失败: ${error.message || error}</td></tr></tbody></table>`; // 调整列数
            showCustomAlert(`获取用户列表失败: ${error.message || error}`, 'error');
        });
}

function generateUserTable(output) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('user-list-content');
    const role = sessionStorage.getItem("role"); // 获取当前用户角色

    if (lines.length === 0) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="5">没有找到用户数据。</td></tr></tbody></table></div>'; // 调整列数
        return;
    }

    // **更新表头**
    const headers = ['ID', '账号', '角色', '关联业务员ID', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';

    headers.forEach((headerText, index) => {
        // 使用更新后的排序键映射
        const actionColumnIndex = headers.length - 1; // 操作列总在最后

        if (index !== actionColumnIndex && userIndexToSortKeyRevised[index] !== undefined) { // 检查是否可排序
            const sortKey = userIndexToSortKeyRevised[index];
            const currentSort = currentUserSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            // 使用原始字段的索引 (index) 来处理点击事件，因为映射是基于显示列索引的
            tableHTML += `<th data-sort-index="${index}" onclick="handleUserSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`; // 不可排序的列 (如操作列)
        }
    });
    tableHTML += '</tr></thead><tbody>';

    lines.forEach(line => {
        const fields = line.split(';');
        // **期望格式: id;username;***;role;sales_id**
        if (fields.length < 5 || !fields[0]) return;
        const userId = fields[0];
        const username = fields[1] || '';
        // fields[2] 是 '***' (密码占位符)
        const userRole = fields[3] || '';
        const salesId = fields[4] || '0';

        // **传递给编辑/查看的数据字符串包含 sales_id**
        const userDataForEdit = escape(`${userId};${username};;${userRole};${salesId}`); // 密码部分为空

        tableHTML += `<tr data-id="${userId}" data-user-string="${userDataForEdit}">`;
        tableHTML += `<td>${userId}</td>`;
        tableHTML += `<td>${username}</td>`;
        tableHTML += `<td>${userRole}</td>`;
        // **显示 Sales ID，如果是 0 或 -1 显示 '-'**
        tableHTML += `<td>${(salesId === '0' || salesId === '-1') ? '-' : salesId}</td>`;
        tableHTML += `<td class="action-cell" style="white-space: nowrap;">`;
        // 查看按钮对所有角色可见
        tableHTML += `<button class="view-btn icon-btn" onclick="viewUserDetails('${userId}')" title="查看详情">
                            <span class="material-icons-outlined">visibility</span>
                        </button>`;
        // 编辑和删除按钮只对经理可见
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
    updateHoverTargets(); // 应用悬停效果
    // applyActionPermissions(); // 确保按钮状态正确（虽然这里直接渲染了，但以防万一）
}

function handleUserSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);
    // **使用更新后的映射**
    if (userIndexToSortKeyRevised[columnIndex] === undefined) return;
    const sortKey = userIndexToSortKeyRevised[columnIndex];
    // ... (更新 currentUserSortParams 逻辑不变) ...
    const existingIndex = currentUserSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) {
        currentUserSortParams = [sortKey]; // 单列排序，替换之前的
        // 多列排序用 push: currentUserSortParams.push(sortKey);
    } else {
        const currentValue = currentUserSortParams[existingIndex];
        if (currentValue > 0) {
            currentUserSortParams[existingIndex] = -sortKey; // 切换到降序
        } else {
            currentUserSortParams.splice(existingIndex, 1); // 再次点击取消排序
        }
    }
    fetchUserData(); // 重新获取数据
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
    passwordInput.required = true; // 添加时密码必填

    document.getElementById('user-submit-btn').textContent = '提交用户信息';
    document.getElementById('user-submit-btn').onclick = submitUser;
    document.getElementById('user-submit-btn').style.display = 'inline-block';
    document.getElementById('user-cancel-btn').style.display = 'none';

    // **重置 Sales Link 部分**
    if (salesLinkSection) salesLinkSection.style.display = 'none';
    if (salesSelection) salesSelection.innerHTML = '<option value="0">-- 选择业务员 --</option>';
    // if (salesLinkSectionManual) salesLinkSectionManual.style.display = 'none';
    // if (salesIdInput) salesIdInput.value = "0";

    // 清理编辑时可能添加的隐藏域
    const tempHidden = document.getElementById('hidden-editing-sales-id');
    if (tempHidden) tempHidden.remove();

    // 移除返回按钮（如果存在）
    const returnBtn = document.getElementById('user-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-user-view').classList.remove('form-view-mode');

    // 确保表单在重置后，根据默认角色（通常为空或manager）隐藏 Sales 部分
    if (userRoleSelect) {
        userRoleSelect.dispatchEvent(new Event('change'));
    }
    setAppLockedState(false); // 解锁应用状态
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
    const password = passwordInput.value.trim(); // 添加时密码必填
    const role = roleSelect.value;
    let salesId = "0"; // 默认值

    if (!username || !password || !role) {
        showCustomAlert('账号、密码和角色都不能为空！', 'warning');
        return;
    }

    if (role === 'sales') {
        // 从下拉列表获取
        salesId = salesSelection ? salesSelection.value : "0";
        if (salesId === "0") {
            showCustomAlert('请为业务员角色选择一个关联的业务员记录！', 'warning');
            return; // 或者允许不关联，根据需求定
        }
        // 或者从手动输入框获取
        // salesId = salesIdInput ? salesIdInput.value.trim() : "0";
        // if (salesId === "0") { /* 警告 */ return; }
    }

    // 格式: id;username;password;role;sales_id
    // 注意：ID 传 '0' 表示新增
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
            resetAndPrepareUserAddForm(); // 重置表单
            showView('user-list-view', 'user-section'); // 显示列表视图
        })
        .catch(error => {
            const errorMsg = error.message || '添加用户时发生未知错误';
            // 检查是否是用户名重复的特定错误 (需要后端配合返回特定错误码或消息)
            // if (errorMsg.includes("用户名已存在")) { ... }
            showCustomAlert('添加用户失败: ' + errorMsg, 'error');
        });
}

function viewUserDetails(userId) {
    const row = document.querySelector(`#user-list-content tr[data-id="${userId}"]`);
    if (!row) { showCustomAlert("无法加载用户数据。", 'error'); return; }
    const userDataString = unescape(row.dataset.userString); // 包含 sales_id
    if (!userDataString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true); // 锁定应用

    // 填充表单（populateUserForm 会处理 sales_id）
    populateUserForm(userId, userDataString);

    showView('add-user-view', 'user-section'); // 切换到表单视图
    setUserFormReadOnly(true); // 设置为只读
    document.getElementById('user-form-title').textContent = '用户详细信息';

    // 隐藏提交和取消按钮
    document.getElementById('user-submit-btn').style.display = 'none';
    document.getElementById('user-cancel-btn').style.display = 'none';

    // 添加返回按钮
    const formActions = document.querySelector('#add-user-view .form-actions');
    let returnBtn = document.getElementById('user-return-btn');
    if (!returnBtn) { // 避免重复添加
        returnBtn = document.createElement('button');
        returnBtn.id = 'user-return-btn';
        returnBtn.type = 'button';
        returnBtn.className = 'section-btn cancel-btn hover-target';
        returnBtn.textContent = '返回列表';
        returnBtn.style.marginLeft = '15px';
        returnBtn.onclick = () => {
            setAppLockedState(false); // 解锁
            resetAndPrepareUserAddForm(); // 重置表单
            showView('user-list-view', 'user-section'); // 返回列表
        };
        formActions.appendChild(returnBtn);
        o(returnBtn); // 添加悬停效果
    }
    window.scrollTo(0, 0); // 滚动到页面顶部
}

function editUserSetup(userId) {
    const row = document.querySelector(`#user-list-content tr[data-id="${userId}"]`);
    if (!row) { showCustomAlert("无法加载用户数据。", 'error'); return; }
    const userDataString = unescape(row.dataset.userString); // 包含 sales_id
    if (!userDataString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true); // 锁定

    // 填充表单（populateUserForm 会处理 sales_id）
    populateUserForm(userId, userDataString);

    document.getElementById('user-form-title').textContent = '编辑用户信息';

    // 配置按钮
    const submitBtn = document.getElementById('user-submit-btn');
    submitBtn.textContent = '更新用户信息';
    submitBtn.onclick = submitUserUpdate;
    submitBtn.style.display = 'inline-block';

    const cancelBtn = document.getElementById('user-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelUserUpdate;

    // 移除可能存在的返回按钮
    const returnBtn = document.getElementById('user-return-btn');
    if (returnBtn) returnBtn.remove();

    // 密码设置
    const passwordInput = document.getElementById('user-password');
    passwordInput.placeholder = '留空表示不修改密码';
    passwordInput.required = false; // 编辑时密码非必填

    showView('add-user-view', 'user-section'); // 显示表单视图
    setUserFormReadOnly(false); // 表单可编辑
    window.scrollTo(0, 0); // 滚动到顶部
}

function populateUserForm(userId, userDataString) { // userDataString 格式: "id;username;;role;sales_id"
    const form = document.getElementById('user-form');
    form.reset(); // 先重置
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
    form.elements['user-password'].value = ''; // 清空密码字段

    // 触发角色下拉框的 change 事件以根据角色显示/隐藏 sales 部分
    if (userRoleSelect) {
        userRoleSelect.dispatchEvent(new Event('change'));
    } else {
        console.warn("populateUserForm: userRoleSelect not found");
    }

    // 如果是 sales 角色，需要加载并尝试选中对应的 sales_id
    if (fields[3] === 'sales' && salesId !== '0') {
        // 使用 loadUnlinkedSalespersons 加载下拉列表，并传递要预选的 salesId
        // 注意：loadUnlinkedSalespersons 是异步的
        loadUnlinkedSalespersons(salesId);
    } else if (salesSelection) {
        // 如果不是 sales 角色，确保下拉列表重置为默认值
        salesSelection.value = "0";
    }
    // 如果使用手动输入版本
    // if (salesIdInput) {
    //     salesIdInput.value = (fields[3] === 'sales') ? salesId : '0';
    // }

    // 确保所有输入框都可编辑 (如果之前被禁用了)
    // setUserFormReadOnly(false); // 通常在调用此函数前或后设置
}

function submitUserUpdate() {
    const form = document.getElementById('user-form');
    const userId = document.getElementById('editing-user-id').value;
    const username = form.elements['user-username'].value.trim();
    const password = form.elements['user-password'].value.trim(); // 密码为空表示不修改
    const role = form.elements['user-role'].value;
    let salesId = "0";

    if (!username || !role) {
        showCustomAlert('账号和角色不能为空！', 'warning');
        return;
    }

    if (role === 'sales') {
        // 从下拉列表获取
        salesId = salesSelection ? salesSelection.value : "0";
        if (salesId === "0") {
            showCustomAlert('请为业务员角色选择一个关联的业务员记录！', 'warning');
            return; // 或者允许不关联
        }
        // 或者从手动输入框获取
        // salesId = salesIdInput ? salesIdInput.value.trim() : "0";
        // if (salesId === "0") { /* 警告 */ return; }
    }

    // **格式: id;username;password;role;sales_id** (密码为空表示不修改)
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
            setAppLockedState(false); // 解锁
            resetAndPrepareUserAddForm(); // 重置表单
            showView('user-list-view', 'user-section'); // 显示列表
        })
        .catch(error => {
            const errorMsg = error.message || '未知错误';
            showCustomAlert('更新用户失败: ' + errorMsg, 'error');
            setAppLockedState(false); // 出错也要解锁
        });
    // 清理可能添加的隐藏域
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