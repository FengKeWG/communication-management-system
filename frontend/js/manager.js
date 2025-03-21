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
            document.getElementById('user-add-result').textContent = data.output; // Corrected ID
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('user-add-result').textContent = '添加用户失败'; // Corrected ID
        });
}

function showAddClient() {
    document.getElementById('add-user').classList.remove('active');
    document.getElementById('user-list').classList.remove('active');
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-list').classList.remove('active');
}

function showClientList() {
    document.getElementById('add-client').classList.remove('active');
    document.getElementById('client-list').classList.add('active');
    document.getElementById('add-user').classList.remove('active');
    document.getElementById('user-list').classList.remove('active');

    fetch('/api/list_clients')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('client-list-content').innerHTML = '<tr><td colspan="9">获取客户列表失败</td></tr>'; // 修正
                console.error('Error:', data.error);
            } else {
                // 解析数据并生成表格
                generateClientTable(data.output); // 确保传递 data.output
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('client-list-content').innerHTML = '<tr><td colspan="9">获取客户列表失败</td></tr>'; // 修正
        });
}

// 生成客户列表表格的函数
function generateClientTable(output) {
    console.log("Received output:", output);
    const lines = output.trim().split('\n');
    if (lines.length === 1 && lines[0] === "") {
        document.getElementById('client-list-content').innerHTML = '<tr><td colspan="10">没有客户数据</td></tr>'; // colspan 增加到 10
        return;
    }
    let tableHTML = '<table><thead><tr><th>ID</th><th>姓名</th><th>地区</th><th>地址</th><th>法人代表</th><th>规模</th><th>联系等级</th><th>邮箱</th><th>电话</th><th>操作</th></tr></thead><tbody>'; // 添加 "操作" 列
    lines.forEach(line => {
        const fields = line.split(',');
        if (fields.length < 9) {
            console.warn("Skipping line due to insufficient fields:", line);
            return; // 跳过字段不足的行
        }
        tableHTML += `<tr data-id="${fields[0]}">`; // 将 data-id 移动到 tr
        // 前8个字段
        for (let i = 0; i < 8; i++) {
            tableHTML += `<td>${fields[i]}</td>`;
        }
        // 电话号码
        const phones = fields[8].split(';');
        let phoneHTML = '';
        phones.forEach(phone => {
            phoneHTML += `${phone.trim()}<br>`;
        });
        // 修改这里，添加 data-phones 属性存储原始电话号码字符串
        tableHTML += `<td data-phones="${fields[8]}">${phoneHTML}</td>`;
        // 操作按钮 (添加 data-id 属性)
        tableHTML += `<td>
            <button class="edit-btn">编辑</button>
            <button class="delete-btn">删除</button>
        </td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    document.getElementById('client-list-content').innerHTML = tableHTML;
    // 添加事件监听器（在表格生成后）
    addTableButtonListeners();
}

function addTableButtonListeners() {
    // 编辑按钮
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const clientId = this.closest('tr').dataset.id; //改动
            editClient(clientId);
        });
    });
    // 删除按钮
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const clientId = this.closest('tr').dataset.id;//改动
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
    // newInput.required = true; //  根据需要决定是否为必填

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

    // Add this to show the remove button when there is more than one phone input
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
    // Remove all phone inputs except the first one
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }

    // Reset the first phone input
    container.querySelector('.phone-input').value = '';

    // Hide remove button
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

    // 1. 创建一个保存按钮（只创建一次）
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.classList.add('save-btn');
    saveButton.onclick = function () { saveClient(clientId); };

    // 2. 遍历单元格，创建 input 元素，并添加唯一标识
    for (let i = 1; i < row.cells.length - 1; i++) { // -1 排除操作列
        const cell = row.cells[i];
        const text = cell.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;
        // 添加唯一标识 (例如，使用 data-column 属性)
        input.dataset.column = i; // 存储列索引
        cell.innerHTML = ''; // 清空单元格内容
        cell.appendChild(input);
    }

    // 3. 特殊处理电话号码单元格
    const phoneCell = row.cells[8]; // 电话号码在第9列（索引8）
    // 从 data-phones 属性获取电话号码字符串
    const phoneString = phoneCell.dataset.phones;
    console.log("Phone String from data-phones:", phoneString); // 打印 data-phones 中的电话号码字符串
    const phones = phoneString.split(';'); // 使用 data-phones 中的字符串分割
    phoneCell.innerHTML = ''; // 清空
    phones.forEach(phone => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = phone.trim();
        input.dataset.column = 'phones'; // 特殊标识
        phoneCell.appendChild(input);
        phoneCell.appendChild(document.createElement('br'));
    });

    // 4. 替换编辑按钮为保存按钮
    const actionsCell = row.cells[row.cells.length - 1];
    const editButton = actionsCell.querySelector('.edit-btn');
    if (editButton) {
        actionsCell.replaceChild(saveButton, editButton); // 使用 replaceChild
    }
}


function saveClient(clientId) {
    console.log("Save client with ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row) {
        console.error("Row not found for client ID:", clientId);
        return;
    }

    // 使用 data-column 属性获取输入框的值
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
    // ... 其余的 fetch 请求代码 ...
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
                alert('更新客户信息失败：' + data.error); // 显示错误消息
            } else {
                alert('客户信息已更新！'); // 显示成功消息
                showClientList();  // 重新加载列表
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('更新客户信息失败：' + error); // 显示错误消息
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
                    // 删除成功，重新加载客户列表
                    showClientList();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("删除失败" + error);
            });
    }
}