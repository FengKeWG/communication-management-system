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
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-list').classList.remove('active');
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
    8: 9
};

function fetchClientData() {
    const contentDiv = document.getElementById('client-list-content');
    const clearBtn = document.getElementById('clearSearchButton');

    let queryParams = []; // 用于收集URL查询参数

    // 如果有搜索词，添加到参数列表
    if (currentSearchTerm) {
        queryParams.push(`query=${encodeURIComponent(currentSearchTerm)}`);
    }

    // 如果有排序参数，添加到参数列表
    if (currentSortParams.length > 0) {
        queryParams.push(`sort=${encodeURIComponent(currentSortParams.join(','))}`);
    }

    // 组合查询字符串
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    fetch(`/api/fetch_clients${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                contentDiv.innerHTML = `<table><tbody><tr><td colspan="10">获取客户列表失败: ${data.error}</td></tr></tbody></table>`;
                console.error('Error:', data.error);
            } else {
                generateClientTable(data.output); // 使用获取到的数据生成表格
                // 根据是否存在搜索词，决定是否显示“清除搜索”按钮
                clearBtn.style.display = currentSearchTerm ? 'inline-block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            contentDiv.innerHTML = '<table><tbody><tr><td colspan="10">获取客户列表时发生错误</td></tr></tbody></table>';
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
    if (lines.length === 1 && lines[0] === "") {

        container.innerHTML = '<table><tbody><tr><td colspan="10">没有客户数据</td></tr></tbody></table>';
        return;
    }
    const headers = ['ID', '姓名', '地区', '地址', '法人代表', '规模', '联系等级', '邮箱', '电话', '操作'];
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
            console.warn("因字段不足跳过此行:", line);
            return;
        }
        tableHTML += `<tr data-id="${fields[0]}">`;
        for (let i = 0; i < 8; i++) {
            tableHTML += `<td>${fields[i] || ''}</td>`;
        }
        const phones = (fields[8] || '').split(';').filter(p => p.trim() !== '');
        let phoneHTML = phones.join('<br>');
        tableHTML += `<td data-phones="${fields[8] || ''}">${phoneHTML}</td>`;
        tableHTML += `<td>
            <button class="edit-btn">编辑</button>
            <button class="delete-btn">删除</button>
        </td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
    addTableButtonListeners();
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


function addPhoneInput() {
    const container = document.getElementById('phone-inputs-container');
    const phoneInputContainer = document.createElement('div');
    phoneInputContainer.className = 'phone-input-container';

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'phones';
    newInput.className = 'section-input phone-input';
    newInput.placeholder = '请输入电话号码';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-phone-btn';
    removeButton.textContent = '-';
    removeButton.onclick = function () {
        container.removeChild(phoneInputContainer);
    };

    phoneInputContainer.appendChild(newInput);
    phoneInputContainer.appendChild(removeButton);
    container.appendChild(phoneInputContainer);

    if (container.children.length > 1) {
        for (let i = 0; i < container.children.length; i++) {
            container.children[i].querySelector('.remove-phone-btn').style.display = 'inline-block';
        }
    }
}

function submitClient() {
    const form = document.getElementById('client-form');
    const formData = new FormData(form);
    const data = {};

    let phoneNumbers = [];
    const phoneInputs = document.querySelectorAll('.phone-input');
    phoneInputs.forEach(input => {
        if (input.value.trim() !== "") {
            phoneNumbers.push(input.value.trim());
        }
    });

    data['phones'] = phoneNumbers.join(';');

    for (const [key, value] of formData.entries()) {
        if (key !== 'phones') {
            data[key] = value;
        }
    }

    fetch('/api/add_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('client-add-result').textContent = data.output;
            form.reset();
            resetPhoneInputs();

        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('client-add-result').textContent = '添加客户失败';
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
    console.log("Edit client with ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row) {
        console.error("Row not found for client ID:", clientId);
        return;
    }

    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.classList.add('save-btn');
    saveButton.onclick = function () { saveClient(clientId); };

    for (let i = 1; i < row.cells.length - 1; i++) {
        const cell = row.cells[i];
        const text = cell.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;
        input.dataset.column = i;
        cell.innerHTML = '';
        cell.appendChild(input);
    }

    const phoneCell = row.cells[8];
    const phoneString = phoneCell.dataset.phones;
    console.log("Phone String from data-phones:", phoneString);
    const phones = phoneString.split(';');
    phoneCell.innerHTML = '';
    phones.forEach(phone => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = phone.trim();
        input.dataset.column = 'phones';
        phoneCell.appendChild(input);
        phoneCell.appendChild(document.createElement('br'));
    });

    const actionsCell = row.cells[row.cells.length - 1];
    const editButton = actionsCell.querySelector('.edit-btn');
    if (editButton) {
        actionsCell.replaceChild(saveButton, editButton);
    }
}

function saveClient(clientId) {
    console.log("Save client with ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row) {
        console.error("Row not found for client ID:", clientId);
        return;
    }
    const name = row.querySelector('[data-column="1"]').value;
    const region = row.querySelector('[data-column="2"]').value;
    const address = row.querySelector('[data-column="3"]').value;
    const legal_person = row.querySelector('[data-column="4"]').value;
    const size = parseInt(row.querySelector('[data-column="5"]').value || 0, 10);
    const contact_level = parseInt(row.querySelector('[data-column="6"]').value || 0, 10);
    const email = row.querySelector('[data-column="7"]').value;
    const phoneInputs = Array.from(row.querySelectorAll('[data-column="phones"]'));
    const phones = phoneInputs.map(input => input.value.trim()).filter(p => p !== "").join(';');
    const updatedData = { name, region, address, legal_person, size, contact_level, email, phones };
    console.log(updatedData);
    fetch(`/api/update_client/${clientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error updating client:', data.error);
                alert('更新客户信息失败：' + data.error);
            } else {
                alert('客户信息已更新！');
                showClientList();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('更新客户信息失败：' + error);
        });
}


function deleteClient(clientId) {
    if (confirm(`确定要删除 ID 为 ${clientId} 的客户吗？`)) {
        fetch(`/api/delete_client/${clientId}`, {
            method: 'DELETE',
        })
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
                alert("删除失败" + error);
            });
    }
}

function handleSearchInputKey(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

function performSearch() {
    currentSearchTerm = document.getElementById('searchInput').value.trim(); // 更新搜索词状态
    fetchClientData(); // 调用统一获取函数
}


function clearSearch() {
    document.getElementById('searchInput').value = '';
    currentSearchTerm = ''; // 清除搜索词状态
    fetchClientData(); // 刷新数据
}