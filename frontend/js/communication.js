let currentCommunicationSortParams = [];
let currentCommunicationSearchTerm = '';
// 定义哪些列可以排序及其对应的后端排序键 (需要根据后端C代码定义调整)
// 假设: 1=ID, 2=ClientID, 3=ContactID, 4=SalesID, 5=Year, 6=Month, 7=Day, 8=Hour, 9=Minute, 10=Second, 11=Duration
const communicationIndexToSortKey = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11 };
const displayHeaderToSortKeyMapping = { // 如果表头和后端 key 不直接对应，需要这个映射
    // '显示列索引': '对应后端排序键'
    0: 1, // ID -> 1
    1: 2, // 客户ID -> 2
    2: 3, // 联络人ID -> 3
    3: 4, // 业务员ID -> 4
    4: 5, // 日期 (按年排) -> 5
    5: 8, // 时间 (按时排) -> 8
    6: 11 // 时长 -> 11
};

// --- 列表加载与显示 ---
function fetchCommunicationData() {
    const contentDiv = document.getElementById('communication-list-content');
    const clearBtn = document.getElementById('communicationClearSearchButton'); // 确认 ID

    // **获取角色和 Sales ID 以进行过滤**
    const role = sessionStorage.getItem("role");
    const sales_id = sessionStorage.getItem("sales_id");

    let queryParams = [];
    if (currentCommunicationSearchTerm) { queryParams.push(`query=${encodeURIComponent(currentCommunicationSearchTerm)}`); }
    if (currentCommunicationSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentCommunicationSortParams.join(','))}`); }

    // ---- 添加过滤参数 (如果当前用户是业务员) ----
    if (role === 'sales' && sales_id && sales_id !== '0' && sales_id !== '-1') {
        queryParams.push(`filter_sales_id=${encodeURIComponent(sales_id)}`);
        console.log("Fetching communications filtered by sales_id:", sales_id); // Debug log
    } else {
        console.log("Fetching all communications (Manager or no Sales ID)"); // Debug log
    }
    // ---- 过滤结束 ----

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    contentDiv.innerHTML = '<p>正在加载通话记录列表...</p>';

    fetch(`/api/fetch_communications${queryString}`) // URL 包含查询和过滤参数
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateCommunicationTable(data.output || ""); // 生成表格
            if (clearBtn) clearBtn.style.display = currentCommunicationSearchTerm ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="9">获取通话记录列表失败: ${error.message || error}</td></tr></tbody></table>`; // 调整列数
            showCustomAlert(`获取通话记录列表失败: ${error.message || error}`, 'error');
        });
}


function generateCommunicationTable(output) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('communication-list-content');
    // **获取当前用户角色**
    const role = sessionStorage.getItem("role");
    const isSales = (role === 'sales');

    if (lines.length === 0) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="9">没有找到通话记录数据。</td></tr></tbody></table></div>'; // 调整列数
        return;
    }

    // **表头** (与后端输出顺序对应，但显示时合并日期和时间)
    const displayHeaders = ['ID', '客户ID', '联络人ID', '业务员ID', '日期', '时间', '时长(分)', '内容摘要', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';

    displayHeaders.forEach((headerText, displayIndex) => {
        const sortKey = displayHeaderToSortKeyMapping[displayIndex]; // 使用映射获取后端排序键
        const actionColumnIndex = displayHeaders.length - 1;

        if (displayIndex !== actionColumnIndex && sortKey !== undefined) { // 可排序
            const currentSort = currentCommunicationSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            // 点击时传递的是后端排序键 sortKey
            tableHTML += `<th data-sort-key="${sortKey}" onclick="handleCommunicationSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`; // 不可排序
        }
    });
    tableHTML += '</tr></thead><tbody>';

    lines.forEach(line => {
        // **解析后端原始数据: id;client;contact;sales;y;m;d;h;m;s;dur;content**
        const fields = line.split(';');
        if (fields.length < 12) return;
        const commId = fields[0];
        const fullDataEscaped = escape(line); // 用于编辑/查看

        tableHTML += `<tr data-id="${commId}" data-full-comm-string="${fullDataEscaped}">`;
        tableHTML += `<td>${fields[0] || '-'}</td>`; // ID
        tableHTML += `<td>${fields[1] || '-'}</td>`; // Client ID
        tableHTML += `<td>${fields[2] || '-'}</td>`; // Contact ID
        tableHTML += `<td>${fields[3] || '-'}</td>`; // Sales ID
        // 合并日期和时间显示
        tableHTML += `<td>${fields[4] || '?'}-${fields[5] || '?'}-${fields[6] || '?'}</td>`; // Date
        tableHTML += `<td>${fields[7] || '?'}:${fields[8] || '?'}:${fields[9] || '?'}</td>`; // Time
        tableHTML += `<td>${fields[10] || '-'}</td>`; // Duration
        // 内容摘要
        const content = fields[11] || '';
        const contentSummary = content.length > 30 ? content.substring(0, 30) + '...' : content;
        tableHTML += `<td title="${escape(content)}">${contentSummary}</td>`; // Content Summary

        // **操作列按钮根据角色显示**
        tableHTML += `<td class="action-cell" style="white-space: nowrap;">
            <button class="view-btn icon-btn" onclick="viewCommunicationDetails('${commId}')" title="查看详情">
                <span class="material-icons-outlined">visibility</span>
            </button>`;
        // **只有经理才能看到编辑按钮** (根据需要调整，也许业务员可以编辑自己的?)
        if (!isSales) {
            tableHTML += `<button class="edit-btn icon-btn action-requires-manager" onclick="editCommunicationSetup('${commId}')" title="编辑">
                            <span class="material-icons-outlined">edit</span>
                          </button>`;
        }
        // **删除按钮也只给经理** (根据需要调整)
        if (!isSales) {
            tableHTML += `<button class="delete-btn icon-btn action-requires-manager" onclick="deleteCommunication('${commId}')" title="删除">
                              <span class="material-icons-outlined">delete</span>
                           </button>`;
        }
        tableHTML += `</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    updateHoverTargets(); // 应用悬停效果
    // applyActionPermissions(); // 可选
}

// --- 排序、搜索、清除搜索 ---
function handleCommunicationSortClick(event) {
    const header = event.currentTarget;
    // **从 data-sort-key 获取后端的排序键**
    const sortKey = parseInt(header.dataset.sortKey, 10);
    if (isNaN(sortKey)) return;

    const existingIndex = currentCommunicationSortParams.findIndex(p => Math.abs(p) === sortKey);

    if (existingIndex === -1) {
        currentCommunicationSortParams = [sortKey]; // 单列排序
        // 多列排序用 push: currentCommunicationSortParams.push(sortKey);
    } else {
        const currentValue = currentCommunicationSortParams[existingIndex];
        if (currentValue > 0) {
            currentCommunicationSortParams[existingIndex] = -sortKey; // 切换降序
        } else {
            currentCommunicationSortParams.splice(existingIndex, 1); // 取消排序
        }
    }
    fetchCommunicationData(); // 重新获取数据
}

function handleCommunicationSearchInputKey(event) {
    if (event.key === 'Enter') {
        performCommunicationSearch();
    }
}

function performCommunicationSearch() {
    currentCommunicationSearchTerm = document.getElementById('communicationSearchInput').value.trim();
    fetchCommunicationData();
}

function clearCommunicationSearch() {
    const searchInput = document.getElementById('communicationSearchInput');
    if (searchInput) searchInput.value = '';
    currentCommunicationSearchTerm = '';
    fetchCommunicationData();
    const clearBtn = document.getElementById('communicationClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

// --- 表单准备与重置 ---
function resetAndPrepareCommunicationAddForm() {
    setCommunicationFormReadOnly(false);
    const form = document.getElementById('communication-form');
    form.reset();
    document.getElementById('editing-communication-id').value = '';
    document.getElementById('communication-form-title').textContent = '添加新通话记录';

    // 清空隐藏字段
    document.getElementById('selected-client-id').value = '';
    document.getElementById('selected-contact-id').value = '';

    // 清空并准备客户选择区域
    const clientSelectorContainer = document.getElementById('communication-client-contact-selector');
    clientSelectorContainer.innerHTML = '<p>正在加载客户列表...</p>';
    loadClientsForCommunicationSelector(); // 开始加载客户

    // **根据角色显示/隐藏业务员选择器**
    const role = sessionStorage.getItem("role");
    const salesSelectionContainer = document.getElementById('communication-sales-selection').parentNode; // 获取包含 label 的 form-group

    if (role === 'sales') {
        // 业务员不需要选择自己，隐藏该部分
        if (salesSelectionContainer) salesSelectionContainer.style.display = 'none';
        // 不需要加载业务员列表
    } else if (role === 'manager') {
        // 经理需要选择业务员，显示该部分并加载
        if (salesSelectionContainer) salesSelectionContainer.style.display = '';
        loadSalespersonsForCommunicationForm(); // 开始加载业务员
    } else {
        // 其他角色或未登录，隐藏
        if (salesSelectionContainer) salesSelectionContainer.style.display = 'none';
        console.error("Unknown role, cannot prepare communication form correctly.");
        // 可能需要禁用提交按钮或显示错误
    }


    // 设置按钮状态
    document.getElementById('communication-submit-btn').textContent = '提交通话记录';
    document.getElementById('communication-submit-btn').onclick = submitCommunication;
    document.getElementById('communication-submit-btn').style.display = 'inline-block';
    document.getElementById('communication-cancel-btn').style.display = 'none';

    // 移除可能存在的返回按钮
    const returnBtn = document.getElementById('communication-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-communication-view').classList.remove('form-view-mode');

    // 清理编辑时可能添加的隐藏域
    const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
    if (tempHiddenContact) tempHiddenContact.remove();

    setAppLockedState(false); // 解锁
    updateHoverTargets();
}

function loadClientsForCommunicationSelector(selectedClientId = null, selectedContactId = null) {
    const container = document.getElementById('communication-client-contact-selector');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names')
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            container.innerHTML = ''; // 清空加载提示
            const clientList = data.output || "";
            if (!clientList) {
                container.innerHTML = '<p>未能加载客户列表或没有客户。</p>';
                return;
            }
            const clients = clientList.split(';');
            clients.forEach(clientStr => {
                const parts = clientStr.split(',');
                if (parts.length === 2) {
                    const clientId = parts[0].trim();
                    const clientName = parts[1].trim();
                    if (clientId && clientName) {
                        const card = document.createElement('div');
                        card.className = 'client-selector-card hover-target';
                        card.dataset.clientId = clientId; // 存储客户 ID

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'client-name';
                        nameSpan.textContent = clientName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display';
                        idSpan.textContent = `(ID: ${clientId})`;

                        card.appendChild(nameSpan);
                        card.appendChild(idSpan);

                        // 动态创建联络人面板（初始隐藏）
                        const contactPanel = document.createElement('div');
                        contactPanel.className = 'contact-selection-panel';
                        contactPanel.id = `contact-panel-for-${clientId}`;
                        card.appendChild(contactPanel); // 将面板添加到卡片内部

                        container.appendChild(card);

                        // 添加点击事件监听器
                        card.addEventListener('click', () => handleClientCardClick(card, clientId));

                        // 如果是编辑模式且当前客户被选中，则预先展开并加载联络人
                        if (selectedClientId && clientId === selectedClientId) {
                            // 延迟一点执行，确保卡片已添加到DOM
                            setTimeout(() => {
                                card.click(); // 模拟点击来展开
                                // 在 loadContactsForClient 调用中处理选中 contactId
                            }, 100);
                        }
                    }
                }
            });
            updateHoverTargets();
        })
        .catch(error => {
            container.innerHTML = `<p style="color: red;">加载客户列表失败: ${error.message || error}</p>`;
            showCustomAlert(`加载客户列表失败: ${error.message || error}`, 'error');
        });
}


function handleClientCardClick(clickedCard, clientId) {
    const wasExpanded = clickedCard.classList.contains('expanded');
    const container = document.getElementById('communication-client-contact-selector');

    // 关闭所有其他卡片的展开状态
    container.querySelectorAll('.client-selector-card.expanded').forEach(card => {
        if (card !== clickedCard) {
            card.classList.remove('expanded');
            const panel = card.querySelector('.contact-selection-panel');
            if (panel) panel.innerHTML = ''; // 清空其他面板内容
        }
    });

    // 切换当前卡片的展开状态
    if (wasExpanded) {
        clickedCard.classList.remove('expanded');
        const panel = clickedCard.querySelector('.contact-selection-panel');
        if (panel) panel.innerHTML = ''; // 清空内容
        // 清空隐藏字段的选择
        document.getElementById('selected-client-id').value = '';
        document.getElementById('selected-contact-id').value = '';
    } else {
        clickedCard.classList.add('expanded');
        // 更新选中的客户ID
        document.getElementById('selected-client-id').value = clientId;
        document.getElementById('selected-contact-id').value = ''; // 重置联络员选择
        // 加载联络人到对应的面板
        const panel = clickedCard.querySelector('.contact-selection-panel');
        const selectedContactId = (document.getElementById('editing-communication-id').value && document.getElementById('selected-client-id').value === clientId)
            ? document.getElementById('hidden-edit-contact-id')?.value // 需要一个地方临时存编辑时的contactId
            : null;
        if (panel) {
            loadContactsForClient(clientId, panel, selectedContactId);
        }
    }
}

function setCommunicationFormReadOnly(isReadOnly) {
    const form = document.getElementById('communication-form');
    const formView = document.getElementById('add-communication-view');
    if (isReadOnly) formView.classList.add('form-view-mode');
    else formView.classList.remove('form-view-mode');

    // 禁用/启用所有输入控件
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => el.disabled = isReadOnly);

    // 特别处理自定义的选择器/卡片 (如果它们不是标准的 input/select)
    // 客户/联络人选择器
    form.querySelectorAll('.client-selector-card').forEach(card => {
        if (isReadOnly) card.classList.add('disabled'); else card.classList.remove('disabled');
        // 如果点击事件处理程序中没有检查 disabled 状态，需要在这里移除监听器或在处理程序中检查
        // card.style.pointerEvents = isReadOnly ? 'none' : ''; // 简单粗暴的方法
    });
    // 联络人单选按钮
    form.querySelectorAll('.contact-radio-group input[type="radio"]').forEach(radio => radio.disabled = isReadOnly);
    form.querySelectorAll('.contact-radio-group label').forEach(label => {
        if (isReadOnly) label.classList.add('disabled'); else label.classList.remove('disabled');
    });

    // 业务员选择器 (复选框卡片)
    form.querySelectorAll('#communication-sales-selection .neumorphic-checkbox-card')
        .forEach(label => {
            const checkbox = document.getElementById(label.htmlFor);
            if (checkbox) checkbox.disabled = isReadOnly;
            if (isReadOnly) label.classList.add('disabled');
            else label.classList.remove('disabled');
        });

    // 禁用添加/移除按钮（如果表单内有的话）
    form.querySelectorAll('.add-btn, .remove-btn').forEach(btn => btn.disabled = isReadOnly);
}

// --- 动态加载客户、联络人、业务员 ---

// 加载客户 (单选复选框)
function loadClientsForCommunicationForm(selectedClientId = null) {
    const container = document.getElementById('communication-client-selection');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names') // 复用获取客户ID和名称的API
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            container.innerHTML = ''; // 清空加载提示
            const clientList = data.output || "";
            if (!clientList) {
                container.innerHTML = '<p>未能加载客户列表或没有客户。</p>';
                return;
            }
            const clients = clientList.split(';');
            clients.forEach(clientStr => {
                const parts = clientStr.split(',');
                if (parts.length === 2) {
                    const clientId = parts[0].trim();
                    const clientName = parts[1].trim();
                    if (clientId && clientName) {
                        const checkboxId = `comm-client-${clientId}`;
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox'; // 仍然是 checkbox 类型
                        checkbox.id = checkboxId;
                        checkbox.name = 'comm_selected_client'; // 使用不同的 name
                        checkbox.value = clientId;
                        checkbox.checked = (selectedClientId && clientId === selectedClientId);

                        const label = document.createElement('label');
                        label.htmlFor = checkboxId;
                        label.className = 'neumorphic-checkbox-card hover-target';
                        if (checkbox.checked) label.classList.add('selected');

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'client-name';
                        nameSpan.textContent = clientName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display';
                        idSpan.textContent = `(ID: ${clientId})`;

                        label.appendChild(checkbox);
                        label.appendChild(nameSpan);
                        label.appendChild(idSpan);
                        container.appendChild(label);

                        // 添加事件监听器以实现单选逻辑
                        checkbox.addEventListener('change', function () {
                            const currentCardLabel = document.querySelector(`label[for="${this.id}"]`);
                            if (this.checked) {
                                // 取消其他所有客户的选择
                                container.querySelectorAll('input[type="checkbox"]').forEach(otherCheckbox => {
                                    if (otherCheckbox !== this) {
                                        otherCheckbox.checked = false;
                                        const otherLabel = document.querySelector(`label[for="${otherCheckbox.id}"]`);
                                        if (otherLabel) otherLabel.classList.remove('selected');
                                    }
                                });
                                if (currentCardLabel) currentCardLabel.classList.add('selected');
                                // 加载联络人
                                loadContactsForClient(this.value);
                            } else {
                                // 如果取消选中，则清空联络人
                                if (currentCardLabel) currentCardLabel.classList.remove('selected');
                                clearContactSelection();
                            }
                        });
                    }
                }
            });
            // 如果是编辑模式且有选中的客户，触发一次联络人加载
            if (selectedClientId) {
                loadContactsForClient(selectedClientId, document.getElementById('communication-form').elements['contact_id']?.value);
            }
            updateHoverTargets();
        })
        .catch(error => {
            container.innerHTML = `<p style="color: red;">加载客户列表失败: ${error.message || error}</p>`;
            showCustomAlert(`加载客户列表失败: ${error.message || error}`, 'error');
        });
}

// 加载联络人 (单选按钮)
function loadContactsForClient(clientId, panelElement, selectedContactId = null) { // 参数名改为 selectedContactId
    if (!panelElement) return;
    panelElement.innerHTML = '<p style="text-align:center; margin: 10px 0;">加载中...</p>'; // 使用更小的加载提示

    fetch(`/api/clients/${clientId}/contacts`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status} - ${response.statusText}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            panelElement.innerHTML = ''; // 清空加载提示
            const contactList = data.output || "";

            // *** 修改开始: 处理 "ID1,Name1;ID2,Name2" 格式 ***
            const contacts = contactList.split(';')
                .map(contactStr => {
                    const parts = contactStr.split(',');
                    if (parts.length === 2) {
                        const id = parts[0].trim();
                        const name = parts[1].trim();
                        // 确保 ID 是数字且 Name 不为空
                        if (id && !isNaN(parseInt(id)) && name) {
                            return { id: id, name: name }; // 返回包含 ID 和 Name 的对象
                        }
                    }
                    return null;
                })
                .filter(contact => contact !== null); // 过滤掉无效的条目
            // *** 修改结束 ***

            if (contacts.length === 0) {
                panelElement.innerHTML = '<p style="text-align:center; color:#888; margin: 10px 0;">无联络人</p>';
                // 如果没有联络人，确保清空隐藏字段的值
                document.getElementById('selected-contact-id').value = '';
                return;
            }

            const radioGroup = document.createElement('div');
            radioGroup.className = 'contact-radio-group';

            radioGroup.addEventListener('click', function (event) {
                event.stopPropagation(); // 阻止事件传播到父元素 (client-selector-card)
            });

            contacts.forEach(contact => { // 遍历 contact 对象数组
                // 使用 contact.id 确保 radio button 的 ID 唯一性
                const radioId = `comm-contact-${clientId}-${contact.id}`;
                const label = document.createElement('label');
                label.htmlFor = radioId;
                // 检查当前 contact.id 是否是需要预选的 ID
                if (selectedContactId && contact.id === selectedContactId) { // *** 比较 ID ***
                    label.classList.add('selected'); // 预选中的label样式
                }

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.id = radioId;
                radio.name = `comm_selected_contact_for_${clientId}`; // 每个客户的组名不同
                radio.value = contact.id; // *** 关键改动：value 现在是 ID ***
                radio.checked = (selectedContactId && contact.id === selectedContactId); // *** 检查 ID 是否预选 ***

                const customRadio = document.createElement('span');
                customRadio.className = 'radio-custom'; // 自定义 radio 外观

                const nameSpan = document.createElement('span');
                nameSpan.textContent = contact.name; // *** 显示姓名 ***
                // 可选: 同时显示ID
                // const idSpan = document.createElement('span');
                // idSpan.className = 'contact-id-display';
                // idSpan.textContent = ` (ID: ${contact.id})`;

                label.appendChild(radio);
                label.appendChild(customRadio);
                label.appendChild(nameSpan);
                // label.appendChild(idSpan); // 如果需要显示ID，取消此行注释

                radioGroup.appendChild(label);

                // 添加 Change 事件，更新隐藏字段为选中的【ID】并改变label样式
                radio.addEventListener('change', function () {
                    // 确保更新隐藏字段的值为当前选中的 radio 的 value (即 ID)
                    if (this.checked) {
                        document.getElementById('selected-contact-id').value = this.value; // *** 存储 ID ***
                        // 更新所有 label 的 selected 类
                        panelElement.querySelectorAll('.contact-radio-group label').forEach(lbl => {
                            const associatedRadio = document.getElementById(lbl.htmlFor);
                            if (associatedRadio && associatedRadio.checked) {
                                lbl.classList.add('selected');
                            } else {
                                lbl.classList.remove('selected');
                            }
                        });
                    }
                });
            });
            panelElement.appendChild(radioGroup);
            updateHoverTargets(); // 确保新元素有悬停效果
        })
        .catch(error => {
            panelElement.innerHTML = `<p style="color: red; text-align:center; margin: 10px 0;">加载联络人失败</p>`;
            // 加载失败时也清空隐藏字段的值
            document.getElementById('selected-contact-id').value = '';
            showCustomAlert(`加载客户 ${clientId} 的联络人失败: ${error.message || error}`, 'error');
        });
}

// 清空联络人选择
function clearContactSelection() {
    const wrapper = document.getElementById('communication-contact-selection-wrapper');
    const container = document.getElementById('communication-contact-selection');
    container.innerHTML = '<p>请先选择客户以加载联络人。</p>';
    wrapper.style.display = 'none';
}

// 加载业务员 (单选复选框)
function loadSalespersonsForCommunicationForm(selectedSalesId = null) {
    const container = document.getElementById('communication-sales-selection');
    container.innerHTML = '<p>正在加载业务员列表...</p>';
    fetch('/api/fetch_sales_ids_names') // 假设有这样一个API，或使用 fetch_sales 并解析
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            container.innerHTML = ''; // 清空加载提示
            const salesList = data.output || ""; // 假设格式是 "id1,name1;id2,name2"
            if (!salesList) {
                container.innerHTML = '<p>未能加载业务员列表或没有业务员。</p>';
                return;
            }
            const salespersons = salesList.split(';');
            salespersons.forEach(salesStr => {
                const parts = salesStr.split(',');
                if (parts.length === 2) {
                    const salesId = parts[0].trim();
                    const salesName = parts[1].trim();
                    if (salesId && salesName) {
                        const checkboxId = `comm-sales-${salesId}`;
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = checkboxId;
                        checkbox.name = 'comm_selected_sales';
                        checkbox.value = salesId;
                        checkbox.checked = (selectedSalesId && salesId === selectedSalesId);

                        const label = document.createElement('label');
                        label.htmlFor = checkboxId;
                        label.className = 'neumorphic-checkbox-card hover-target';
                        if (checkbox.checked) label.classList.add('selected');

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'client-name'; // 复用样式
                        nameSpan.textContent = salesName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display'; // 复用样式
                        idSpan.textContent = `(ID: ${salesId})`;

                        label.appendChild(checkbox);
                        label.appendChild(nameSpan);
                        label.appendChild(idSpan);
                        container.appendChild(label);

                        // 添加事件监听器以实现单选逻辑
                        checkbox.addEventListener('change', function () {
                            const currentCardLabel = document.querySelector(`label[for="${this.id}"]`);
                            if (this.checked) {
                                // 取消其他所有业务员的选择
                                container.querySelectorAll('input[type="checkbox"]').forEach(otherCheckbox => {
                                    if (otherCheckbox !== this) {
                                        otherCheckbox.checked = false;
                                        const otherLabel = document.querySelector(`label[for="${otherCheckbox.id}"]`);
                                        if (otherLabel) otherLabel.classList.remove('selected');
                                    }
                                });
                                if (currentCardLabel) currentCardLabel.classList.add('selected');
                            } else {
                                if (currentCardLabel) currentCardLabel.classList.remove('selected');
                            }
                        });
                    }
                }
            });
            updateHoverTargets();
        })
        .catch(error => {
            container.innerHTML = `<p style="color: red;">加载业务员列表失败: ${error.message || error}</p>`;
            showCustomAlert(`加载业务员列表失败: ${error.message || error}`, 'error');
        });
}

// --- 提交、更新、删除、查看、编辑 ---

function submitCommunication() {
    const form = document.getElementById('communication-form');
    const clientId = document.getElementById('selected-client-id').value;
    const contactId = document.getElementById('selected-contact-id').value;

    // **获取当前用户角色和 sales_id**
    const role = sessionStorage.getItem("role");
    const loggedInSalesId = sessionStorage.getItem("sales_id");
    let selectedSalesId = null; // 将用于最终提交的 sales_id

    // 基础字段验证
    const year = form.elements['year'].value.trim();
    const month = form.elements['month'].value.trim();
    const day = form.elements['day'].value.trim();
    const hour = form.elements['hour'].value.trim();
    const minute = form.elements['minute'].value.trim();
    const second = form.elements['second'].value.trim();
    const duration = form.elements['duration'].value.trim();
    const content = form.elements['content'].value.trim();

    // 验证客户和联络人
    if (!clientId) {
        showCustomAlert('请选择一个客户。', 'warning');
        document.getElementById('communication-client-contact-selector').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!contactId) {
        showCustomAlert('请为选定的客户选择一个联络人。', 'warning');
        const expandedCard = document.querySelector('.client-selector-card.expanded');
        if (expandedCard) {
            expandedCard.querySelector('.contact-selection-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            document.getElementById('communication-client-contact-selector').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // **根据角色确定 sales_id**
    if (role === 'sales') {
        selectedSalesId = loggedInSalesId; // 业务员自动关联自己
        if (!selectedSalesId || selectedSalesId === '0' || selectedSalesId === '-1') {
            showCustomAlert('错误：无法获取当前业务员信息，无法添加记录。', 'error');
            return;
        }
    } else if (role === 'manager') {
        // 经理需要从表单选择业务员
        const salesSelectionContainer = document.getElementById('communication-sales-selection');
        const selectedSalesCheckbox = salesSelectionContainer.querySelector('input[name="comm_selected_sales"]:checked');
        if (!selectedSalesCheckbox) {
            showCustomAlert('请选择一个业务员。', 'warning');
            salesSelectionContainer.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        selectedSalesId = selectedSalesCheckbox.value;
    } else {
        showCustomAlert('错误：未知用户角色，无法添加记录。', 'error');
        return;
    }

    // 验证其他必填字段
    if (!year || !month || !day || !hour || !minute || !second || !duration || !content) {
        showCustomAlert('请填写所有通话信息字段。', 'warning');
        // 滚动到第一个未填写的字段 (可选)
        return;
    }
    // 可选：验证数字格式
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) ||
        isNaN(parseInt(hour)) || isNaN(parseInt(minute)) || isNaN(parseInt(second)) ||
        isNaN(parseInt(duration))) {
        showCustomAlert('日期、时间和时长必须是有效的数字。', 'warning');
        return;
    }

    // 构建数据对象
    const commData = {
        id: '0', // 新增记录 ID 为 0
        client_id: clientId,
        contact_id: contactId,
        sales_id: selectedSalesId, // 使用上面确定的 salesId
        year: year || '0', month: month || '0', day: day || '0',
        hour: hour || '0', minute: minute || '0', second: second || '0',
        duration: duration || '0',
        content: content
    };

    // 构造 C 后端期望的字符串格式
    const finalCommString = [
        commData.id, commData.client_id, commData.contact_id, commData.sales_id,
        commData.year, commData.month, commData.day, commData.hour, commData.minute, commData.second,
        commData.duration, commData.content
    ].join(';');

    console.log("Submitting new communication:", finalCommString); // Debug log

    fetch('/api/add_communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationData: finalCommString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            showCustomAlert(data.output || '添加通话记录成功！', 'success');
            resetAndPrepareCommunicationAddForm(); // 重置表单
            showView('communication-list-view', 'communication-section'); // 显示列表
        })
        .catch(error => {
            showCustomAlert('添加通话记录失败: ' + (error.message || '未知错误'), 'error');
        });
}

function editCommunicationSetup(commId) {
    const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
    if (!row) { showCustomAlert("无法加载通话记录数据。", 'error'); return; }
    const fullCommString = unescape(row.dataset.fullCommString);
    if (!fullCommString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true); // 锁定

    // 解析数据: id;client;contact;sales;y;m;d;h;m;s;dur;content
    const fields = fullCommString.split(';');
    if (fields.length < 12) { /* ... 错误处理 ... */ setAppLockedState(false); return; }
    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };

    // 1. 先重置表单框架 (reset 会根据当前登录角色显示/隐藏 sales 选择)
    resetAndPrepareCommunicationAddForm();

    // 2. 填充基础信息
    document.getElementById('editing-communication-id').value = commData.id;
    const form = document.getElementById('communication-form');
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;

    // 3. 预选客户和联络人
    //    使用临时隐藏元素传递 contactId 给 loadClientsForCommunicationSelector -> handleClientCardClick -> loadContactsForClient
    let hiddenContactInput = document.getElementById('hidden-edit-contact-id');
    if (!hiddenContactInput) {
        hiddenContactInput = document.createElement('input');
        hiddenContactInput.type = 'hidden';
        hiddenContactInput.id = 'hidden-edit-contact-id';
        form.appendChild(hiddenContactInput); // 添加到表单
    }
    hiddenContactInput.value = commData.contact_id;

    // 重新加载客户列表，并指定要选中的客户 ID
    // loadContactsForClient 会在客户卡片点击后被调用，并使用上面隐藏域的值
    loadClientsForCommunicationSelector(commData.client_id, commData.contact_id);

    // 4. 预选业务员 (只有经理编辑时需要)
    const role = sessionStorage.getItem("role");
    if (role === 'manager') {
        // 确保业务员列表加载函数能处理预选
        loadSalespersonsForCommunicationForm(commData.sales_id);
    }


    // 5. 更新表单标题和按钮
    document.getElementById('communication-form-title').textContent = '编辑通话记录';
    const submitBtn = document.getElementById('communication-submit-btn');
    submitBtn.textContent = '更新通话记录';
    submitBtn.onclick = submitCommunicationUpdate;
    submitBtn.style.display = 'inline-block';
    const cancelBtn = document.getElementById('communication-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelCommunicationUpdate;

    showView('add-communication-view', 'communication-section'); // 显示表单
    setCommunicationFormReadOnly(false); // 允许编辑
    window.scrollTo(0, 0); // 滚动到顶部
}


function populateCommunicationForm(commId, fullCommString) {
    setCommunicationFormReadOnly(false); // 先允许填充
    const form = document.getElementById('communication-form');
    form.reset(); // 重置表单

    document.getElementById('editing-communication-id').value = commId;
    const fields = fullCommString.split(';');
    if (fields.length < 12) {
        showCustomAlert("通话记录数据格式不完整。", 'error');
        setAppLockedState(false); // 解锁
        return;
    }

    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };

    // 填充基础信息
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;

    // 加载并选中关联方
    loadClientsForCommunicationForm(commData.client_id);
    // 注意：联络人加载依赖于客户加载完成后的回调，或者在 loadClientsForCommunicationForm 内部处理
    // 这里传递 contact_id 给 loadContactsForClient (它会在 loadClientsForCommunicationForm 成功后被调用)
    form.elements['contact_id'] = { value: commData.contact_id }; // 临时存储 contact_id 供 loadContactsForClient 使用
    loadSalespersonsForCommunicationForm(commData.sales_id);

    updateHoverTargets();
}


function submitCommunicationUpdate() {
    const form = document.getElementById('communication-form');
    const commId = document.getElementById('editing-communication-id').value;
    const clientId = document.getElementById('selected-client-id').value;
    const contactId = document.getElementById('selected-contact-id').value;

    // **获取当前用户角色和原记录的 Sales ID (需要从隐藏域或其他地方获取)**
    // **注意：业务员不能修改关联的 Sales ID，经理可以**
    const role = sessionStorage.getItem("role");
    let selectedSalesId = null;

    // 基础字段验证 (同 submitCommunication)
    const year = form.elements['year'].value.trim();
    // ... (获取 month, day, hour, minute, second, duration, content) ...

    // 验证客户和联络人
    if (!clientId || !contactId) {
        showCustomAlert('请确保客户和联络人都已选择。', 'warning');
        return;
    }

    // **根据角色确定最终的 sales_id**
    if (role === 'manager') {
        // 经理可以修改，从表单获取
        const salesSelectionContainer = document.getElementById('communication-sales-selection');
        const selectedSalesCheckbox = salesSelectionContainer.querySelector('input[name="comm_selected_sales"]:checked');
        if (!selectedSalesCheckbox) {
            showCustomAlert('请选择一个业务员。', 'warning');
            salesSelectionContainer.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        selectedSalesId = selectedSalesCheckbox.value;
    } else if (role === 'sales') {
        // 业务员不能修改 Sales ID，应使用记录本身的 Sales ID (需要先获取)
        // 从 data-* 属性获取原始数据可能更可靠
        const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
        if (row && row.dataset.fullCommString) {
            const originalFields = unescape(row.dataset.fullCommString).split(';');
            if (originalFields.length >= 4) {
                selectedSalesId = originalFields[3]; // 使用原始记录的 sales_id
            }
        }
        if (!selectedSalesId) {
            // 如果无法获取原始 sales_id，则使用当前登录的业务员 ID (作为后备，但可能不准确)
            selectedSalesId = sessionStorage.getItem("sales_id");
            console.warn("Could not retrieve original sales_id for communication update, using logged-in user's sales_id as fallback.");
        }
        if (!selectedSalesId || selectedSalesId === '0' || selectedSalesId === '-1') {
            showCustomAlert('错误：无法确定关联的业务员信息。', 'error');
            return; // 必须有关联的业务员才能更新
        }

    } else {
        showCustomAlert('错误：未知用户角色，无法更新记录。', 'error');
        return;
    }


    // ... (验证其他必填字段和数字格式) ...
    if (!year || !month || !day || !hour || !minute || !second || !duration || !content) { /* 警告 */ return; }
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) ||
        isNaN(parseInt(hour)) || isNaN(parseInt(minute)) || isNaN(parseInt(second)) ||
        isNaN(parseInt(duration))) { /* 警告 */ return; }


    // 构建数据对象
    const commData = {
        id: commId, // 使用编辑中的 ID
        client_id: clientId,
        contact_id: contactId,
        sales_id: selectedSalesId, // 使用上面确定的 salesId
        // ... (year, month, day, etc.) ...
        content: content
    };

    // 构造 C 后端期望的字符串格式
    const finalCommString = [
        commData.id, commData.client_id, commData.contact_id, commData.sales_id,
        commData.year, commData.month, commData.day, commData.hour, commData.minute, commData.second,
        commData.duration, commData.content
    ].join(';');

    console.log("Submitting communication update:", finalCommString); // Debug log

    fetch('/api/update_communication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationData: finalCommString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '通话记录已更新！', 'success');
            setAppLockedState(false); // 解锁
            resetAndPrepareCommunicationAddForm(); // 重置表单
            showView('communication-list-view', 'communication-section'); // 显示列表
        })
        .catch(error => {
            showCustomAlert('更新通话记录失败: ' + (error.message || '未知错误'), 'error');
            setAppLockedState(false); // 出错也要解锁
        });
    // 清理编辑时可能添加的隐藏域
    const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
    if (tempHiddenContact) tempHiddenContact.remove();
}

function cancelCommunicationUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失。",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false); // 解锁
            resetAndPrepareCommunicationAddForm(); // 重置表单
            showView('communication-list-view', 'communication-section'); // 返回列表
            // 清理编辑时可能添加的隐藏域
            const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
            if (tempHiddenContact) tempHiddenContact.remove();
        }
    );
}

function viewCommunicationDetails(commId) {
    const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
    if (!row) { showCustomAlert("无法加载通话记录数据。", 'error'); return; }
    const fullCommString = unescape(row.dataset.fullCommString);
    if (!fullCommString) { showCustomAlert("无法加载详细数据。", 'error'); return; }

    setAppLockedState(true); // 锁定

    // 解析数据
    const fields = fullCommString.split(';');
    if (fields.length < 12) {
        showCustomAlert("通话记录数据格式不完整。", 'error');
        setAppLockedState(false); return;
    }
    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };

    // --- 修改开始 ---
    // 1. 不再调用 resetAndPrepareCommunicationAddForm()，因为它会设置错误的标题和按钮。
    //    改为手动重置表单的核心部分。
    const form = document.getElementById('communication-form');
    form.reset(); // 清空基础 input/textarea
    document.getElementById('editing-communication-id').value = commData.id; // 设置ID用于可能的后续操作（虽然查看时不用）
    document.getElementById('selected-client-id').value = ''; // 清空隐藏客户ID
    document.getElementById('selected-contact-id').value = ''; // 清空隐藏联系人ID
    // 清空动态加载的选择器内容（如果 reset() 没清干净）
    const clientSelectorContainer = document.getElementById('communication-client-contact-selector');
    clientSelectorContainer.innerHTML = '<p>加载中...</p>'; // 或清空
    const salesSelectionContainer = document.getElementById('communication-sales-selection');
    salesSelectionContainer.innerHTML = '<p>加载中...</p>'; // 或清空

    // 2. 填充基础信息
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;

    // 3. 预选客户、联络人 (需要临时存储 contactId)
    let hiddenContactInput = document.getElementById('hidden-edit-contact-id');
    if (!hiddenContactInput) {
        hiddenContactInput = document.createElement('input');
        hiddenContactInput.type = 'hidden';
        hiddenContactInput.id = 'hidden-edit-contact-id';
        form.appendChild(hiddenContactInput);
    }
    hiddenContactInput.value = commData.contact_id;
    loadClientsForCommunicationSelector(commData.client_id, commData.contact_id); // 加载并预选

    // 4. 预选业务员 (如果需要且可见)
    const role = sessionStorage.getItem("role");
    const salesSelectorDiv = document.getElementById('communication-sales-selection').parentNode; // 获取包含label的div
    if (role === 'manager' && salesSelectorDiv) {
        salesSelectorDiv.style.display = ''; // 确保经理能看到
        loadSalespersonsForCommunicationForm(commData.sales_id); // 加载并预选
    } else if (salesSelectorDiv) {
        salesSelectorDiv.style.display = 'none'; // 业务员查看时隐藏
    }

    // 5. 切换视图
    showView('add-communication-view', 'communication-section');

    // 6. 设置只读模式并调整按钮 (使用 setTimeout 确保视图切换完成)
    setTimeout(() => {
        setCommunicationFormReadOnly(true); // 设置为只读
        document.getElementById('communication-form-title').textContent = '通话记录详细信息'; // **设置正确的标题**
        // 隐藏提交和取消按钮
        document.getElementById('communication-submit-btn').style.display = 'none';
        document.getElementById('communication-cancel-btn').style.display = 'none';

        // 添加返回按钮
        const formActions = document.querySelector('#add-communication-view .form-actions');
        let returnBtn = document.getElementById('communication-return-btn');
        if (!returnBtn) {
            returnBtn = document.createElement('button');
            // ... (设置返回按钮属性和事件，同之前代码)
            returnBtn.id = 'communication-return-btn';
            returnBtn.type = 'button';
            returnBtn.className = 'section-btn cancel-btn hover-target';
            returnBtn.textContent = '返回列表';
            returnBtn.style.marginLeft = '15px';
            returnBtn.onclick = () => {
                setAppLockedState(false);
                // 返回列表前，最好也重置一下表单状态，避免影响下次添加
                resetAndPrepareCommunicationAddForm(); // 调用标准的重置函数
                const tempHidden = document.getElementById('hidden-edit-contact-id');
                if (tempHidden) tempHidden.remove();
                showView('communication-list-view', 'communication-section');
            };
            formActions.appendChild(returnBtn);
            o(returnBtn);
        }

        // ***** 关键修复：在设置完只读和按钮后，再次应用权限 *****
        // 这会确保即使 showView 激活了二级导航按钮，这里的权限也会覆盖掉不该显示的按钮
        applyActionPermissions();
        // *******************************************************

        // 清理临时的 contact ID 存储
        const tempHidden = document.getElementById('hidden-edit-contact-id');
        // if (tempHidden) tempHidden.remove(); // 可以在返回列表时再清理

    }, 300); // 延迟时间

    window.scrollTo(0, 0); // 滚动到顶部
    // --- 修改结束 ---
}


// 获取业务员ID和名称的API (如果尚未在 sales.js 中全局可用)
// 这个函数需要确保能被 communication.js 调用
async function fetchSalesIdsAndNames() {
    try {
        const response = await fetch('/api/fetch_sales'); // 或专用API '/api/fetch_sales_ids_names'
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // 解析 output 获取 id 和 name
        // 假设 C 端 get_sales 输出格式为 "id;name;..." 或 display_sales_ids_names 输出 "id1,name1;id2,name2"
        const salesListOutput = data.output || "";
        if (!salesListOutput) return [];

        const sales = salesListOutput.split('\n')
            .map(line => {
                const fields = line.split(';');
                if (fields.length >= 2) return { id: fields[0], name: fields[1] };
                // 兼容 "id,name" 格式
                const parts = line.split(',');
                if (parts.length === 2) return { id: parts[0], name: parts[1] };
                return null;
            })
            .filter(s => s !== null);
        return sales;

    } catch (error) {
        console.error("Failed to fetch sales IDs and names:", error);
        showCustomAlert(`获取业务员列表时出错: ${error.message}`, 'error');
        return []; // 返回空数组表示失败
    }
}

// 在 communication.js 中调用 loadSalespersonsForCommunicationForm 时，
// 可以这样使用 fetchSalesIdsAndNames (如果 sales.js 没有提供全局数据的话)
/*
async function loadSalespersonsForCommunicationForm(selectedSalesId = null) {
    const container = document.getElementById('communication-sales-selection');
    container.innerHTML = '<p>正在加载业务员列表...</p>';
    try {
        const salespersons = await fetchSalesIdsAndNames(); // 调用上面定义的函数
        container.innerHTML = ''; // Clear loading
        if (salespersons.length === 0) {
            container.innerHTML = '<p>未能加载业务员列表或没有业务员。</p>';
            return;
        }
        salespersons.forEach(sales => {
           // ... (生成 checkbox 和 label 的代码，如上所示) ...
           // checkbox.checked = (selectedSalesId && sales.id === selectedSalesId);
           // nameSpan.textContent = sales.name;
           // idSpan.textContent = `(ID: ${sales.id})`;
           // ... (事件监听器等) ...
        });
        updateHoverTargets();
    } catch(error) {
         container.innerHTML = `<p style="color: red;">加载业务员列表失败.</p>`;
         // Error already shown by fetchSalesIdsAndNames
    }
}
    */