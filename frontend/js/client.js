let currentClientSortParams = [];
let currentClientGeneralSearch = '';
let currentClientNameSearch = '';
let currentClientRegionSearch = '';
let currentClientAddressSearch = '';
let currentClientLegalPersonSearch = '';
let currentClientSizeSearch = '';
let currentClientContactLevelSearch = '';
let currentClientEmailSearch = '';
let currentClientContactCountSearch = '';
const clientIndexToSortKey = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 9: 10 };

function fetchClientData() {
    const contentDiv = document.getElementById('client-list-content');
    const clearBtn = document.getElementById('clearSearchButton');
    const role = sessionStorage.getItem("role");
    const sales_id = sessionStorage.getItem("sales_id");
    let queryParams = [];
    if (currentClientGeneralSearch) queryParams.push(`query=${encodeURIComponent(currentClientGeneralSearch)}`);
    if (currentClientNameSearch) queryParams.push(`name=${encodeURIComponent(currentClientNameSearch)}`);
    if (currentClientRegionSearch) queryParams.push(`region=${encodeURIComponent(currentClientRegionSearch)}`);
    if (currentClientAddressSearch) queryParams.push(`address=${encodeURIComponent(currentClientAddressSearch)}`);
    if (currentClientLegalPersonSearch) queryParams.push(`legal_person=${encodeURIComponent(currentClientLegalPersonSearch)}`);
    if (currentClientSizeSearch) queryParams.push(`size=${encodeURIComponent(currentClientSizeSearch)}`);
    if (currentClientContactLevelSearch) queryParams.push(`contact_level=${encodeURIComponent(currentClientContactLevelSearch)}`);
    if (currentClientEmailSearch) queryParams.push(`email=${encodeURIComponent(currentClientEmailSearch)}`);
    if (currentClientContactCountSearch) queryParams.push(`contact_count=${encodeURIComponent(currentClientContactCountSearch)}`);
    if (currentClientSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentClientSortParams.join(','))}`); }
    if (role === 'sales' && sales_id && sales_id !== '0' && sales_id !== '-1') {
        queryParams.push(`filter_sales_id=${encodeURIComponent(sales_id)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    contentDiv.innerHTML = '<p>正在加载客户列表...</p>';
    fetch(`/api/fetch_clients${queryString}`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            generateClientTable(data.output || "");
            const hasSearchTerms = currentClientGeneralSearch || currentClientNameSearch || currentClientRegionSearch || currentClientAddressSearch || currentClientLegalPersonSearch || currentClientSizeSearch || currentClientContactLevelSearch || currentClientEmailSearch || currentClientContactCountSearch;
            if (clearBtn) clearBtn.style.display = hasSearchTerms ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="11">获取客户列表失败: ${error.message || error}</td></tr></tbody></table>`;
            showCustomAlert(`获取客户列表失败: ${error.message || error}`, 'error');
        });
}

function generateClientTable(output, totalCount) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('client-list-content');
    const role = sessionStorage.getItem("role");
    const isSales = (role === 'sales');
    const resultCountDiv = document.getElementById('client-search-result-count');
    if (resultCountDiv) {
        if (lines.length > 0) {
            const countToShow = (typeof totalCount !== 'undefined' && totalCount >= 0) ? totalCount : lines.length;
            resultCountDiv.textContent = `找到 ${countToShow} 条结果`;
            resultCountDiv.style.display = 'inline-block';
        } else {
            resultCountDiv.textContent = '没有找到匹配的结果';
            resultCountDiv.style.display = 'inline-block';
        }
    }
    if (lines.length === 0 && (typeof totalCount === 'undefined' || totalCount === 0)) {
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="11">没有找到客户数据。</td></tr></tbody></table></div>';
        return;
    }
    const headers = ['ID', '姓名', '地区', '地址', '法人', '规模', '等级', '邮箱', '客户电话', '联络员数', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';
    headers.forEach((headerText, index) => {
        if (index < headers.length - 1 && clientIndexToSortKey[index] !== undefined) {
            const sortKey = clientIndexToSortKey[index];
            const currentSort = currentClientSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            tableHTML += `<th data-sort-index="${index}" onclick="handleClientSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';
    lines.forEach(line => {
        const fields = line.split('\x1C');
        if (fields.length < 1 || !fields[0]) return;
        const clientId = fields[0];
        const fullDataEscaped = escape(line);
        tableHTML += `<tr data-id="${clientId}" data-full-client-string="${fullDataEscaped}">`;
        for (let i = 0; i < 10; i++) {
            const fieldValue = fields[i] !== undefined ? fields[i].trim() : '';
            if (i === 8) {
                const clientPhones = fieldValue.split('\x1D').filter(p => p.trim()).map(p => `<span>${p}</span>`).join('<br>');
                tableHTML += `<td>${clientPhones || '-'}</td>`;
            } else if (i === 9) {
                const contactsStr = fields.slice(9).join('\x1C').trim();
                let contactCount = 0;
                if (contactsStr) {
                    contactCount = contactsStr.split('\x1D').filter(c => c.trim()).length;
                }
                tableHTML += `<td class="contacts-count-cell">${contactCount}</td>`;
            } else {
                tableHTML += `<td>${fieldValue || '-'}</td>`;
            }
        }
        tableHTML += `<td class="action-cell" style="white-space: nowrap;"></td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    const tableRows = container.querySelectorAll('.data-table tbody tr');
    tableRows.forEach(row => {
        const clientId = row.dataset.id;
        const actionCell = row.querySelector('.action-cell');
        if (clientId && actionCell) {
            let buttonsHTML = `<button class="view-btn icon-btn" onclick="viewClientDetails('${clientId}')" title="查看详情">
                                   <span class="material-icons-outlined">visibility</span>
                                </button>`;
            if (!isSales) {
                buttonsHTML += `<button class="edit-btn icon-btn action-requires-manager" onclick="editClientSetup('${clientId}')" title="编辑">
                                     <span class="material-icons-outlined">edit</span>
                                   </button>
                                   <button class="delete-btn icon-btn action-requires-manager" onclick="deleteClient('${clientId}')" title="删除">
                                       <span class="material-icons-outlined">delete</span>
                                   </button>`;
            }
            actionCell.innerHTML = buttonsHTML;
        }
    });
    updateHoverTargets();
}

function handleClientSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);
    if (clientIndexToSortKey[columnIndex] === undefined) return;
    const sortKey = clientIndexToSortKey[columnIndex];
    const existingIndex = currentClientSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) { currentClientSortParams.push(sortKey); }
    else {
        const currentValue = currentClientSortParams[existingIndex];
        if (currentValue > 0) { currentClientSortParams[existingIndex] = -sortKey; }
        else { currentClientSortParams.splice(existingIndex, 1); }
    }
    fetchClientData();
}

function handleClientSearchInputKey(event) {
    if (event.key === 'Enter') {
        performClientSearch();
    }
}

function performClientSearch() {
    currentClientGeneralSearch = document.getElementById('clientSearchInput').value.trim();
    currentClientNameSearch = document.getElementById('clientNameSearchInput').value.trim();
    currentClientRegionSearch = document.getElementById('clientRegionSearchInput').value.trim();
    currentClientAddressSearch = document.getElementById('clientAddressSearchInput').value.trim();
    currentClientLegalPersonSearch = document.getElementById('clientLegalPersonSearchInput').value.trim();
    currentClientSizeSearch = document.getElementById('clientSizeSearchInput').value.trim();
    currentClientContactLevelSearch = document.getElementById('clientContactLevelSearchInput').value.trim();
    currentClientEmailSearch = document.getElementById('clientEmailSearchInput').value.trim();
    currentClientContactCountSearch = document.getElementById('clientContactCountSearchInput').value.trim();
    fetchClientData();
}

function clearClientSearch() {
    const inputs = [
        'clientSearchInput', 'clientNameSearchInput', 'clientRegionSearchInput',
        'clientAddressSearchInput', 'clientLegalPersonSearchInput', 'clientSizeSearchInput',
        'clientContactLevelSearchInput', 'clientEmailSearchInput',
        'clientContactCountSearchInput'
    ];
    inputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) inputElement.value = '';
    });
    currentClientGeneralSearch = '';
    currentClientNameSearch = '';
    currentClientRegionSearch = '';
    currentClientAddressSearch = '';
    currentClientLegalPersonSearch = '';
    currentClientSizeSearch = '';
    currentClientContactLevelSearch = '';
    currentClientEmailSearch = '';
    urrentClientContactCountSearch = '';
    const detailedArea = document.getElementById('detailed-search-area');
    const toggleBtn = document.getElementById('toggleDetailedSearchBtn');
    if (detailedArea) detailedArea.classList.remove('show');
    if (toggleBtn) toggleBtn.classList.remove('active');
    fetchClientData();
    const clearBtn = document.getElementById('clearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

function addClientPhoneInput() {
    const container = document.getElementById('client-phone-inputs-container');
    const phoneInputContainer = document.createElement('div');
    phoneInputContainer.className = 'phone-input-container input-group-dynamic';
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'client_phones';
    newInput.className = 'section-input input phone-input';
    newInput.placeholder = '请输入客户电话号码';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn icon-btn';
    removeButton.innerHTML = '<span class="material-icons-outlined">remove</span>';
    removeButton.onclick = function () { removeClientPhoneInput(this); };
    removeButton.style.display = 'inline-flex';
    phoneInputContainer.appendChild(newInput);
    phoneInputContainer.appendChild(removeButton);
    container.appendChild(phoneInputContainer);
    updateClientPhoneRemoveButtonsVisibility(container);
    updateHoverTargets();
}

function removeClientPhoneInput(button) {
    const container = button.closest('.input-group-dynamic').parentNode;
    button.closest('.input-group-dynamic').remove();
    updateClientPhoneRemoveButtonsVisibility(container);
}

function updateClientPhoneRemoveButtonsVisibility(container) {
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

function resetClientPhoneInputs() {
    const container = document.getElementById('client-phone-inputs-container');
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
    if (!firstGroup) {
        addClientPhoneInput();
    }
}

function addClientContactGroup() {
    const container = document.getElementById('contacts-container');
    const contactGroup = document.createElement('div');
    contactGroup.className = 'contact-group card';
    contactGroup.dataset.contactId = '0';
    contactGroup.innerHTML = `
        <button type="button" class="remove-contact-btn remove-btn icon-btn" onclick="removeClientContactGroup(this)" title="移除此联络员">
            <span class="material-icons-outlined">close</span>
        </button>
        <h4 class="contact-title">新联络员信息</h4>
        <div class="contact-fields-grid">
            <div class="form-group">
                <label class="section-label">姓名:</label>
                <input type="text" name="contact_name" class="section-input input contact-name" required>
            </div>
            <div class="form-group">
            <label class="section-label">性别:</label>
            <select name="contact_gender" class="section-input input contact-gender" required>
                <option value="">请选择</option>
                <option value="1">男</option>  
                <option value="2">女</option>  
                <option value="0">未知</option>
            </select>
            </div>
            <div class="form-group form-group-full">
                <label class="section-label">生日 (年-月-日):</label>
                <div class="birthdate-inputs">
                    <input type="number" name="contact_birth_year" class="section-input input contact-birth-year" placeholder="年"> -
                    <input type="number" name="contact_birth_month" class="section-input input contact-birth-month" placeholder="月"> -
                    <input type="number" name="contact_birth_day" class="section-input input contact-birth-day" placeholder="日">
                </div>
            </div>
            <div class="form-group form-group-full">
                <label class="section-label">邮箱:</label>
                <input type="email" name="contact_email" class="section-input input contact-email" placeholder="联络员邮箱">
            </div>
            <div class="form-group form-group-full">
                <label class="section-label">电话:</label>
                <div class="contact-phones-container dynamic-input-list">
                   
                    <div class="contact-phone-input-container input-group-dynamic">
                        <input type="text" name="contact_phones" class="section-input input contact-phone-input" placeholder="联络员电话">
                        <button type="button" class="remove-btn icon-btn remove-contact-phone-btn" style="display: none;" onclick="removeClientContactPhoneInput(this)">
                            <span class="material-icons-outlined">remove</span>
                        </button>
                    </div>
                </div>
                <button type="button" class="add-btn icon-btn add-contact-phone-btn" onclick="addClientContactPhoneInput(this)">
                    <span class="material-icons-outlined">add</span> 添加电话
                </button>
            </div>
        </div>
    `;
    container.appendChild(contactGroup);
    const firstPhoneGroup = contactGroup.querySelector('.contact-phones-container .input-group-dynamic');
    if (firstPhoneGroup) {
        updateClientContactPhoneRemoveButtonsVisibility(firstPhoneGroup.parentNode);
    }
    updateHoverTargets();
}

function removeClientContactGroup(button) {
    button.closest('.contact-group').remove();
}

function resetContactsContainer() {
    document.getElementById('contacts-container').innerHTML = '';
}

function addClientContactPhoneInput(addButton) {
    const container = addButton.previousElementSibling;
    if (!container || !container.classList.contains('contact-phones-container')) {
        return;
    }
    const inputContainer = document.createElement('div');
    inputContainer.className = 'contact-phone-input-container input-group-dynamic';
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'contact_phones';
    newInput.className = 'section-input input contact-phone-input';
    newInput.placeholder = '联络员电话';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn icon-btn remove-contact-phone-btn';
    removeButton.innerHTML = '<span class="material-icons-outlined">remove</span>';
    removeButton.style.display = 'inline-flex';
    removeButton.onclick = function () { removeClientContactPhoneInput(this); };
    inputContainer.appendChild(newInput);
    inputContainer.appendChild(removeButton);
    container.appendChild(inputContainer);
    updateClientContactPhoneRemoveButtonsVisibility(container);
    updateHoverTargets();
}

function removeClientContactPhoneInput(removeButton) {
    const container = removeButton.closest('.input-group-dynamic').parentNode;
    removeButton.closest('.input-group-dynamic').remove();
    updateClientContactPhoneRemoveButtonsVisibility(container);
}

function updateClientContactPhoneRemoveButtonsVisibility(container) {
    const groups = container.querySelectorAll('.input-group-dynamic');
    if (groups.length === 1) {
        const firstRemoveBtn = groups[0].querySelector('.remove-contact-phone-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
    } else {
        groups.forEach(group => {
            const removeBtn = group.querySelector('.remove-contact-phone-btn');
            if (removeBtn) removeBtn.style.display = 'inline-flex';
        });
    }
}

function resetAndPrepareClientAddForm() {
    setClientFormReadOnly(false);
    const form = document.getElementById('client-form');
    form.reset();
    document.getElementById('editing-client-id').value = '';
    document.getElementById('client-form-title').textContent = '添加新客户';
    resetClientPhoneInputs();
    resetContactsContainer();
    const resultMsg = document.getElementById('client-add-result');
    if (resultMsg) { resultMsg.textContent = ''; resultMsg.style.display = 'none'; }
    document.getElementById('client-submit-btn').textContent = '提交客户信息';
    document.getElementById('client-submit-btn').onclick = submitClient;
    document.getElementById('client-submit-btn').style.display = 'inline-block';
    document.getElementById('client-cancel-btn').style.display = 'none';
    const returnBtn = document.getElementById('client-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-client-view').classList.remove('form-view-mode');
}

function setClientFormReadOnly(isReadOnly) {
    const form = document.getElementById('client-form');
    const formView = document.getElementById('add-client-view');
    if (isReadOnly) formView.classList.add('form-view-mode');
    else formView.classList.remove('form-view-mode');
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => el.disabled = isReadOnly);
    form.querySelectorAll('.add-btn, .remove-btn, .remove-contact-btn, .remove-contact-phone-btn').forEach(btn => btn.disabled = isReadOnly);
    if (!isReadOnly) {
        updateClientPhoneRemoveButtonsVisibility(document.getElementById('client-phone-inputs-container'));
        document.querySelectorAll('#contacts-container .contact-group').forEach(group => {
            const phoneContainer = group.querySelector('.contact-phones-container');
            if (phoneContainer) updateClientContactPhoneRemoveButtonsVisibility(phoneContainer);
        });
    }
}

function viewClientDetails(clientId) {
    const row = document.querySelector(`#client-list-content tr[data-id="${clientId}"]`);
    if (!row) { showCustomAlert("无法加载客户数据。", 'error'); return; }
    const fullClientString = unescape(row.dataset.fullClientString);
    if (!fullClientString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateClientForm(clientId, fullClientString);
    const parentSection = document.getElementById('client-section');
    showView('add-client-view', 'client-section');
    setClientFormReadOnly(true);
    document.getElementById('client-form-title').textContent = '客户详细信息';
    document.getElementById('client-submit-btn').style.display = 'none';
    document.getElementById('client-cancel-btn').style.display = 'none';
    const formActions = document.querySelector('#add-client-view .form-actions');
    let returnBtn = document.getElementById('client-return-btn');
    if (returnBtn) returnBtn.remove();
    returnBtn = document.createElement('button');
    returnBtn.id = 'client-return-btn';
    returnBtn.type = 'button';
    returnBtn.className = 'section-btn cancel-btn hover-target';
    returnBtn.textContent = '返回列表';
    returnBtn.style.marginLeft = '15px';
    returnBtn.onclick = () => {
        setAppLockedState(false);
        resetAndPrepareClientAddForm();
        showView('client-list-view', 'client-section');
    };
    formActions.appendChild(returnBtn);
    o(returnBtn);
    window.scrollTo(0, 0);
}

function returnToClientList() {
    setClientFormReadOnly(false);
    resetAndPrepareClientAddForm();
    showView('client-list-view', 'client-section');
}

function submitClient() {
    const form = document.getElementById('client-form');
    const clientData = {
        id: '0',
        name: form.elements['client-name'].value.trim(),
        region: form.elements['client-region'].value.trim(),
        address: form.elements['client-address'].value.trim(),
        legal_person: form.elements['client-legal_person'].value.trim(),
        size: form.elements['client-size'].value.trim() || '0',
        contact_level: form.elements['client-contact_level'].value.trim() || '0',
        email: form.elements['client-email'].value.trim()
    };
    let clientPhones = [];
    const clientPhoneInputs = document.querySelectorAll('#client-phone-inputs-container .phone-input');
    clientPhoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) clientPhones.push(phone);
    });
    const clientPhonesStr = clientPhones.join('\x1D');
    let contactsArray = [];
    const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
    contactGroups.forEach(group => {
        const name = group.querySelector('.contact-name').value.trim();
        if (!name) return;
        const genderSelect = group.querySelector('.contact-gender');
        let gender = '未知';
        if (genderSelect.selectedIndex > 0) {
            gender = genderSelect.options[genderSelect.selectedIndex].text.trim();
        } else if (genderSelect.value === '0') {
            gender = '未知';
        }
        const year = group.querySelector('.contact-birth-year').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day').value.trim() || '0';
        const email = group.querySelector('.contact-email').value.trim();
        let contactPhones = [];
        const contactPhoneInputs = group.querySelectorAll('.contact-phone-input');
        contactPhoneInputs.forEach(input => {
            const phone = input.value.trim();
            if (phone) contactPhones.push(phone);
        });
        const contactPhonesStr = contactPhones.join('\x1F');
        const contactString = `0\x1E${name}\x1E${gender}\x1E${year}\x1E${month}\x1E${day}\x1E${email}\x1E${contactPhonesStr}`;
        contactsArray.push(contactString);
    });
    const contactsStr = contactsArray.join('\x1D');
    const finalClientString = [
        clientData.id, clientData.name, clientData.region, clientData.address,
        clientData.legal_person, clientData.size, clientData.contact_level,
        clientData.email, clientPhonesStr, contactsStr
    ].join('\x1C');
    fetch('/api/add_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: finalClientString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            showCustomAlert(data.output || '添加客户成功！', 'success');
            resetAndPrepareClientAddForm();
            showView('client-list-view', 'client-section');
        })
        .catch(error => {
            const errorMsg = error.message || '操作时发生未知错误';
            showCustomAlert('添加客户失败: ' + errorMsg, 'error');
        });
}

function editClientSetup(clientId) {
    const row = document.querySelector(`#client-list-content tr[data-id="${clientId}"]`);
    if (!row) { showCustomAlert("无法加载客户数据。", 'error'); return; }
    const fullClientString = unescape(row.dataset.fullClientString);
    if (!fullClientString) { showCustomAlert("无法加载详细数据。", 'error'); return; }
    setAppLockedState(true);
    populateClientForm(clientId, fullClientString);
    document.getElementById('client-form-title').textContent = '编辑客户信息';
    const submitBtn = document.getElementById('client-submit-btn');
    submitBtn.textContent = '更新客户信息';
    submitBtn.onclick = submitClientUpdate;
    submitBtn.style.display = 'inline-block';
    const cancelBtn = document.getElementById('client-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelClientUpdate;
    const returnBtn = document.getElementById('client-return-btn');
    if (returnBtn) returnBtn.remove();
    showView('add-client-view', 'client-section');
    setClientFormReadOnly(false);
    window.scrollTo(0, 0);
}

function populateClientForm(clientId, fullClientString) {
    setClientFormReadOnly(false);
    const form = document.getElementById('client-form');
    form.reset();
    resetClientPhoneInputs();
    resetContactsContainer();
    document.getElementById('editing-client-id').value = clientId;
    const fields = fullClientString.split('\x1C');
    form.elements['client-name'].value = fields[1] || '';
    form.elements['client-region'].value = fields[2] || '';
    form.elements['client-address'].value = fields[3] || '';
    form.elements['client-legal_person'].value = fields[4] || '';
    form.elements['client-size'].value = fields[5] || '';
    form.elements['client-contact_level'].value = fields[6] || '';
    form.elements['client-email'].value = fields[7] || '';
    const clientPhonesStr = fields[8] || '';
    const clientPhones = clientPhonesStr.split('\x1D').filter(p => p.trim());
    const phoneContainer = document.getElementById('client-phone-inputs-container');
    if (phoneContainer.children.length === 1 && !phoneContainer.querySelector('.phone-input').value && clientPhones.length > 0) {
        phoneContainer.innerHTML = '';
    } else if (phoneContainer.children.length > 0 && clientPhones.length > 0) {
        phoneContainer.querySelectorAll('.phone-input').forEach(input => input.value = '');
        while (phoneContainer.children.length > 1) {
            container.removeChild(container.lastChild);
        }
    }
    if (clientPhones.length > 0) {
        const firstInput = phoneContainer.querySelector('.phone-input');
        if (firstInput) {
            firstInput.value = clientPhones[0];
            for (let i = 1; i < clientPhones.length; i++) {
                addClientPhoneInput();
                phoneContainer.lastElementChild.querySelector('.phone-input').value = clientPhones[i];
            }
        } else {
            clientPhones.forEach(phone => {
                addClientPhoneInput();
                phoneContainer.lastElementChild.querySelector('.phone-input').value = phone;
            });
        }
    } else {
        if (phoneContainer.children.length === 0) {
            addClientPhoneInput();
        }
    }
    updateClientPhoneRemoveButtonsVisibility(phoneContainer);
    const contactsStr = fields.slice(9).join('\x1C').trim();
    const contacts = contactsStr.split('\x1D').filter(c => c.trim());
    const contactsContainer = document.getElementById('contacts-container');
    contactsContainer.innerHTML = '';
    contacts.forEach(contactData => {
        addClientContactGroup();
        const newGroup = contactsContainer.lastElementChild;
        const contactFields = contactData.split('\x1E');
        const contactId = contactFields[0] || '0';
        newGroup.dataset.contactId = contactId;
        newGroup.querySelector('.contact-name').value = contactFields[1] || '';
        const genderValueStored = contactFields[2] || '未知';
        const genderSelect = newGroup.querySelector('.contact-gender');
        if (genderValueStored === '男') {
            genderSelect.value = '1';
        } else if (genderValueStored === '女') {
            genderSelect.value = '2';
        } else {
            genderSelect.value = '0';
        }
        newGroup.querySelector('.contact-birth-year').value = contactFields[3] || '';
        newGroup.querySelector('.contact-birth-month').value = contactFields[4] || '';
        newGroup.querySelector('.contact-birth-day').value = contactFields[5] || '';
        newGroup.querySelector('.contact-email').value = contactFields[6] || '';
        const contactPhonesStr = contactFields.slice(7).join('\x1E');
        const contactPhones = contactPhonesStr.split('\x1F').filter(p => p.trim());
        const contactPhoneContainer = newGroup.querySelector('.contact-phones-container');
        if (contactPhoneContainer.children.length === 1 && !contactPhoneContainer.querySelector('.contact-phone-input').value && contactPhones.length > 0) {
            contactPhoneContainer.innerHTML = '';
        }
        if (contactPhones.length > 0) {
            const addPhoneBtn = newGroup.querySelector('.add-contact-phone-btn');
            contactPhones.forEach(phone => {
                addClientContactPhoneInput(addPhoneBtn);
                contactPhoneContainer.lastElementChild.querySelector('.contact-phone-input').value = phone;
            });
        } else {
            if (contactPhoneContainer.children.length === 0) {
                const addPhoneBtn = newGroup.querySelector('.add-contact-phone-btn');
                addClientContactPhoneInput(addPhoneBtn);
            }
        }
        updateClientContactPhoneRemoveButtonsVisibility(contactPhoneContainer);
    });
    updateHoverTargets();
}

function submitClientUpdate() {
    const form = document.getElementById('client-form');
    const clientId = document.getElementById('editing-client-id').value;
    const clientData = {
        id: clientId,
        name: form.elements['client-name'].value.trim(),
        region: form.elements['client-region'].value.trim(),
        address: form.elements['client-address'].value.trim(),
        legal_person: form.elements['client-legal_person'].value.trim(),
        size: form.elements['client-size'].value.trim() || '0',
        contact_level: form.elements['client-contact_level'].value.trim() || '0',
        email: form.elements['client-email'].value.trim()
    };
    let clientPhones = [];
    const clientPhoneInputs = document.querySelectorAll('#client-phone-inputs-container .phone-input');
    clientPhoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) clientPhones.push(phone);
    });
    const clientPhonesStr = clientPhones.join('\x1D');
    let contactsArray = [];
    const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
    contactGroups.forEach(group => {
        const name = group.querySelector('.contact-name').value.trim();
        if (!name) return;
        const contactId = group.dataset.contactId || '0';
        const genderSelect = group.querySelector('.contact-gender');
        let gender = '未知';
        if (genderSelect.selectedIndex > 0) {
            gender = genderSelect.options[genderSelect.selectedIndex].text.trim();
        } else if (genderSelect.value === '0') {
            gender = '未知';
        }
        const year = group.querySelector('.contact-birth-year').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day').value.trim() || '0';
        const email = group.querySelector('.contact-email').value.trim();
        let contactPhones = [];
        const contactPhoneInputs = group.querySelectorAll('.contact-phone-input');
        contactPhoneInputs.forEach(input => {
            const phone = input.value.trim();
            if (phone) contactPhones.push(phone);
        });
        const contactPhonesStr = contactPhones.join('\x1F');
        const contactString = `${contactId}\x1E${name}\x1E${gender}\x1E${year}\x1E${month}\x1E${day}\x1E${email}\x1E${contactPhonesStr}`;
        contactsArray.push(contactString);
    });
    const contactsStr = contactsArray.join('\x1D');
    const finalClientString = [
        clientData.id, clientData.name, clientData.region, clientData.address,
        clientData.legal_person, clientData.size, clientData.contact_level,
        clientData.email, clientPhonesStr, contactsStr
    ].join('\x1C');
    fetch('/api/update_client', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: finalClientString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showCustomAlert(data.output || '客户信息已更新！', 'success');
            setAppLockedState(false);
            resetAndPrepareClientAddForm();
            showView('client-list-view', 'client-section');
        })
        .catch(error => {
            const errorMsg = error.message || '更新客户时发生未知错误';
            showCustomAlert('更新客户失败: ' + errorMsg, 'error');
        });
}

function cancelClientUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失。",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false);
            resetAndPrepareClientAddForm();
            showView('client-list-view', 'client-section');
        }
    );
}
function deleteClient(clientId) {
    showCustomConfirm(
        `客户 ID 为 ${clientId} 的记录将被永久删除，此操作无法撤销。`,
        `确定要删除此客户吗？`,
        () => {
            fetch(`/api/delete_client/${clientId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCustomAlert('删除客户失败：' + data.error, 'error');
                    } else {
                        showCustomAlert(data.output || `客户 ${clientId} 已删除。`, 'success');
                        fetchClientData();
                    }
                })
                .catch(error => {
                    showCustomAlert("删除客户时发生网络错误。", 'error');
                });
        }
    );
}