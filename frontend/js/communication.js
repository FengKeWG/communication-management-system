let currentCommunicationSortParams = [];
let currentCommunicationGeneralSearch = '';
let currentCommClientIdSearch = '';
let currentCommContactIdSearch = '';
let currentCommSalesIdSearch = '';
let currentCommDurationSearch = '';
let currentCommContentSearch = '';
const communicationIndexToSortKey = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 8, 6: 11 };

function fetchCommunicationData() {
    const contentDiv = document.getElementById('communication-list-content');
    const clearBtn = document.getElementById('communicationClearSearchButton');
    const resultCountDiv = document.getElementById('communication-search-result-count');
    contentDiv.innerHTML = '<p>正在加载通话记录列表...</p>';
    if (resultCountDiv) resultCountDiv.style.display = 'none';
    const role = sessionStorage.getItem("role");
    const sales_id = sessionStorage.getItem("sales_id");
    let queryParams = [];
    if (currentCommunicationGeneralSearch) queryParams.push(`query=${encodeURIComponent(currentCommunicationGeneralSearch)}`);
    if (currentCommClientIdSearch) queryParams.push(`client_id=${encodeURIComponent(currentCommClientIdSearch)}`);
    if (currentCommContactIdSearch) queryParams.push(`contact_id=${encodeURIComponent(currentCommContactIdSearch)}`);
    if (currentCommSalesIdSearch) queryParams.push(`sales_id=${encodeURIComponent(currentCommSalesIdSearch)}`);
    if (currentCommDurationSearch) queryParams.push(`duration=${encodeURIComponent(currentCommDurationSearch)}`);
    if (currentCommContentSearch) queryParams.push(`content=${encodeURIComponent(currentCommContentSearch)}`);
    if (currentCommunicationSortParams.length > 0) { queryParams.push(`sort=${encodeURIComponent(currentCommunicationSortParams.join(','))}`); }
    if (role === 'sales' && sales_id && sales_id !== '0' && sales_id !== '-1') {
        queryParams.push(`filter_sales_id=${encodeURIComponent(sales_id)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    fetch(`/api/fetch_communications${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            generateCommunicationTable(data.output, data.count);
            const hasSearchTerms = currentCommunicationGeneralSearch || currentCommClientIdSearch || currentCommContactIdSearch || currentCommSalesIdSearch || currentCommDurationSearch || currentCommContentSearch;
            if (clearBtn) clearBtn.style.display = hasSearchTerms ? 'inline-block' : 'none';
        })
        .catch(error => {
            contentDiv.innerHTML = `<table><tbody><tr><td colspan="9">获取通话记录列表失败: ${error.message || error}</td></tr></tbody></table>`;
            showCustomAlert(`获取通话记录列表失败: ${error.message || error}`, 'error');
            if (resultCountDiv) resultCountDiv.style.display = 'none';
        });
}

function generateCommunicationTable(output, totalCount) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const container = document.getElementById('communication-list-content');
    const role = sessionStorage.getItem("role");
    const isManager = (role === 'manager');
    const resultCountDiv = document.getElementById('communication-search-result-count');
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
        container.innerHTML = '<div class="table-responsive"><table class="data-table"><tbody><tr><td colspan="9">没有找到通话记录数据</td></tr></tbody></table></div>';
        return;
    }
    const displayHeaders = ['ID', '客户ID', '联络人ID', '业务员ID', '日期', '时间', '时长(分)', '内容摘要', '操作'];
    let tableHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>';
    displayHeaders.forEach((headerText, displayIndex) => {
        const sortKey = communicationIndexToSortKey[displayIndex];
        const actionColumnIndex = displayHeaders.length - 1;
        if (displayIndex !== actionColumnIndex && sortKey !== undefined) {
            const currentSort = currentCommunicationSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = 'sortable';
            let indicator = '<span class="sort-indicator"></span>';
            if (currentSort) {
                sortClass += currentSort > 0 ? ' sort-asc' : ' sort-desc';
                indicator = currentSort > 0 ? ' <span class="sort-indicator">▲</span>' : ' <span class="sort-indicator">▼</span>';
            }
            tableHTML += `<th data-sort-key="${sortKey}" onclick="handleCommunicationSortClick(event)" class="${sortClass}">${headerText}${indicator}</th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';
    lines.forEach(line => {
        const fields = line.split('\x1C');
        if (fields.length < 12) return;
        const commId = fields[0];
        const fullDataEscaped = escape(line);
        tableHTML += `<tr data-id="${commId}" data-full-comm-string="${fullDataEscaped}">`;
        tableHTML += `<td>${fields[0] || '-'}</td>`;
        tableHTML += `<td>${fields[1] || '-'}</td>`;
        tableHTML += `<td>${fields[2] || '-'}</td>`;
        tableHTML += `<td>${fields[3] || '-'}</td>`;
        tableHTML += `<td>${fields[4] || '?'}-${fields[5] || '?'}-${fields[6] || '?'}</td>`;
        tableHTML += `<td>${fields[7] || '?'}:${fields[8] || '?'}:${fields[9] || '?'}</td>`;
        tableHTML += `<td>${fields[10] || '-'}</td>`;
        const content = fields[11] || '';
        const contentSummary = content.length > 30 ? content.substring(0, 30) + '...' : content;
        tableHTML += `<td title="${escape(content)}">${contentSummary}</td>`;
        tableHTML += `<td class="action-cell" style="white-space: nowrap;"></td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    const tableRows = container.querySelectorAll('.data-table tbody tr');
    tableRows.forEach(row => {
        const commId = row.dataset.id;
        const actionCell = row.querySelector('.action-cell');
        if (commId && actionCell) {
            let buttonsHTML = '';
            buttonsHTML += `<button class="view-btn icon-btn" onclick="viewCommunicationDetails('${commId}')" title="查看详情">
                                <span class="material-icons-outlined">visibility</span>
                             </button>`;
            if (role === 'sales') {
                buttonsHTML += ` <button class="edit-btn icon-btn" onclick="editCommunicationSetup('${commId}')" title="编辑">
                                     <span class="material-icons-outlined">edit</span>
                                   </button>`;
            }
            actionCell.innerHTML = buttonsHTML;
        }
    });
    updateHoverTargets();
}

function handleCommunicationSortClick(event) {
    const header = event.currentTarget;
    const sortKey = parseInt(header.dataset.sortKey, 10);
    if (isNaN(sortKey)) return;
    const existingIndex = currentCommunicationSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) {
        currentCommunicationSortParams = [sortKey];
    } else {
        const currentValue = currentCommunicationSortParams[existingIndex];
        if (currentValue > 0) {
            currentCommunicationSortParams[existingIndex] = -sortKey;
        } else {
            currentCommunicationSortParams.splice(existingIndex, 1);
        }
    }
    fetchCommunicationData();
}

function handleCommunicationSearchInputKey(event) {
    if (event.key === 'Enter') {
        performCommunicationSearch();
    }
}

function performCommunicationSearch() {
    currentCommunicationGeneralSearch = document.getElementById('communicationSearchInput').value.trim();
    currentCommClientIdSearch = document.getElementById('commClientIdSearchInput').value.trim();
    currentCommContactIdSearch = document.getElementById('commContactIdSearchInput').value.trim();
    currentCommSalesIdSearch = document.getElementById('commSalesIdSearchInput').value.trim();
    currentCommDurationSearch = document.getElementById('commDurationSearchInput').value.trim();
    currentCommContentSearch = document.getElementById('commContentSearchInput').value.trim();
    fetchCommunicationData();
}

function clearCommunicationSearch() {
    const inputs = [
        'communicationSearchInput', 'commClientIdSearchInput', 'commContactIdSearchInput',
        'commSalesIdSearchInput', 'commDurationSearchInput', 'commContentSearchInput'
    ];
    inputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) inputElement.value = '';
    });
    currentCommunicationGeneralSearch = '';
    currentCommClientIdSearch = '';
    currentCommContactIdSearch = '';
    currentCommSalesIdSearch = '';
    currentCommDurationSearch = '';
    currentCommContentSearch = '';
    const detailedArea = document.getElementById('detailed-comm-search-area');
    const toggleBtn = document.getElementById('toggleDetailedCommSearchBtn');
    if (detailedArea) detailedArea.classList.remove('show');
    if (toggleBtn) toggleBtn.classList.remove('active');
    fetchCommunicationData();
    const clearBtn = document.getElementById('communicationClearSearchButton');
    if (clearBtn) clearBtn.style.display = 'none';
}

function resetAndPrepareCommunicationAddForm() {
    setCommunicationFormReadOnly(false);
    const form = document.getElementById('communication-form');
    form.reset();
    document.getElementById('editing-communication-id').value = '';
    document.getElementById('communication-form-title').textContent = '添加新通话记录';
    document.getElementById('selected-client-id').value = '';
    document.getElementById('selected-contact-id').value = '';
    const clientSelectorContainer = document.getElementById('communication-client-contact-selector');
    clientSelectorContainer.innerHTML = '<p>正在加载客户列表...</p>';
    loadClientsForCommunicationSelector();
    const role = sessionStorage.getItem("role");
    const salesSelectionContainer = document.getElementById('communication-sales-selection').parentNode;
    if (role === 'sales') {
        if (salesSelectionContainer) salesSelectionContainer.style.display = 'none';
    } else if (role === 'manager') {
        if (salesSelectionContainer) salesSelectionContainer.style.display = '';
        loadSalespersonsForCommunicationForm();
    } else {
        if (salesSelectionContainer) salesSelectionContainer.style.display = 'none';
        console.error("Unknown role, cannot prepare communication form correctly.");
    }
    document.getElementById('communication-submit-btn').textContent = '提交通话记录';
    document.getElementById('communication-submit-btn').onclick = submitCommunication;
    document.getElementById('communication-submit-btn').style.display = 'inline-block';
    document.getElementById('communication-cancel-btn').style.display = 'none';
    const returnBtn = document.getElementById('communication-return-btn');
    if (returnBtn) returnBtn.remove();
    document.getElementById('add-communication-view').classList.remove('form-view-mode');
    const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
    if (tempHiddenContact) tempHiddenContact.remove();
    setAppLockedState(false);
    updateHoverTargets();
}

function loadClientsForCommunicationSelector(selectedClientId = null, selectedContactId = null) {
    const container = document.getElementById('communication-client-contact-selector');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            container.innerHTML = '';
            const clientList = data.output || "";
            if (!clientList) {
                container.innerHTML = '<p>未能加载客户列表或没有客户</p>';
                return;
            }
            const clients = clientList.split('\x1C');
            clients.forEach(clientStr => {
                const parts = clientStr.split('\x1D');
                if (parts.length === 2) {
                    const clientId = parts[0].trim();
                    const clientName = parts[1].trim();
                    if (clientId && clientName) {
                        const card = document.createElement('div');
                        card.className = 'client-selector-card hover-target';
                        card.dataset.clientId = clientId;
                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'client-name';
                        nameSpan.textContent = clientName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display';
                        idSpan.textContent = `(ID: ${clientId})`;
                        card.appendChild(nameSpan);
                        card.appendChild(idSpan);
                        const contactPanel = document.createElement('div');
                        contactPanel.className = 'contact-selection-panel';
                        contactPanel.id = `contact-panel-for-${clientId}`;
                        card.appendChild(contactPanel);
                        container.appendChild(card);
                        card.addEventListener('click', () => handleClientCardClick(card, clientId));
                        if (selectedClientId && clientId === selectedClientId) {
                            setTimeout(() => {
                                card.click();
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
    const formView = document.getElementById('add-communication-view');
    if (formView.classList.contains('form-view-mode') || clickedCard.classList.contains('disabled')) {
        return;
    }
    const wasExpanded = clickedCard.classList.contains('expanded');
    const container = document.getElementById('communication-client-contact-selector');
    container.querySelectorAll('.client-selector-card.expanded').forEach(card => {
        if (card !== clickedCard) {
            card.classList.remove('expanded');
            const panel = card.querySelector('.contact-selection-panel');
            if (panel) panel.innerHTML = '';
        }
    });
    if (wasExpanded) {
        clickedCard.classList.remove('expanded');
        const panel = clickedCard.querySelector('.contact-selection-panel');
        if (panel) panel.innerHTML = '';
        document.getElementById('selected-client-id').value = '';
        document.getElementById('selected-contact-id').value = '';
    } else {
        clickedCard.classList.add('expanded');
        document.getElementById('selected-client-id').value = clientId;
        document.getElementById('selected-contact-id').value = '';
        const panel = clickedCard.querySelector('.contact-selection-panel');
        const editingCommId = document.getElementById('editing-communication-id').value;
        const hiddenEditContactId = document.getElementById('hidden-edit-contact-id')?.value;
        let preselectedContactId = null;
        if (editingCommId && hiddenEditContactId && document.getElementById('selected-client-id').value === clientId) {
            preselectedContactId = hiddenEditContactId;
        }
        if (panel) {
            loadContactsForClient(clientId, panel, preselectedContactId);
        }
    }
    updateHoverTargets();
}

function setCommunicationFormReadOnly(isReadOnly) {
    const form = document.getElementById('communication-form');
    const formView = document.getElementById('add-communication-view');
    if (isReadOnly) formView.classList.add('form-view-mode');
    else formView.classList.remove('form-view-mode');
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => el.disabled = isReadOnly);
    form.querySelectorAll('.client-selector-card').forEach(card => {
        if (isReadOnly) card.classList.add('disabled');
        else card.classList.remove('disabled');
    });
    form.querySelectorAll('.contact-radio-group input[type="radio"]').forEach(radio => {
        radio.disabled = isReadOnly;
    });
    form.querySelectorAll('.contact-radio-group label').forEach(label => {
        if (isReadOnly) label.classList.add('disabled');
        else label.classList.remove('disabled');
    });
    form.querySelectorAll('#communication-sales-selection input[type="checkbox"]')
        .forEach(checkbox => {
            checkbox.disabled = isReadOnly;
        });
    form.querySelectorAll('#communication-sales-selection label.neumorphic-checkbox-card')
        .forEach(label => {
            if (isReadOnly) label.classList.add('disabled');
            else label.classList.remove('disabled');
        });
    form.querySelectorAll('.add-btn, .remove-btn').forEach(btn => btn.disabled = isReadOnly);
    updateHoverTargets();
}

function loadClientsForCommunicationForm(selectedClientId = null) {
    const container = document.getElementById('communication-client-selection');
    container.innerHTML = '<p>正在加载客户列表...</p>';
    fetch('/api/display_client_ids_names')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            container.innerHTML = '';
            const clientList = data.output || "";
            if (!clientList) {
                container.innerHTML = '<p>未能加载客户列表或没有客户</p>';
                return;
            }
            const clients = clientList.split('\x1C');
            clients.forEach(clientStr => {
                const parts = clientStr.split('\x1D');
                if (parts.length === 2) {
                    const clientId = parts[0].trim();
                    const clientName = parts[1].trim();
                    if (clientId && clientName) {
                        const checkboxId = `comm-client-${clientId}`;
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = checkboxId;
                        checkbox.name = 'comm_selected_client';
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
                        checkbox.addEventListener('change', function () {
                            const currentCardLabel = document.querySelector(`label[for="${this.id}"]`);
                            if (this.checked) {
                                container.querySelectorAll('input[type="checkbox"]').forEach(otherCheckbox => {
                                    if (otherCheckbox !== this) {
                                        otherCheckbox.checked = false;
                                        const otherLabel = document.querySelector(`label[for="${otherCheckbox.id}"]`);
                                        if (otherLabel) otherLabel.classList.remove('selected');
                                    }
                                });
                                if (currentCardLabel) currentCardLabel.classList.add('selected');
                                loadContactsForClient(this.value);
                            } else {
                                if (currentCardLabel) currentCardLabel.classList.remove('selected');
                                clearContactSelection();
                            }
                        });
                    }
                }
            });
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

function loadContactsForClient(clientId, panelElement, selectedContactId = null) {
    if (!panelElement) return;
    panelElement.innerHTML = '<p style="text-align:center; margin: 10px 0;">加载中...</p>';
    fetch(`/api/clients/${clientId}/contacts`)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status} - ${response.statusText}`))
        .then(data => {
            if (data.error) throw new Error(data.error);
            panelElement.innerHTML = '';
            const contactList = data.output || "";
            const contacts = contactList.split('\x1C')
                .map(contactStr => {
                    const parts = contactStr.split('\x1D');
                    if (parts.length === 2) {
                        const id = parts[0].trim();
                        const name = parts[1].trim();
                        if (id && !isNaN(parseInt(id)) && name) {
                            return { id: id, name: name };
                        }
                    }
                    return null;
                })
                .filter(contact => contact !== null);
            if (contacts.length === 0) {
                panelElement.innerHTML = '<p style="text-align:center; color:#888; margin: 10px 0;">无联络人</p>';
                document.getElementById('selected-contact-id').value = '';
                return;
            }
            const radioGroup = document.createElement('div');
            radioGroup.className = 'contact-radio-group';
            radioGroup.addEventListener('click', function (event) {
                event.stopPropagation();
            });
            contacts.forEach(contact => {
                const radioId = `comm-contact-${clientId}-${contact.id}`;
                const label = document.createElement('label');
                label.htmlFor = radioId;
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.id = radioId;
                radio.name = `comm_selected_contact_for_${clientId}`;
                radio.value = contact.id;
                radio.checked = (selectedContactId && contact.id === selectedContactId);
                const customRadio = document.createElement('span');
                customRadio.className = 'radio-custom';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = contact.name;
                label.appendChild(radio);
                label.appendChild(customRadio);
                label.appendChild(nameSpan);
                radioGroup.appendChild(label);
                if (radio.checked) {
                    document.getElementById('selected-contact-id').value = contact.id;
                    label.classList.add('selected');
                }
                radio.addEventListener('change', function () {
                    if (this.checked) {
                        document.getElementById('selected-contact-id').value = this.value;
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
            updateHoverTargets();
        })
        .catch(error => {
            panelElement.innerHTML = `<p style="color: red; text-align:center; margin: 10px 0;">加载联络人失败</p>`;
            document.getElementById('selected-contact-id').value = '';
            showCustomAlert(`加载客户 ${clientId} 的联络人失败: ${error.message || error}`, 'error');
        });
}

function clearContactSelection() {
    const wrapper = document.getElementById('communication-contact-selection-wrapper');
    const container = document.getElementById('communication-contact-selection');
    container.innerHTML = '<p>请先选择客户以加载联络人</p>';
    wrapper.style.display = 'none';
}

function loadSalespersonsForCommunicationForm(selectedSalesId = null) {
    const container = document.getElementById('communication-sales-selection');
    container.innerHTML = '<p>正在加载业务员列表...</p>';
    fetch('/api/fetch_sales_ids_names')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            }
            container.innerHTML = '';
            const salesList = data.output || "";
            if (!salesList) {
                container.innerHTML = '<p>未能加载业务员列表或没有业务员</p>';
                return;
            }
            const salespersons = salesList.split('\x1C');
            salespersons.forEach(salesStr => {
                const parts = salesStr.split('\x1D');
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
                        nameSpan.className = 'client-name';
                        nameSpan.textContent = salesName;
                        const idSpan = document.createElement('span');
                        idSpan.className = 'client-id-display';
                        idSpan.textContent = `(ID: ${salesId})`;
                        label.appendChild(checkbox);
                        label.appendChild(nameSpan);
                        label.appendChild(idSpan);
                        container.appendChild(label);
                        checkbox.addEventListener('change', function () {
                            const currentCardLabel = document.querySelector(`label[for="${this.id}"]`);
                            if (this.checked) {
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

function submitCommunication() {
    const form = document.getElementById('communication-form');
    const clientId = document.getElementById('selected-client-id').value;
    const contactId = document.getElementById('selected-contact-id').value;
    const role = sessionStorage.getItem("role");
    const loggedInSalesId = sessionStorage.getItem("sales_id");
    let selectedSalesId = null;
    const year = form.elements['year'].value.trim();
    const month = form.elements['month'].value.trim();
    const day = form.elements['day'].value.trim();
    const hour = form.elements['hour'].value.trim();
    const minute = form.elements['minute'].value.trim();
    const second = form.elements['second'].value.trim();
    const duration = form.elements['duration'].value.trim();
    const content = form.elements['content'].value.trim();
    if (!clientId) {
        showCustomAlert('请选择一个客户', 'warning');
        document.getElementById('communication-client-contact-selector').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!contactId) {
        showCustomAlert('请为选定的客户选择一个联络人', 'warning');
        const expandedCard = document.querySelector('.client-selector-card.expanded');
        if (expandedCard) {
            expandedCard.querySelector('.contact-selection-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            document.getElementById('communication-client-contact-selector').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    if (role === 'sales') {
        selectedSalesId = loggedInSalesId;
        if (!selectedSalesId || selectedSalesId === '0' || selectedSalesId === '-1') {
            showCustomAlert('无法获取当前业务员信息，无法添加记录', 'error');
            return;
        }
    } else if (role === 'manager') {
        const salesSelectionContainer = document.getElementById('communication-sales-selection');
        const selectedSalesCheckbox = salesSelectionContainer.querySelector('input[name="comm_selected_sales"]:checked');
        if (!selectedSalesCheckbox) {
            showCustomAlert('请选择一个业务员', 'warning');
            salesSelectionContainer.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        selectedSalesId = selectedSalesCheckbox.value;
    } else {
        showCustomAlert('未知用户角色，无法添加记录', 'error');
        return;
    }
    if (!year || !month || !day || !hour || !minute || !second || !duration || !content) {
        showCustomAlert('请填写所有通话信息字段', 'warning');
        return;
    }
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) ||
        isNaN(parseInt(hour)) || isNaN(parseInt(minute)) || isNaN(parseInt(second)) ||
        isNaN(parseInt(duration))) {
        showCustomAlert('日期、时间和时长必须是有效的数字', 'warning');
        return;
    }
    const commData = {
        id: '0',
        client_id: clientId,
        contact_id: contactId,
        sales_id: selectedSalesId,
        year: year || '0', month: month || '0', day: day || '0',
        hour: hour || '0', minute: minute || '0', second: second || '0',
        duration: duration || '0',
        content: content
    };
    const finalCommString = [
        commData.id, commData.client_id, commData.contact_id, commData.sales_id,
        commData.year, commData.month, commData.day, commData.hour, commData.minute, commData.second,
        commData.duration, commData.content
    ].join('\x1C');
    console.log("Submitting new communication:", finalCommString);
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
            resetAndPrepareCommunicationAddForm();
            showView('communication-list-view', 'communication-section');
        })
        .catch(error => {
            showCustomAlert('添加通话记录失败: ' + (error.message || '未知错误'), 'error');
        });
}

function editCommunicationSetup(commId) {
    const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
    if (!row || !row.dataset.fullCommString) {
        showCustomAlert("无法加载通话记录数据", 'error');
        return;
    }
    const fullCommString = unescape(row.dataset.fullCommString);
    setAppLockedState(true)
    const fields = fullCommString.split('\x1C');
    if (fields.length < 12) {
        showCustomAlert("通话记录数据格式不完整", 'error');
        setAppLockedState(false);
        return;
    }
    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };
    const form = document.getElementById('communication-form');
    form.reset();
    document.getElementById('editing-communication-id').value = commData.id;
    document.getElementById('communication-form-title').textContent = '编辑通话记录';
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;
    let hiddenContactInput = document.getElementById('hidden-edit-contact-id');
    if (!hiddenContactInput) {
        hiddenContactInput = document.createElement('input');
        hiddenContactInput.type = 'hidden';
        hiddenContactInput.id = 'hidden-edit-contact-id';
        form.appendChild(hiddenContactInput);
    }
    hiddenContactInput.value = commData.contact_id;
    loadClientsForCommunicationSelector(commData.client_id, commData.contact_id);
    const role = sessionStorage.getItem("role");
    const salesSelectorDiv = document.getElementById('communication-sales-selection').parentNode;
    if (role === 'manager') {
        if (salesSelectorDiv) salesSelectorDiv.style.display = '';
        loadSalespersonsForCommunicationForm(commData.sales_id);
    } else if (role === 'sales') {
        if (salesSelectorDiv) salesSelectorDiv.style.display = 'none';
    } else {
        if (salesSelectorDiv) salesSelectorDiv.style.display = 'none';
    }
    const submitBtn = document.getElementById('communication-submit-btn');
    submitBtn.textContent = '更新通话记录';
    submitBtn.onclick = submitCommunicationUpdate;
    submitBtn.style.display = 'inline-block';

    const cancelBtn = document.getElementById('communication-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelCommunicationUpdate;
    showView('add-communication-view', 'communication-section');
    setCommunicationFormReadOnly(false);
    window.scrollTo(0, 0);
}

function populateCommunicationForm(commId, fullCommString) {
    setCommunicationFormReadOnly(false);
    const form = document.getElementById('communication-form');
    form.reset();
    document.getElementById('editing-communication-id').value = commId;
    const fields = fullCommString.split('\x1C');
    if (fields.length < 12) {
        showCustomAlert("通话记录数据格式不完整", 'error');
        setAppLockedState(false);
        return;
    }
    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;
    loadClientsForCommunicationForm(commData.client_id);
    form.elements['contact_id'] = { value: commData.contact_id };
    loadSalespersonsForCommunicationForm(commData.sales_id);
    updateHoverTargets();
}

function submitCommunicationUpdate() {
    const form = document.getElementById('communication-form');
    const commId = document.getElementById('editing-communication-id').value;
    const clientId = document.getElementById('selected-client-id').value;
    const contactId = document.getElementById('selected-contact-id').value;
    const role = sessionStorage.getItem("role");
    let selectedSalesId = null;
    const year = form.elements['year'].value.trim();
    const month = form.elements['month'].value.trim();
    const day = form.elements['day'].value.trim();
    const hour = form.elements['hour'].value.trim();
    const minute = form.elements['minute'].value.trim();
    const second = form.elements['second'].value.trim();
    const duration = form.elements['duration'].value.trim();
    const content = form.elements['content'].value.trim();
    if (!clientId || !contactId) {
        showCustomAlert('请确保客户和联络人都已选择', 'warning');
        return;
    }
    if (role === 'manager') {
        const salesSelectionContainer = document.getElementById('communication-sales-selection');
        const selectedSalesCheckbox = salesSelectionContainer.querySelector('input[name="comm_selected_sales"]:checked');
        if (!selectedSalesCheckbox) {
            showCustomAlert('请选择一个业务员', 'warning');
            salesSelectionContainer.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        selectedSalesId = selectedSalesCheckbox.value;
    } else if (role === 'sales') {
        const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
        if (row && row.dataset.fullCommString) {
            const originalFields = unescape(row.dataset.fullCommString).split('\x1C');
            if (originalFields.length >= 4) {
                selectedSalesId = originalFields[3];
            }
        }
        if (!selectedSalesId) {
            selectedSalesId = sessionStorage.getItem("sales_id");
        }
        if (!selectedSalesId || selectedSalesId === '0' || selectedSalesId === '-1') {
            showCustomAlert('无法确定关联的业务员信息', 'error');
            return;
        }
    } else {
        showCustomAlert('未知用户角色，无法更新记录', 'error');
        return;
    }
    if (!year || !month || !day || !hour || !minute || !second || !duration || !content) {
        showCustomAlert('请填写完整所有信息', 'error');
        return;
    }
    const finalCommString = [
        commId,
        clientId,
        contactId,
        selectedSalesId,
        year,
        month,
        day,
        hour,
        minute,
        second,
        duration,
        content
    ].join('\x1C');
    fetch('/api/update_communication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationData: finalCommString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showCustomAlert(data.error, 'error');
            } else {
                showCustomAlert(data.output, 'success');
                setAppLockedState(false);
                resetAndPrepareCommunicationAddForm();
                showView('communication-list-view', 'communication-section');
            }
        })
        .catch(error => {
            showCustomAlert('更新通话记录失败: ' + (error.message || '未知错误'), 'error');
            setAppLockedState(false);
        });
    const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
    if (tempHiddenContact) tempHiddenContact.remove();
}

function cancelCommunicationUpdate() {
    showCustomConfirm(
        "未保存的更改将会丢失",
        "确定要取消编辑吗？",
        () => {
            setAppLockedState(false);
            resetAndPrepareCommunicationAddForm();
            showView('communication-list-view', 'communication-section');
            const tempHiddenContact = document.getElementById('hidden-edit-contact-id');
            if (tempHiddenContact) tempHiddenContact.remove();
        }
    );
}

function viewCommunicationDetails(commId) {
    const row = document.querySelector(`#communication-list-content tr[data-id="${commId}"]`);
    if (!row) { showCustomAlert("无法加载通话记录数据", 'error'); return; }
    const fullCommString = unescape(row.dataset.fullCommString);
    if (!fullCommString) { showCustomAlert("无法加载详细数据", 'error'); return; }
    setAppLockedState(true);
    const fields = fullCommString.split('\x1C');
    if (fields.length < 12) {
        showCustomAlert("通话记录数据格式不完整", 'error');
        setAppLockedState(false); return;
    }
    const commData = {
        id: fields[0], client_id: fields[1], contact_id: fields[2], sales_id: fields[3],
        year: fields[4], month: fields[5], day: fields[6], hour: fields[7], minute: fields[8], second: fields[9],
        duration: fields[10], content: fields[11]
    };
    const form = document.getElementById('communication-form');
    form.reset();
    document.getElementById('editing-communication-id').value = commData.id;
    document.getElementById('selected-client-id').value = '';
    document.getElementById('selected-contact-id').value = '';
    const clientSelectorContainer = document.getElementById('communication-client-contact-selector');
    clientSelectorContainer.innerHTML = '<p>加载中...</p>';
    const salesSelectionContainer = document.getElementById('communication-sales-selection');
    salesSelectionContainer.innerHTML = '<p>加载中...</p>';
    form.elements['year'].value = commData.year;
    form.elements['month'].value = commData.month;
    form.elements['day'].value = commData.day;
    form.elements['hour'].value = commData.hour;
    form.elements['minute'].value = commData.minute;
    form.elements['second'].value = commData.second;
    form.elements['duration'].value = commData.duration;
    form.elements['content'].value = commData.content;
    let hiddenContactInput = document.getElementById('hidden-edit-contact-id');
    if (!hiddenContactInput) {
        hiddenContactInput = document.createElement('input');
        hiddenContactInput.type = 'hidden';
        hiddenContactInput.id = 'hidden-edit-contact-id';
        form.appendChild(hiddenContactInput);
    }
    hiddenContactInput.value = commData.contact_id;
    loadClientsForCommunicationSelector(commData.client_id, commData.contact_id);
    const role = sessionStorage.getItem("role");
    const salesSelectorDiv = document.getElementById('communication-sales-selection').parentNode;
    if (role === 'manager' && salesSelectorDiv) {
        salesSelectorDiv.style.display = '';
        loadSalespersonsForCommunicationForm(commData.sales_id);
    } else if (salesSelectorDiv) {
        salesSelectorDiv.style.display = 'none';
    }
    showView('add-communication-view', 'communication-section');
    setTimeout(() => {
        setCommunicationFormReadOnly(true);
        document.getElementById('communication-form-title').textContent = '通话记录详细信息';
        document.getElementById('communication-submit-btn').style.display = 'none';
        document.getElementById('communication-cancel-btn').style.display = 'none';
        const formActions = document.querySelector('#add-communication-view .form-actions');
        let returnBtn = document.getElementById('communication-return-btn');
        if (!returnBtn) {
            returnBtn = document.createElement('button');
            returnBtn.id = 'communication-return-btn';
            returnBtn.type = 'button';
            returnBtn.className = 'section-btn cancel-btn hover-target';
            returnBtn.textContent = '返回列表';
            returnBtn.style.marginLeft = '15px';
            returnBtn.onclick = () => {
                setAppLockedState(false);
                resetAndPrepareCommunicationAddForm();
                const tempHidden = document.getElementById('hidden-edit-contact-id');
                if (tempHidden) tempHidden.remove();
                showView('communication-list-view', 'communication-section');
            };
            formActions.appendChild(returnBtn);
            o(returnBtn);
        }
        applyActionPermissions();
        const tempHidden = document.getElementById('hidden-edit-contact-id');
    }, 300);
    window.scrollTo(0, 0);
}

async function fetchSalesIdsAndNames() {
    try {
        const response = await fetch('/api/fetch_sales');
        const data = await response.json();
        if (data.error) {
            showCustomAlert(data.error, 'error');
        }
        const salesListOutput = data.output || "";
        if (!salesListOutput) return [];
        const sales = salesListOutput.split('\n')
            .map(line => {
                const fields = line.split('\x1C');
                if (fields.length >= 2) return { id: fields[0], name: fields[1] };
                const parts = line.split('\x1D');
                if (parts.length === 2) return { id: parts[0], name: parts[1] };
                return null;
            })
            .filter(s => s !== null);
        return sales;
    } catch (error) {
        showCustomAlert(`获取业务员列表时出错: ${error.message}`, 'error');
        return [];
    }
}