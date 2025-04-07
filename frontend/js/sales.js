let currentSalesSortParams = [];
let currentSalesSearchTerm = '';
const salesIndexToSortKey = { 0: 1, 1: 2, 2: 6 };

function fetchSalesData() {
    const contentDiv = document.getElementById('sales-list-content');
    const clearBtn = document.getElementById('salesClearSearchButton');
    contentDiv.innerHTML = '<p>正在加载业务员列表...</p>';
    let queryParams = [];
    if (currentSalesSearchTerm) { queryParams.push(`query=${encodeURIComponent(currentSalesSearchTerm)}`); }
    if (currentSalesSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentSalesSortParams.join(','))}`); }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    fetch(`/api/fetch_sales${queryString}`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateSalesTable(data.output || "");
            if (clearBtn) clearBtn.style.display = currentSalesSearchTerm ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="8">获取业务员列表失败: ${error.message || error}</td></tr></tbody></table>`;
            showCustomAlert(`获取业务员列表失败: ${error.message || error}`, 'error');
        });
}

function generateSalesTable(output) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('sales-list-content');
    if (lines.length === 0) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="8">没有找到业务员数据。</td></tr></tbody></table></div>';
        return;
    }
    const headers = ['ID', '姓名', '性别', '生日', '邮箱', '电话', '负责客户数', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';
    headers.forEach((headerText, index) => {
        if (index < headers.length - 1 && salesIndexToSortKey[index] !== undefined) {
            const sortKey = salesIndexToSortKey[index];
            const currentSort = currentSalesSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            tableHTML += `<th data-sort-index="${index}" onclick="handleSalesSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';
    lines.forEach(line => {
        const fields = line.split(';');
        if (fields.length < 1 || !fields[0]) return;
        const salesId = fields[0];
        const fullDataEscaped = escape(line);
        tableHTML += `<tr data-id="${salesId}" data-full-sales-string="${fullDataEscaped}">`;
        tableHTML += `<td>${fields[0] || '-'}</td>`;
        tableHTML += `<td>${fields[1] || '-'}</td>`;
        let genderText = '未知';
        if (fields[2] === '1') genderText = '男';
        else if (fields[2] === '2') genderText = '女';
        tableHTML += `<td>${genderText}</td>`;
        tableHTML += `<td>${fields[3] || '?'}-${fields[4] || '?'}-${fields[5] || '?'}</td>`;
        tableHTML += `<td>${fields[6] || '-'}</td>`;
        const salesPhones = (fields[7] || '').split(',').filter(p => p.trim()).map(p => `<span>${p}</span>`).join('<br>');
        tableHTML += `<td>${salesPhones || '-'}</td>`;
        const clientIds = (fields[8] || '').split(',').filter(id => id.trim());
        tableHTML += `<td>${clientIds.length}</td>`;
        tableHTML += `<td class="action-cell" style="white-space: nowrap;">
            <button class="view-btn icon-btn" onclick="viewSalesDetails('${salesId}')" title="查看详情">
                <span class="material-icons-outlined">visibility</span>
            </button>
            <button class="edit-btn icon-btn" onclick="editSalesSetup('${salesId}')" title="编辑">
                <span class="material-icons-outlined">edit</span>
            </button>
            <button class="delete-btn icon-btn" onclick="deleteSales('${salesId}')" title="删除">
                <span class="material-icons-outlined">delete</span>
            </button>
        </td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    updateHoverTargets();
}

function handleSalesSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);
    if (salesIndexToSortKey[columnIndex] === undefined) return;
    const sortKey = salesIndexToSortKey[columnIndex];
    const existingIndex = currentSalesSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) {
        currentSalesSortParams.push(sortKey);
    } else {
        const currentValue = currentSalesSortParams[existingIndex];
        if (currentValue > 0) {
            currentSalesSortParams[existingIndex] = -sortKey;
        } else {
            currentSalesSortParams.splice(existingIndex, 1);
        }
    }
    fetchSalesData();
}

function handleSalesSearchInputKey(event) {
    if (event.key === 'Enter') {
        performSalesSearch();
    }
}

function performSalesSearch() {
    currentSalesSearchTerm = document.getElementById('salesSearchInput').value.trim();
    fetchSalesData();
}

function clearSalesSearch() {
    const searchInput = document.getElementById('salesSearchInput');
    if (searchInput) searchInput.value = '';
    currentSalesSearchTerm = '';
    fetchSalesData();
    const clearBtn = document.getElementById('salesClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

function addSalesPhoneInput() {
    const container = document.getElementById('sales-phone-inputs-container');
    const phoneInputContainer = document.createElement('div');
    phoneInputContainer.className = 'phone-input-container input-group-dynamic';
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'sales_phones';
    newInput.className = 'section-input input phone-input';
    newInput.placeholder = '请输入业务员电话号码';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn icon-btn';
    removeButton.innerHTML = '<span class="material-icons-outlined">remove</span>';
    removeButton.onclick = function () { removeSalesPhoneInput(this); };
    removeButton.style.display = 'inline-flex';
    phoneInputContainer.appendChild(newInput);
    phoneInputContainer.appendChild(removeButton);
    container.appendChild(phoneInputContainer);
    updateSalesPhoneRemoveButtonsVisibility(container);
    updateHoverTargets();
}

function removeSalesPhoneInput(button) {
    const container = button.closest('.input-group-dynamic').parentNode;
    button.closest('.input-group-dynamic').remove();
    updateSalesPhoneRemoveButtonsVisibility(container);
}

function updateSalesPhoneRemoveButtonsVisibility(container) {
    const groups = container.querySelectorAll('.input-group-dynamic');
    if (groups.length === 1) {
        const firstRemoveBtn = groups[0].querySelector('.remove-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    } else {
        groups.forEach(group => {
            const removeBtn = group.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.style.display = 'inline-flex';
            }
        });
    }
}

function resetSalesPhoneInputs() {
    const container = document.getElementById('sales-phone-inputs-container');
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    const firstGroup = container.querySelector('.input-group-dynamic');
    if (firstGroup) {
        const firstInput = firstGroup.querySelector('.phone-input');
        if (firstInput) firstInput.value = '';
        const firstRemoveBtn = firstGroup.querySelector('.remove-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
    }
    if (!firstGroup && container.children.length === 0) {
        addSalesPhoneInput();
    }
}

function resetAndPrepareSalesAddForm() {
    setSalesFormReadOnly(false);
    const form = document.getElementById('sales-form');
    form.reset();
    document.getElementById('editing-sales-id').value = '';
    document.getElementById('sales-form-title').textContent = '添加新业务员';
    resetSalesPhoneInputs();
    loadClientCheckboxes();
    document.getElementById('sales-submit-btn').textContent = '提交业务员信息';
    document.getElementById('sales-submit-btn').onclick = submitSales;
    document.getElementById('sales-submit-btn').style.display = 'inline-block';
    document.getElementById('sales-cancel-btn').style.display = 'none';
    const returnBtn = document.getElementById('sales-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-sales-view').classList.remove('form-view-mode');
}

function setSalesFormReadOnly(isReadOnly) {
    const form = document.getElementById('sales-form');
    const formView = document.getElementById('add-sales-view');
    if (isReadOnly) formView.classList.add('form-view-mode');
    else formView.classList.remove('form-view-mode');
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => el.disabled = isReadOnly);
    form.querySelectorAll('.add-btn, .remove-btn').forEach(btn => btn.disabled = isReadOnly);
    form.querySelectorAll('#sales-client-selection .neumorphic-checkbox-card').forEach(label => {
        const checkbox = document.getElementById(label.htmlFor);
        if (checkbox) {
            checkbox.disabled = isReadOnly;
        }
        if (isReadOnly) {
            label.classList.add('disabled');
        } else {
            label.classList.remove('disabled');
        }
    });
    if (!isReadOnly) {
        updateSalesPhoneRemoveButtonsVisibility(document.getElementById('sales-phone-inputs-container'));
    }
}


function loadClientCheckboxes(selectedClientIds = []) {
    const container = document.getElementById('sales-client-selection');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names')
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            container.innerHTML = '';
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
                        const checkboxId = `client-${clientId}`;
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = checkboxId;
                        checkbox.name = 'assigned_clients';
                        checkbox.value = clientId;
                        checkbox.checked = selectedClientIds.includes(clientId);
                        const label = document.createElement('label');
                        label.htmlFor = checkboxId;
                        label.className = 'neumorphic-checkbox-card hover-target';
                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'client-name';
                        nameSpan.textContent = clientName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display';
                        idSpan.textContent = `(ID: ${clientId})`;
                        label.appendChild(checkbox);
                        label.appendChild(nameSpan);
                        label.appendChild(idSpan);
                        container.appendChild(label); -
                            checkbox.addEventListener('change', function () {
                                const cardLabel = document.querySelector(`label[for="${this.id}"]`);
                                if (cardLabel) {
                                    if (this.checked) {
                                        cardLabel.classList.add('selected');
                                    } else {
                                        cardLabel.classList.remove('selected');
                                    }
                                }
                            });
                        if (checkbox.checked) {
                            label.classList.add('selected');
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

function viewSalesDetails(salesId) {
    const row = document.querySelector(`#sales-list-content tr[data-id="${salesId}"]`);
    if (!row) { showCustomAlert("无法加载业务员数据。", 'error'); return; }
    const fullSalesString = unescape(row.dataset.fullSalesString);
    if (!fullSalesString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateSalesForm(salesId, fullSalesString);
    showView('add-sales-view', 'sales-section');
    setSalesFormReadOnly(true);
    document.getElementById('sales-form-title').textContent = '业务员详细信息';
    document.getElementById('sales-submit-btn').style.display = 'none';
    document.getElementById('sales-cancel-btn').style.display = 'none';
    const formActions = document.querySelector('#add-sales-view .form-actions');
    let returnBtn = document.getElementById('sales-return-btn');
    if (returnBtn) returnBtn.remove();
    returnBtn = document.createElement('button');
    returnBtn.id = 'sales-return-btn';
    returnBtn.type = 'button';
    returnBtn.className = 'section-btn cancel-btn hover-target';
    returnBtn.textContent = '返回列表';
    returnBtn.style.marginLeft = '15px';
    returnBtn.onclick = () => {
        setAppLockedState(false);
        resetAndPrepareSalesAddForm();
        showView('sales-list-view', 'sales-section');
    };
    formActions.appendChild(returnBtn);
    o(returnBtn);
    window.scrollTo(0, 0);
}

function editSalesSetup(salesId) {
    const row = document.querySelector(`#sales-list-content tr[data-id="${salesId}"]`);
    if (!row) { showCustomAlert("无法加载业务员数据。", 'error'); return; }
    const fullSalesString = unescape(row.dataset.fullSalesString);
    if (!fullSalesString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateSalesForm(salesId, fullSalesString);
    document.getElementById('sales-form-title').textContent = '编辑业务员信息';
    const submitBtn = document.getElementById('sales-submit-btn');
    submitBtn.textContent = '更新业务员信息';
    submitBtn.onclick = submitSalesUpdate;
    submitBtn.style.display = 'inline-block';
    const cancelBtn = document.getElementById('sales-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelSalesUpdate;
    const returnBtn = document.getElementById('sales-return-btn');
    if (returnBtn) returnBtn.remove();
    showView('add-sales-view', 'sales-section');
    setSalesFormReadOnly(false);
    window.scrollTo(0, 0);
}

function populateSalesForm(salesId, fullSalesString) {
    setSalesFormReadOnly(false);
    const form = document.getElementById('sales-form');
    form.reset();
    resetSalesPhoneInputs();
    document.getElementById('editing-sales-id').value = salesId;
    const fields = fullSalesString.split(';');
    form.elements['sales-name'].value = fields[1] || '';
    form.elements['sales-gender'].value = fields[2] || '';
    form.elements['sales-birth_year'].value = fields[3] || '';
    form.elements['sales-birth_month'].value = fields[4] || '';
    form.elements['sales-birth_day'].value = fields[5] || '';
    form.elements['sales-email'].value = fields[6] || '';
    const salesPhonesStr = fields[7] || '';
    const salesPhones = salesPhonesStr.split(',').filter(p => p.trim());
    const phoneContainer = document.getElementById('sales-phone-inputs-container');
    while (phoneContainer.children.length > 1) {
        phoneContainer.removeChild(phoneContainer.lastChild);
    }
    const firstPhoneInput = phoneContainer.querySelector('.phone-input');
    if (firstPhoneInput) firstPhoneInput.value = '';
    if (salesPhones.length > 0) {
        if (firstPhoneInput) {
            firstPhoneInput.value = salesPhones[0];
        } else if (phoneContainer.children.length === 0) {
            addSalesPhoneInput();
            phoneContainer.querySelector('.phone-input').value = salesPhones[0];
        }
        for (let i = 1; i < salesPhones.length; i++) {
            addSalesPhoneInput();
            phoneContainer.lastElementChild.querySelector('.phone-input').value = salesPhones[i];
        }
    } else {
        if (phoneContainer.children.length === 0) {
            addSalesPhoneInput();
        } else if (firstPhoneInput) {
            firstPhoneInput.value = '';
        }
    }
    updateSalesPhoneRemoveButtonsVisibility(phoneContainer);
    const clientIdsStr = fields[8] || '';
    const selectedClientIds = clientIdsStr.split(',').filter(id => id.trim());
    loadClientCheckboxes(selectedClientIds);
    updateHoverTargets();
}

function submitSales() {
    const form = document.getElementById('sales-form');
    const salesData = {
        id: '0',
        name: form.elements['sales-name'].value.trim(),
        gender: form.elements['sales-gender'].value,
        birth_year: form.elements['sales-birth_year'].value.trim() || '0',
        birth_month: form.elements['sales-birth_month'].value.trim() || '0',
        birth_day: form.elements['sales-birth_day'].value.trim() || '0',
        email: form.elements['sales-email'].value.trim()
    };
    let salesPhones = [];
    const salesPhoneInputs = document.querySelectorAll('#sales-phone-inputs-container .phone-input');
    salesPhoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) salesPhones.push(phone);
    });
    const salesPhonesStr = salesPhones.join(',');
    let assignedClientIds = [];
    const clientCheckboxes = form.querySelectorAll('#sales-client-selection input[name="assigned_clients"]:checked');
    clientCheckboxes.forEach(checkbox => {
        assignedClientIds.push(checkbox.value);
    });
    const clientIDsStr = assignedClientIds.join(',');
    const finalSalesString = [
        salesData.id, salesData.name, salesData.gender, salesData.birth_year,
        salesData.birth_month, salesData.birth_day, salesData.email,
        salesPhonesStr, clientIDsStr
    ].join(';');
    fetch('/api/add_sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesData: finalSalesString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            showCustomAlert(data.output || '添加业务员成功！', 'success');
            resetAndPrepareSalesAddForm();
            showView('sales-list-view', 'sales-section');
        })
        .catch(error => {
            showCustomAlert('添加业务员失败: ' + (error.message || '未知错误'), 'error');
        });
}


function submitSalesUpdate() {
    const form = document.getElementById('sales-form');
    const salesId = document.getElementById('editing-sales-id').value;
    const salesData = {
        id: salesId,
        name: form.elements['sales-name'].value.trim(),
        gender: form.elements['sales-gender'].value,
        birth_year: form.elements['sales-birth_year'].value.trim() || '0',
        birth_month: form.elements['sales-birth_month'].value.trim() || '0',
        birth_day: form.elements['sales-birth_day'].value.trim() || '0',
        email: form.elements['sales-email'].value.trim()
    };
    let salesPhones = [];
    const salesPhoneInputs = document.querySelectorAll('#sales-phone-inputs-container .phone-input');
    salesPhoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) salesPhones.push(phone);
    });
    const salesPhonesStr = salesPhones.join(',');
    let assignedClientIds = [];
    const clientCheckboxes = form.querySelectorAll('#sales-client-selection input[name="assigned_clients"]:checked');
    clientCheckboxes.forEach(checkbox => {
        assignedClientIds.push(checkbox.value);
    });
    const clientIDsStr = assignedClientIds.join(',');
    const finalSalesString = [
        salesData.id, salesData.name, salesData.gender, salesData.birth_year,
        salesData.birth_month, salesData.birth_day, salesData.email,
        salesPhonesStr, clientIDsStr
    ].join(';');
    fetch('/api/update_sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesData: finalSalesString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '业务员信息已更新！', 'success');
            setAppLockedState(false);
            resetAndPrepareSalesAddForm();
            showView('sales-list-view', 'sales-section');
        })
        .catch(error => {
            showCustomAlert('更新业务员失败: ' + (error.message || '未知错误'), 'error');
        });
}

function cancelSalesUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失。",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false);
            resetAndPrepareSalesAddForm();
            showView('sales-list-view', 'sales-section');
        }
    );
}


function deleteSales(salesId) {
    showCustomConfirm(
        `业务员 ID 为 ${salesId} 的记录将被永久删除，此操作无法撤销。`,
        `确定要删除此业务员吗？`,
        () => {
            fetch(`/api/delete_sales/${salesId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert('删除业务员失败：' + data.error, 'error');
                    } else {
                        showCustomAlert(data.output || `业务员 ${salesId} 已删除。`, 'success');
                        fetchSalesData();
                    }
                })
                .catch(error => {
                    showCustomAlert("删除业务员时发生网络错误。", 'error');
                });
        }

    );
}