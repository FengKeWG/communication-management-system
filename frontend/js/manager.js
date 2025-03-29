function showAddUser() {
    document.getElementById('add-user').classList.add('active');
    document.getElementById('add-client').classList.remove('active');
    document.getElementById('client-list').classList.remove('active');
    document.getElementById('user-list').classList.remove('active');
}

function showUserList() {
    document.getElementById('user-list').classList.add('active');
    document.getElementById('add-client').classList.remove('active');
    document.getElementById('client-list').classList.remove('active');
    document.getElementById('add-user').classList.remove('active');
}

function submitUser() {
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const role = document.querySelector('select[name="role"]').value;
    const data = { username, password, role };
    fetch('/api/add_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('user-add-result').textContent = data.output;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('user-add-result').textContent = '添加用户失败';
        });
}

function showAddClient() {
    document.getElementById('add-user').classList.remove('active');
    document.getElementById('user-list').classList.remove('active');
    document.getElementById('client-list').classList.remove('active');
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-form').reset();
    resetClientPhoneInputs();
    resetContactsContainer();
    document.getElementById('client-add-result').textContent = '';
}

let currentSortParams = [];
let currentSearchTerm = '';

const indexToSortKey = {
    0: 1,
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10
};

function fetchClientData() {
    const contentDiv = document.getElementById('client-list-content');
    const clearBtn = document.getElementById('clearSearchButton');
    let queryParams = [];
    if (currentSearchTerm) {
        queryParams.push(`query=${encodeURIComponent(currentSearchTerm)}`);
    }
    if (currentSortParams.length > 0) {
        queryParams.push(`sort=${encodeURIComponent(currentSortParams.join(','))}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    fetch(`/api/fetch_clients${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                contentDiv.innerHTML = `<table><tbody><tr><td colspan="11">获取客户列表失败: ${data.error}</td></tr></tbody></table>`;
                console.error('Error:', data.error);
            } else {
                generateClientTable(data.output);
                clearBtn.style.display = currentSearchTerm ? 'inline-block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            contentDiv.innerHTML = '<table><tbody><tr><td colspan="11">获取客户列表时发生错误</td></tr></tbody></table>';
        });
}

function showClientList() {
    document.getElementById('add-client').classList.remove('active');
    document.getElementById('client-list').classList.add('active');
    document.getElementById('add-user').classList.remove('active');
    document.getElementById('user-list').classList.remove('active');
    fetchClientData();
}

function handleSortClick(event) {
    const header = event.currentTarget;
    const columnIndex = parseInt(header.dataset.sortIndex, 10);
    if (indexToSortKey[columnIndex] === undefined) {
        return;
    }
    const sortKey = indexToSortKey[columnIndex];
    const existingIndex = currentSortParams.findIndex(p => Math.abs(p) === sortKey);
    if (existingIndex === -1) {
        currentSortParams.push(sortKey);
    } else {
        const currentValue = currentSortParams[existingIndex];
        if (currentValue > 0) {
            currentSortParams[existingIndex] = -sortKey;
        } else {
            currentSortParams.splice(existingIndex, 1);
        }
    }
    fetchClientData();
}

function generateClientTable(output) {
    const lines = output.trim().split('\n');
    const container = document.getElementById('client-list-content');
    if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
        container.innerHTML = '<table><tbody><tr><td colspan="11">没有客户数据</td></tr></tbody></table>';
        return;
    }

    const headers = ['ID', '姓名', '地区', '地址', '法人', '规模', '等级', '邮箱', '客户电话', '联络员', '操作'];
    let tableHTML = '<table><thead><tr>';
    headers.forEach((headerText, index) => {
        const sortKey = indexToSortKey[index];
        if (sortKey !== undefined) {
            const currentSort = currentSortParams.find(p => Math.abs(p) === sortKey);
            let sortClass = '';
            let indicator = '';
            if (currentSort) {
                sortClass = currentSort > 0 ? 'sort-asc' : 'sort-desc';
                indicator = currentSort > 0 ? ' ▲' : ' ▼';
            }
            tableHTML += `<th data-sort-index="${index}" onclick="handleSortClick(event)" class="${sortClass}">${headerText}<span class="sort-indicator">${indicator}</span></th>`;
        } else {
            tableHTML += `<th>${headerText}</th>`;
        }
    });
    tableHTML += '</tr></thead><tbody>';

    lines.forEach(line => {
        const fields = line.split(',');

        if (fields.length < 9) {
            console.warn("因主字段不足跳过此行:", line);
            return;
        }
        const clientId = fields[0];
        const clientPhonesStr = fields[8] || '';
        const contactsStr = fields.slice(9).join(',');
        const fullData = line;

        tableHTML += `<tr data-id="${clientId}" data-full-client-string="${escape(fullData)}">`;

        for (let i = 0; i < 8; i++) {
            tableHTML += `<td>${fields[i] || ''}</td>`;
        }

        const clientPhones = clientPhonesStr.split(';').filter(p => p.trim() !== '');
        tableHTML += `<td>${clientPhones.join('<br>') || '-'}</td>`;

        const contacts = contactsStr.split(';').filter(c => c.trim() !== '');
        let contactsDisplay = '';
        if (contacts.length > 0) {
            const firstContactFields = contacts[0].split('.');
            const firstContactName = firstContactFields[0] || 'N/A';
            contactsDisplay = `${firstContactName} (共 ${contacts.length} 人)`;
            tableHTML += `<td data-contacts="${escape(contactsStr)}">${contactsDisplay}</td>`;
        } else {
            tableHTML += `<td>-</td>`;
        }

        tableHTML += `<td>
            <button class="edit-btn" onclick="editClient('${clientId}')">编辑</button>
            <button class="delete-btn" onclick="deleteClient('${clientId}')">删除</button>
        </td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

function addTableButtonListeners() {

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const clientId = this.closest('tr').dataset.id;
            editClient(clientId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const clientId = this.closest('tr').dataset.id;
            deleteClient(clientId);
        });
    });
}

function addClientPhoneInput() {
    const container = document.getElementById('client-phone-inputs-container');
    const phoneInputContainer = document.createElement('div');
    phoneInputContainer.className = 'phone-input-container';

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'client_phones';
    newInput.className = 'section-input phone-input';
    newInput.placeholder = '请输入客户电话号码';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-phone-btn';
    removeButton.textContent = '-';
    removeButton.onclick = function () { removePhoneInput(this); };

    phoneInputContainer.appendChild(newInput);
    phoneInputContainer.appendChild(removeButton);
    container.appendChild(phoneInputContainer);

    updateRemoveButtonsVisibility(container);
}

function removePhoneInput(button) {
    const container = button.closest('.phone-input-container').parentNode;
    if (container.children.length > 1) {
        button.closest('.phone-input-container').remove();
        updateRemoveButtonsVisibility(container);
    } else {
        container.querySelector('.phone-input').value = '';
    }
}

function updateRemoveButtonsVisibility(container) {
    const removeButtons = container.querySelectorAll('.remove-phone-btn');
    const display = container.children.length > 1 ? 'inline-block' : 'none';
    removeButtons.forEach(btn => btn.style.display = display);
}

function resetClientPhoneInputs() {
    const container = document.getElementById('client-phone-inputs-container');
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    const firstInput = container.querySelector('.phone-input');
    if (firstInput) firstInput.value = '';
    updateRemoveButtonsVisibility(container);
}

function addContactGroup() {
    const container = document.getElementById('contacts-container');
    const contactGroup = document.createElement('div');
    contactGroup.className = 'contact-group';

    contactGroup.innerHTML = `
        <button type="button" class="remove-contact-btn" onclick="removeContactGroup(this)">X</button>
        <h4>新联络员</h4>
        <div>
            <label class="section-label">姓名:</label>
            <input type="text" name="contact_name" class="section-input contact-name" required>
        </div>
        <div>
            <label class="section-label">性别:</label>
            <input type="text" name="contact_gender" class="section-input contact-gender" placeholder="男 / 女 / 未知" required>
        </div>
        <div>
            <label class="section-label">生日 (年-月-日):</label>
            <input type="number" name="contact_birth_year" class="section-input contact-birth-year" placeholder="年"> -
            <input type="number" name="contact_birth_month" class="section-input contact-birth-month" placeholder="月"> -
            <input type="number" name="contact_birth_day" class="section-input contact-birth-day" placeholder="日">
        </div>
        <div>
            <label class="section-label">邮箱:</label>
            <input type="email" name="contact_email" class="section-input contact-email">
        </div>
        <div>
            <label class="section-label">电话:</label>
            <div class="contact-phones-container"> <!-- 使用 class -->
                <div class="contact-phone-input-container">
                    <input type="text" name="contact_phones" class="section-input contact-phone-input" placeholder="联络员电话">
                    <button type="button" class="remove-contact-phone-btn" style="display: none;" onclick="removeContactPhoneInput(this)">-</button>
                </div>
            </div>
            <button type="button" class="add-contact-phone-btn" onclick="addContactPhoneInput(this)">+</button>
        </div>
    `;
    container.appendChild(contactGroup);
}

function removeContactGroup(button) {
    button.closest('.contact-group').remove();
}

function resetContactsContainer() {
    document.getElementById('contacts-container').innerHTML = '';
}

function addContactPhoneInput(button) {

    const container = button.previousElementSibling;
    if (!container || !container.classList.contains('contact-phones-container')) {
        console.error("无法找到联络员电话容器");
        return;
    }
    const inputContainer = document.createElement('div');
    inputContainer.className = 'contact-phone-input-container';

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'contact_phones';
    newInput.className = 'section-input contact-phone-input';
    newInput.placeholder = '联络员电话';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-contact-phone-btn';
    removeButton.textContent = '-';
    removeButton.onclick = function () { removeContactPhoneInput(this); };

    inputContainer.appendChild(newInput);
    inputContainer.appendChild(removeButton);
    container.appendChild(inputContainer);
    updateContactRemoveButtonsVisibility(container);
}

function removeContactPhoneInput(button) {
    const container = button.closest('.contact-phone-input-container').parentNode;
    if (container.children.length > 1) {
        button.closest('.contact-phone-input-container').remove();
        updateContactRemoveButtonsVisibility(container);
    } else {
        container.querySelector('.contact-phone-input').value = '';
    }
}

function updateContactRemoveButtonsVisibility(container) {
    const removeButtons = container.querySelectorAll('.remove-contact-phone-btn');
    const display = container.children.length > 1 ? 'inline-block' : 'none';
    removeButtons.forEach(btn => btn.style.display = display);
}

function submitClient() {
    const form = document.getElementById('client-form');
    const resultDiv = document.getElementById('client-add-result');
    resultDiv.textContent = '提交中...';
    resultDiv.style.color = 'inherit';

    const clientData = {
        id: '0',
        name: form.elements['name'].value.trim(),
        region: form.elements['region'].value.trim(),
        address: form.elements['address'].value.trim(),
        legal_person: form.elements['legal_person'].value.trim(),
        size: form.elements['size'].value.trim() || '0',
        contact_level: form.elements['contact_level'].value.trim() || '0',
        email: form.elements['email'].value.trim()
    };

    let clientPhones = [];
    const clientPhoneInputs = document.querySelectorAll('#client-phone-inputs-container .phone-input');
    clientPhoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) {
            clientPhones.push(phone);
        }
    });
    const clientPhonesStr = clientPhones.join(';');


    let contactsArray = [];
    const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
    contactGroups.forEach(group => {
        const name = group.querySelector('.contact-name').value.trim();
        const gender = group.querySelector('.contact-gender').value.trim() || '未知';
        const year = group.querySelector('.contact-birth-year').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day').value.trim() || '0';
        const email = group.querySelector('.contact-email').value.trim();

        let contactPhones = [];

        const contactPhoneInputs = group.querySelectorAll('.contact-phone-input');
        contactPhoneInputs.forEach(input => {
            const phone = input.value.trim();
            if (phone) {
                contactPhones.push(phone);
            }
        });
        const contactPhonesStr = contactPhones.join('~');

        if (name) {
            const contactString = `${name}.${gender}.${year}.${month}.${day}.${email}.${contactPhonesStr}`;
            contactsArray.push(contactString);
        } else {
            console.warn("跳过一个没有名字的联络员输入组。");
        }
    });
    const contactsStr = contactsArray.join(';');

    const finalClientString = [
        clientData.id, clientData.name, clientData.region, clientData.address,
        clientData.legal_person, clientData.size, clientData.contact_level,
        clientData.email, clientPhonesStr, contactsStr
    ].join(',');

    console.log("最终提交(添加)的字符串:", finalClientString);

    fetch('/api/add_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: finalClientString })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || `请求失败，状态码: ${response.status}`);
                }).catch(() => {
                    throw new Error(`请求失败，状态码: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Backend reported error:', data.error);
                resultDiv.textContent = '添加客户失败: ' + data.error;
                resultDiv.style.color = 'red';
            } else {
                resultDiv.textContent = data.output || '添加成功！';
                resultDiv.style.color = 'green';
                form.reset();
                resetClientPhoneInputs();
                resetContactsContainer();
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            resultDiv.textContent = '添加客户时发生错误: ' + error.message;
            resultDiv.style.color = 'red';
        });
}


function resetPhoneInputs() {
    const container = document.getElementById('phone-inputs-container');
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    container.querySelector('.phone-input').value = '';
    const removeBtn = container.querySelector('.remove-phone-btn');
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }
}

function editClient(clientId) {
    console.log("开始编辑 Client ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row || row.classList.contains('editing')) {
        console.warn("行不存在或已在编辑模式:", clientId);
        return;
    }
    row.classList.add('editing');

    const fullClientString = unescape(row.dataset.fullClientString);
    if (!fullClientString) {
        console.error("无法获取客户数据字符串:", clientId);
        alert("无法加载编辑数据。");
        row.classList.remove('editing');
        return;
    }

    const fields = fullClientString.split(',');
    const clientPhonesStr = fields[8] || '';
    const contactsStr = fields.slice(9).join(',') || '';

    for (let i = 1; i <= 7; i++) {
        const cell = row.cells[i];
        const currentValue = fields[i];
        cell.innerHTML = `<input type="text" class="section-input" value="${currentValue || ''}" data-field-index="${i}">`;
    }

    const clientPhoneCell = row.cells[8];
    clientPhoneCell.innerHTML = '';
    const clientPhones = clientPhonesStr.split(';').filter(p => p);
    if (clientPhones.length === 0) {
        clientPhoneCell.innerHTML = `<div class="phone-input-container">
                                        <input type="text" class="section-input phone-input client-phone-edit" placeholder="客户电话">
                                        <button type="button" class="remove-phone-btn" style="display:none;" onclick="removeEditPhoneInput(this)">-</button>
                                    </div>`;
    } else {
        clientPhones.forEach((phone, index) => {
            const displayRemove = clientPhones.length > 1 ? 'inline-block' : 'none';
            clientPhoneCell.innerHTML += `<div class="phone-input-container">
                                            <input type="text" class="section-input phone-input client-phone-edit" value="${phone}">
                                            <button type="button" class="remove-phone-btn" style="display:${displayRemove};" onclick="removeEditPhoneInput(this)">-</button>
                                         </div>`;
        });
    }

    clientPhoneCell.innerHTML += `<button type="button" class="add-phone-btn" onclick="addEditClientPhoneInput(this)">+</button>`;

    const contactsCell = row.cells[9];
    contactsCell.innerHTML = '';
    const contacts = contactsStr.split(';').filter(c => c);
    if (contacts.length > 0) {
        contacts.forEach((contactStr, contactIndex) => {
            contactsCell.appendChild(createContactEditGroup(contactStr, contactIndex));
        });
    }

    contactsCell.innerHTML += `<button type="button" class="add-contact-btn" onclick="addEditContactGroup(this)">+ 添加联络员</button>`;

    const actionsCell = row.cells[10];
    actionsCell.innerHTML = `
        <button class="save-btn" onclick="saveClient('${clientId}')">保存</button>
        <button class="cancel-btn retro-btn" onclick="cancelEdit('${clientId}')">取消</button>
    `;
}

function cancelEdit(clientId) {

    showClientList();
}

function createContactEditGroup(contactString, index) {
    const contactFields = contactString.split('.');
    const name = contactFields[0] || '';
    const gender = contactFields[1] || '未知';
    const year = contactFields[2] || '';
    const month = contactFields[3] || '';
    const day = contactFields[4] || '';
    const email = contactFields[5] || '';
    const contactPhonesStr = contactFields.slice(6).join('.') || '';
    const contactPhones = contactPhonesStr.split('~').filter(p => p);

    const group = document.createElement('div');
    group.className = 'contact-group contact-edit-group';
    group.dataset.contactIndex = index;

    let phonesHTML = '';
    if (contactPhones.length === 0) {
        phonesHTML = `<div class="contact-phone-input-container">
                        <input type="text" class="section-input contact-phone-input contact-phone-edit" placeholder="联络员电话">
                        <button type="button" class="remove-contact-phone-btn" style="display:none;" onclick="removeEditPhoneInput(this)">-</button>
                    </div>`;
    } else {
        contactPhones.forEach(phone => {
            const displayRemove = contactPhones.length > 1 ? 'inline-block' : 'none';
            phonesHTML += `<div class="contact-phone-input-container">
                            <input type="text" class="section-input contact-phone-input contact-phone-edit" value="${phone}">
                            <button type="button" class="remove-contact-phone-btn" style="display:${displayRemove};" onclick="removeEditPhoneInput(this)">-</button>
                        </div>`;
        });
    }

    group.innerHTML = `
        <button type="button" class="remove-contact-btn" onclick="removeEditContactGroup(this)">X</button>
        <h4>联络员</h4>
        <input type="text" class="section-input contact-name-edit" value="${name}" placeholder="姓名">
        <input type="text" class="section-input contact-gender-edit" value="${gender}" placeholder="性别">
        <input type="number" class="section-input contact-birth-year-edit" value="${year}" placeholder="年">
        <input type="number" class="section-input contact-birth-month-edit" value="${month}" placeholder="月">
        <input type="number" class="section-input contact-birth-day-edit" value="${day}" placeholder="日">
        <input type="email" class="section-input contact-email-edit" value="${email}" placeholder="邮箱">
        <label class="section-label">电话:</label>
        <div class="contact-phones-container-edit">${phonesHTML}</div>
        <button type="button" class="add-contact-phone-btn" onclick="addEditContactPhoneInput(this)">+</button>
    `;
    return group;
}

function addEditClientPhoneInput(button) {
    const container = button.previousElementSibling;
    const displayRemove = true;
    const newPhoneHTML = `<div class="phone-input-container">
                            <input type="text" class="section-input phone-input client-phone-edit" placeholder="客户电话">
                            <button type="button" class="remove-phone-btn" style="display:inline-block;" onclick="removeEditPhoneInput(this)">-</button>
                         </div>`;
    container.insertAdjacentHTML('beforeend', newPhoneHTML);
    updateEditRemoveButtonsVisibility(container);
}

function addEditContactPhoneInput(button) {
    const container = button.previousElementSibling;
    const displayRemove = true;
    const newPhoneHTML = `<div class="contact-phone-input-container">
                            <input type="text" class="section-input contact-phone-input contact-phone-edit" placeholder="联络员电话">
                            <button type="button" class="remove-contact-phone-btn" style="display:inline-block;" onclick="removeEditPhoneInput(this)">-</button>
                         </div>`;
    container.insertAdjacentHTML('beforeend', newPhoneHTML);
    updateEditRemoveButtonsVisibility(container);
}

function removeEditPhoneInput(button) {
    const container = button.closest('.phone-input-container, .contact-phone-input-container').parentNode;
    const group = button.closest('.phone-input-container, .contact-phone-input-container');
    if (container.children.length > 1) {
        group.remove();
        updateEditRemoveButtonsVisibility(container);
    } else {
        const input = group.querySelector('input');
        if (input) input.value = '';
    }
}

function addEditContactGroup(button) {
    const container = button.previousElementSibling;
    const newIndex = container.querySelectorAll('.contact-edit-group').length;
    const newGroup = createContactEditGroup('', newIndex);
    container.appendChild(newGroup);
}

function saveClient(clientId) {
    console.log("保存 Client ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row || !row.classList.contains('editing')) {
        console.error("行不存在或不在编辑模式:", clientId);
        return;
    }

    const clientData = {
        id: clientId,
        name: row.querySelector('[data-field-index="1"]').value.trim(),
        region: row.querySelector('[data-field-index="2"]').value.trim(),
        address: row.querySelector('[data-field-index="3"]').value.trim(),
        legal_person: row.querySelector('[data-field-index="4"]').value.trim(),
        size: row.querySelector('[data-field-index="5"]').value.trim() || '0',
        contact_level: row.querySelector('[data-field-index="6"]').value.trim() || '0',
        email: row.querySelector('[data-field-index="7"]').value.trim()
    };

    const clientPhones = Array.from(row.querySelectorAll('.client-phone-edit'))
        .map(input => input.value.trim())
        .filter(p => p);
    const clientPhonesStr = clientPhones.join(';');

    let contactsArray = [];
    const contactEditGroups = row.querySelectorAll('.contact-edit-group');
    contactEditGroups.forEach(group => {
        const name = group.querySelector('.contact-name-edit').value.trim();
        const gender = group.querySelector('.contact-gender-edit').value.trim() || '未知';
        const year = group.querySelector('.contact-birth-year-edit').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month-edit').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day-edit').value.trim() || '0';
        const email = group.querySelector('.contact-email-edit').value.trim();

        const contactPhones = Array.from(group.querySelectorAll('.contact-phone-edit'))
            .map(input => input.value.trim())
            .filter(p => p);
        const contactPhonesStr = contactPhones.join('~');

        const contactString = `${name}.${gender}.${year}.${month}.${day}.${email}.${contactPhonesStr}`;
        contactsArray.push(contactString);
    });
    const contactsStr = contactsArray.join(';');

    const finalClientString = [
        clientData.id, clientData.name, clientData.region, clientData.address,
        clientData.legal_person, clientData.size, clientData.contact_level,
        clientData.email, clientPhonesStr, contactsStr
    ].join(',');

    console.log("最终更新的字符串:", finalClientString);

    fetch(`/api/update_client`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: finalClientString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error updating client:', data.error);
                alert('更新客户信息失败：' + data.error);

                cancelEdit(clientId);
            } else {
                alert('客户信息已更新！');
                showClientList();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('更新客户信息时发生网络错误');
            cancelEdit(clientId);
        });
}

function deleteClient(clientId) {
    if (confirm(`确定要删除 ID 为 ${clientId} 的客户吗？`)) {
        fetch(`/api/delete_client/${clientId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error deleting client:', data.error);
                    alert('删除客户失败：' + data.error);
                } else {
                    showClientList();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("删除客户时发生网络错误");
            });
    }
}

function handleSearchInputKey(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

function performSearch() {
    currentSearchTerm = document.getElementById('searchInput').value.trim();
    fetchClientData();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    currentSearchTerm = '';
    fetchClientData();
}