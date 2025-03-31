// ================================================================
// ================== 全局变量和辅助函数============================
// ================================================================

function n(t) {
    const e = document.getElementById("cursor2");
    const i = document.getElementById("cursor3");
    if (e) e.classList.add("hover");
    if (i) i.classList.add("hover");
}

function s(t) {
    const e = document.getElementById("cursor2");
    const i = document.getElementById("cursor3");
    if (e) e.classList.remove("hover");
    if (i) i.classList.remove("hover");
}

function o(t) {
    t.addEventListener("mouseover", n);
    t.addEventListener("mouseout", s);
}

(function ($) {
    document.getElementsByTagName("body")[0].addEventListener("mousemove", function (event) {
        const t = document.getElementById("cursor");
        const e = document.getElementById("cursor2");
        const i = document.getElementById("cursor3");
        if (t) { t.style.left = event.clientX + "px"; t.style.top = event.clientY + "px"; }
        if (e) { e.style.left = event.clientX + "px"; e.style.top = event.clientY + "px"; }
        if (i) { i.style.left = event.clientX + "px"; i.style.top = event.clientY + "px"; }
    });
    s();
    var app = function () {
        var body = undefined;
        var menu = undefined;
        var menuItems = undefined;
        var init = function init() {
            body = document.querySelector('body');
            menu = document.querySelector('.menu-icon');
            menuItems = document.querySelectorAll('.nav__list-item');
            applyListeners();
        };
        var applyListeners = function applyListeners() {
            menu.addEventListener('click', function () {
                return toggleClass(body, 'nav-active');
            });
        };
        var toggleClass = function toggleClass(element, stringClass) {
            if (element.classList.contains(stringClass)) element.classList.remove(stringClass); else element.classList.add(stringClass);
        };
        init();
    }();
})(jQuery);

function showMainSection(sectionIdToShow) {
    const container = document.querySelector('.content-container'); // 父容器
    if (!container) return;

    // 找到当前活动的 section
    const currentActiveSection = container.querySelector('.main-section.active');
    // 找到要显示的 section
    const sectionToShow = document.getElementById(sectionIdToShow);

    if (currentActiveSection && currentActiveSection !== sectionToShow) {
        currentActiveSection.classList.remove('active'); // 移除 active，触发离开动画
        // 如果需要更复杂的离场动画，可以在这里添加 .is-exiting 类并在 transitionend 后移除
    }

    if (sectionToShow && !sectionToShow.classList.contains('active')) {
        sectionToShow.classList.add('active'); // 添加 active，触发进入动画

        // 默认显示该 section 下的 active 或第一个二级导航视图
        const defaultViewButton = sectionToShow.querySelector('.secondary-nav-btn.active') || sectionToShow.querySelector('.secondary-nav-btn');
        if (defaultViewButton && !document.body.classList.contains('is-editing')) { // 编辑状态不自动切换
            // 延迟点击，给 section 切换一点时间
            setTimeout(() => {
                // 确保按钮仍然存在且未被禁用
                const btn = document.getElementById(sectionToShow.id)?.querySelector(`.secondary-nav-btn[onclick*="${defaultViewButton.getAttribute('onclick').match(/showView\('([^']+)'/)[1]}"]`);
                if (btn && !btn.classList.contains('disabled')) {
                    btn.click();
                }
            }, 50); // 50ms 延迟，可以根据动画效果调整
        } else if (sectionIdToShow === 'client-section' && !document.body.classList.contains('is-editing')) {
            // 如果没有默认按钮，且是客户管理，则默认显示列表
            setTimeout(() => showView('client-list-view', 'client-section'), 50);
        } else if (sectionIdToShow === 'user-section' && !document.body.classList.contains('is-editing')) {
            // 如果是用户管理，默认显示列表
            setTimeout(() => showView('user-list-view', 'user-section'), 50);
        }
    }

    // 更新导航菜单的激活状态 (如果需要)
    document.querySelectorAll('.nav__list-item').forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('onclick')?.includes(sectionIdToShow)) {
            item.classList.add('active-nav');
        } else {
            item.classList.remove('active-nav');
        }
    });


    updateHoverTargets();
}

function showView(viewIdToShow, parentSectionId) {
    const parentSection = document.getElementById(parentSectionId);
    if (!parentSection) return;

    // 更新二级导航按钮状态
    parentSection.querySelectorAll('.secondary-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        // 如果处于编辑状态，禁用切换按钮
        if (document.body.classList.contains('is-editing')) {
            btn.classList.add('disabled');
        } else {
            btn.classList.remove('disabled'); // 确保非编辑状态解除禁用
        }
    });
    const clickedButton = parentSection.querySelector(`.secondary-nav-btn[onclick*="${viewIdToShow}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
        if (document.body.classList.contains('is-editing')) {
            clickedButton.classList.add('disabled'); // 编辑状态下，当前按钮也禁用
        }
    }

    const currentActiveView = parentSection.querySelector('.content-view.active');
    const viewToShow = document.getElementById(viewIdToShow);

    // 处理视图切换动画
    if (currentActiveView && currentActiveView !== viewToShow) {
        currentActiveView.classList.remove('active'); // 移除 active，触发离开动画
    }

    if (viewToShow && !viewToShow.classList.contains('active')) {
        viewToShow.classList.add('active'); // 添加 active，触发进入动画

        // --- 在视图变为 active *之后* 执行特定逻辑 ---
        // 使用 setTimeout 确保动画开始后再执行数据加载或表单重置
        setTimeout(() => {
            if (viewIdToShow === 'client-list-view') {
                fetchClientData(); // 加载客户列表
                // 确保退出编辑模式（如果之前在编辑）
                if (document.body.classList.contains('is-editing') || document.getElementById('add-client-view').classList.contains('form-view-mode')) {
                    setEditingState(false); // 取消编辑锁定
                    setFormReadOnly(false); // 取消只读
                    resetAndPrepareAddForm(); // 重置表单
                    const viewBackBtn = document.getElementById('client-view-back-btn');
                    if (viewBackBtn) viewBackBtn.style.display = 'none'; // 隐藏返回按钮
                }
            } else if (viewIdToShow === 'user-list-view') {
                console.log("需要实现 fetchUserData() 来加载用户列表");
                document.getElementById('user-list-content').innerHTML = '<p>用户列表加载功能待实现。</p>';
                if (document.body.classList.contains('is-editing')) {
                    setEditingState(false); // 确保退出编辑模式
                }
            } else if (viewIdToShow === 'add-client-view') {
                if (!document.body.classList.contains('is-editing') && !viewToShow.classList.contains('form-view-mode')) {
                    setFormReadOnly(false);
                    resetAndPrepareAddForm();
                }
            } else if (viewIdToShow === 'add-user-view') {
                document.getElementById('user-form').reset();
                document.getElementById('user-add-result').textContent = '';
                if (document.body.classList.contains('is-editing')) {
                    setEditingState(false);
                }
            }
        }, 50);
    } else if (viewToShow && viewIdToShow === 'client-list-view') {
        fetchClientData();
    }


    updateHoverTargets();
}

function updateHoverTargets() {
    document.querySelectorAll('.hover-target').forEach(el => {
        o(el);
    });
}

function resetAndPrepareAddForm() {
    setFormReadOnly(false);

    const form = document.getElementById('client-form');
    form.reset();
    document.getElementById('editing-client-id').value = '';
    document.getElementById('client-form-title').textContent = '添加新客户';
    resetClientPhoneInputs();
    resetContactsContainer();
    document.getElementById('client-add-result').textContent = '';

    const submitBtn = document.getElementById('client-submit-btn');
    submitBtn.textContent = '提交客户信息';
    submitBtn.onclick = submitClient;
    submitBtn.style.display = 'inline-block';

    document.getElementById('client-cancel-btn').style.display = 'none';

    const viewBackBtn = document.getElementById('client-view-back-btn');
    if (viewBackBtn) {
        viewBackBtn.style.display = 'none';
    }
}

// ================================================================
// ==================== 客户列表相关 ===============================
// ================================================================

let currentSortParams = [];
let currentSearchTerm = '';
const indexToSortKey = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10 };

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
            if (index === headers.length - 1) {
                tableHTML += `<th>${headerText}</th>`;
            } else {
                tableHTML += `<th>${headerText}</th>`;
            }
        }
    });
    tableHTML += '</tr></thead><tbody>';
    lines.forEach(line => {
        const fields = line.split(';');
        if (fields.length < 1) {
            console.warn("数据行字段不足，跳过:", line);
            return;
        }
        const clientId = fields[0];
        if (!clientId) {
            console.warn("无效的客户ID，跳过:", line);
            return;
        }

        const clientPhonesStr = fields[8] || '';
        const contactsStr = fields.slice(9).join(';') || '';

        const fullDataEscaped = escape(line);
        tableHTML += `<tr data-id="${clientId}" data-full-client-string="${fullDataEscaped}">`;

        for (let i = 0; i < 10; i++) {
            if (i === 8) {
                const clientPhones = (fields[i] || '').split(',').filter(p => p.trim() !== '');
                tableHTML += `<td>${clientPhones.join('<br>') || '-'}</td>`;
            } else if (i === 9) {
                const contacts = (fields.slice(i).join(';') || '').split(',').filter(c => c.trim() !== '');
                let contactsDisplay = '';
                if (contacts.length > 0) {
                    const contactNames = contacts.map(contact => {
                        const contactFields = contact.split('=');
                        return contactFields[0] || 'N/A';
                    });
                    contactsDisplay = contactNames.join('<br>');
                } else {
                    contactsDisplay = '-';
                }
                tableHTML += `<td class="contacts-cell">${contactsDisplay}</td>`;
                break;
            } else {
                tableHTML += `<td>${fields[i] || ''}</td>`;
            }
        }
        const fieldCount = fields.length > 9 ? 10 : (fields[8] ? 9 : 8);
        for (let i = fieldCount; i < 10; i++) {
            tableHTML += '<td>-</td>';
        }

        tableHTML += `<td style="white-space: nowrap;"> <!-- 防止按钮换行 -->
            <button class="view-btn" onclick="viewClientDetails('${clientId}')" title="查看详情">
                <span class="material-icons-outlined">visibility</span>
            </button>
            <button class="edit-btn" onclick="editClientSetup('${clientId}')" title="编辑">
                <span class="material-icons-outlined">edit</span>
            </button>
            <button class="delete-btn" onclick="deleteClient('${clientId}')" title="删除">
                <span class="material-icons-outlined">delete</span>
            </button>
        </td>`;
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
    updateHoverTargets();
}

// ================================================================
// =============== 添加/编辑表单的动态输入 =======================
// ================================================================

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
    removeButton.onclick = function () { removePhoneInput(this); };
    removeButton.style.display = 'inline-flex';

    phoneInputContainer.appendChild(newInput);
    phoneInputContainer.appendChild(removeButton);
    container.appendChild(phoneInputContainer);

    updateRemoveButtonsVisibility(container);
    updateHoverTargets();
}

function removePhoneInput(button) {
    const container = button.closest('.input-group-dynamic').parentNode;
    button.closest('.input-group-dynamic').remove();
    updateRemoveButtonsVisibility(container);
}

function updateRemoveButtonsVisibility(container) {
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
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
    if (!firstGroup) {
        addClientPhoneInput();
    }
}

function addContactGroup() {
    const container = document.getElementById('contacts-container');
    const contactGroup = document.createElement('div');
    contactGroup.className = 'contact-group card';

    contactGroup.innerHTML = `
        <button type="button" class="remove-contact-btn remove-btn icon-btn" onclick="removeContactGroup(this)">
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
                <input type="text" name="contact_gender" class="section-input input contact-gender" placeholder="男 / 女 / 未知" required>
            </div>
            <div class="form-group form-group-full"> <!-- 生日占一行 -->
                <label class="section-label">生日 (年-月-日):</label>
                <div class="birthdate-inputs">
                    <input type="number" name="contact_birth_year" class="section-input input contact-birth-year" placeholder="年"> -
                    <input type="number" name="contact_birth_month" class="section-input input contact-birth-month" placeholder="月"> -
                    <input type="number" name="contact_birth_day" class="section-input input contact-birth-day" placeholder="日">
                </div>
            </div>
            <div class="form-group form-group-full"> <!-- 邮箱占一行 -->
                <label class="section-label">邮箱:</label>
                <input type="email" name="contact_email" class="section-input input contact-email">
            </div>
            <div class="form-group form-group-full"> <!-- 电话部分占一行 -->
                <label class="section-label">电话:</label>
                <div class="contact-phones-container dynamic-input-list">
                    <div class="contact-phone-input-container input-group-dynamic">
                        <input type="text" name="contact_phones" class="section-input input contact-phone-input" placeholder="联络员电话">
                        <button type="button" class="remove-btn icon-btn remove-contact-phone-btn" style="display: none;" onclick="removeContactPhoneInput(this)">
                            <span class="material-icons-outlined">remove</span>
                        </button>
                    </div>
                </div>
                <button type="button" class="add-btn icon-btn add-contact-phone-btn" onclick="addContactPhoneInput(this)">
                    <span class="material-icons-outlined">add</span> 添加电话
                </button>
            </div>
        </div>
    `;
    container.appendChild(contactGroup);
    const firstPhoneGroup = contactGroup.querySelector('.contact-phones-container .input-group-dynamic');
    if (firstPhoneGroup) {
        updateContactRemoveButtonsVisibility(firstPhoneGroup.parentNode);
    }

    updateHoverTargets();
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
    removeButton.onclick = function () { removeContactPhoneInput(this); };

    inputContainer.appendChild(newInput);
    inputContainer.appendChild(removeButton);
    container.appendChild(inputContainer);

    updateContactRemoveButtonsVisibility(container);
    updateHoverTargets();
}

function removeContactPhoneInput(button) {
    const container = button.closest('.input-group-dynamic').parentNode;
    button.closest('.input-group-dynamic').remove();
    updateContactRemoveButtonsVisibility(container);
}

function updateContactRemoveButtonsVisibility(container) {
    const groups = container.querySelectorAll('.input-group-dynamic');
    if (groups.length === 1) {
        const firstRemoveBtn = groups[0].querySelector('.remove-contact-phone-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    } else {
        groups.forEach(group => {
            const removeBtn = group.querySelector('.remove-contact-phone-btn');
            if (removeBtn) {
                removeBtn.style.display = 'inline-flex';
            }
        });
    }
}

// ================================================================
// ==================== 客户数据提交与编辑 =========================
// ================================================================

function setFormReadOnly(isReadOnly) {
    const form = document.getElementById('client-form');
    const formView = document.getElementById('add-client-view');
    const inputs = form.querySelectorAll('input, select, textarea');
    const addRemoveBtns = form.querySelectorAll('.add-btn, .remove-btn');

    if (isReadOnly) {
        formView.classList.add('form-view-mode');
    } else {
        formView.classList.remove('form-view-mode');
    }

    inputs.forEach(input => {
        if (input.type === 'hidden') return;
        input.disabled = isReadOnly;
    });

    if (!isReadOnly) {
        updateRemoveButtonsVisibility(document.getElementById('client-phone-inputs-container'));
        const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
        contactGroups.forEach(group => {
            updateContactRemoveButtonsVisibility(group.querySelector('.contact-phones-container'));
        });
    }
}

function viewClientDetails(clientId) {
    console.log("准备查看 Client ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row) {
        showCustomAlert("无法加载客户数据进行查看。", 'error');
        return;
    }
    const fullClientString = unescape(row.dataset.fullClientString);
    if (!fullClientString) {
        showCustomAlert("无法加载客户详细数据。", 'error');
        return;
    }
    populateClientForm(clientId, fullClientString);

    const parentSection = document.getElementById('client-section');
    parentSection.querySelector('#client-list-view').classList.remove('active');
    parentSection.querySelector('#add-client-view').classList.add('active');
    parentSection.querySelectorAll('.secondary-nav-btn').forEach(btn => btn.classList.remove('active'));
    const listButton = parentSection.querySelector(`.secondary-nav-btn[onclick*="client-list-view"]`);
    if (listButton) {
        listButton.classList.add('active');
    }

    setFormReadOnly(true);

    document.getElementById('client-form-title').textContent = '客户详细信息';
    document.getElementById('client-submit-btn').style.display = 'none';
    document.getElementById('client-cancel-btn').style.display = 'none';

    const formActions = document.querySelector('#add-client-view .form-actions');
    let viewBackBtn = document.getElementById('client-view-back-btn');
    if (!viewBackBtn) {
        viewBackBtn = document.createElement('button');
        viewBackBtn.id = 'client-view-back-btn';
        viewBackBtn.type = 'button';
        viewBackBtn.className = 'section-btn cancel-btn hover-target';
        viewBackBtn.textContent = '返回列表';
        viewBackBtn.onclick = returnToClientList;
        formActions.appendChild(viewBackBtn);
        o(viewBackBtn);
    }
    viewBackBtn.style.display = 'inline-block';

    window.scrollTo(0, 0);
}

function returnToClientList() {
    // 1. 解除表单只读状态
    setFormReadOnly(false);

    // 2. 重置表单为添加模式（清空内容）
    resetAndPrepareAddForm(); // 这个函数内部会处理按钮和标题

    // 3. 隐藏“返回”按钮
    const viewBackBtn = document.getElementById('client-view-back-btn');
    if (viewBackBtn) {
        viewBackBtn.style.display = 'none';
    }

    // 4. 切换回列表视图
    showView('client-list-view', 'client-section');
}

function submitClient() {
    const form = document.getElementById('client-form');
    const resultDiv = document.getElementById('client-add-result');
    resultDiv.textContent = '提交中...';
    resultDiv.style.color = 'inherit';

    // --- 数据收集逻辑 (与之前的 submitClient 相同) ---
    const clientData = {
        // *** 修改点：确保添加时 ID 为 '0' ***
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
        if (phone) { clientPhones.push(phone); }
    });
    const clientPhonesStr = clientPhones.join(',');

    let contactsArray = [];
    const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
    contactGroups.forEach(group => {
        const name = group.querySelector('.contact-name').value.trim();
        if (!name) { // 如果联络员姓名为空，则跳过该联络员
            console.warn("跳过一个没有名字的联络员输入组。");
            return;
        }
        const gender = group.querySelector('.contact-gender').value.trim() || '未知';
        const year = group.querySelector('.contact-birth-year').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day').value.trim() || '0';
        const email = group.querySelector('.contact-email').value.trim();
        let contactPhones = [];
        const contactPhoneInputs = group.querySelectorAll('.contact-phone-input');
        contactPhoneInputs.forEach(input => {
            const phone = input.value.trim();
            if (phone) { contactPhones.push(phone); }
        });
        const contactPhonesStr = contactPhones.join('~');
        const contactString = `${name}.${gender}.${year}.${month}.${day}.${email}.${contactPhonesStr}`;
        contactsArray.push(contactString);
    });
    const contactsStr = contactsArray.join(',');
    // --- 数据收集逻辑结束 ---

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
                showCustomAlert('添加客户失败。', 'error');
            } else {
                resultDiv.textContent = data.output || '添加成功！';
                resultDiv.style.color = 'green';
                // 成功后重置表单为添加模式
                resetAndPrepareAddForm();
                showCustomAlert('添加客户成功！', 'success');
                // 可以选择性地跳转回列表页
                showView('client-list-view', 'client-section');
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            resultDiv.textContent = '添加客户时发生错误: ' + error.message;
            resultDiv.style.color = 'red';
        });
}

function setEditingState(isEditing) {
    const navLinks = document.querySelectorAll('.nav__list-item a');
    const secondaryBtns = document.querySelectorAll('.secondary-nav-btn');
    const formAddBtns = document.querySelectorAll('#add-client-view .add-btn, #add-client-view .remove-btn, #add-client-view .submit-btn, #add-client-view .cancel-btn'); // 添加/移除按钮
    const formInputs = document.querySelectorAll('#add-client-view input, #add-client-view select'); // 表单输入

    if (isEditing) {
        document.body.classList.add('is-editing');
        navLinks.forEach(link => link.classList.add('disabled'));
        secondaryBtns.forEach(btn => btn.classList.add('disabled'));
        // 可以选择性地禁用表单内的添加/删除按钮，防止混淆
        // formAddBtns.forEach(btn => btn.disabled = true);
    } else {
        document.body.classList.remove('is-editing');
        navLinks.forEach(link => link.classList.remove('disabled'));
        secondaryBtns.forEach(btn => btn.classList.remove('disabled'));
        // formAddBtns.forEach(btn => btn.disabled = false);

        // 确保 "添加客户" 表单的标题和按钮恢复
        resetAndPrepareAddForm();
    }
}

function editClientSetup(clientId) {
    console.log("准备编辑 Client ID:", clientId);
    const row = document.querySelector(`tr[data-id="${clientId}"]`);
    if (!row) {
        showCustomAlert("无法加载客户数据进行编辑。", 'error');
        return;
    }

    const fullClientString = unescape(row.dataset.fullClientString);
    if (!fullClientString) {
        showCustomAlert("无法加载客户详细数据。", 'error');
        return;
    }

    setEditingState(true);
    populateClientForm(clientId, fullClientString);

    document.getElementById('client-form-title').textContent = '编辑客户信息';
    const submitBtn = document.getElementById('client-submit-btn');
    submitBtn.textContent = '更新客户信息';
    submitBtn.onclick = submitClientUpdate;

    const cancelBtn = document.getElementById('client-cancel-btn');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelClientUpdate;

    const parentSection = document.getElementById('client-section');
    parentSection.querySelector('#client-list-view').classList.remove('active');
    parentSection.querySelector('#add-client-view').classList.add('active');

    parentSection.querySelectorAll('.secondary-nav-btn').forEach(btn => btn.classList.remove('active'));
    const addButton = parentSection.querySelector(`.secondary-nav-btn[onclick*="add-client-view"]`);
    if (addButton) {
        addButton.classList.add('active');
        addButton.classList.add('disabled');
    }

    window.scrollTo(0, 0);
}

function populateClientForm(clientId, fullClientString) {
    setFormReadOnly(false);

    const form = document.getElementById('client-form');
    form.reset();
    resetClientPhoneInputs();
    resetContactsContainer();

    document.getElementById('editing-client-id').value = clientId;

    const fields = fullClientString.split(';');
    // 字段索引: 0:ID, 1:Name, 2:Region, 3:Address, 4:LegalPerson, 5:Size, 6:Level, 7:Email, 8:Phones, 9+:Contacts

    form.elements['name'].value = fields[1] || '';
    form.elements['region'].value = fields[2] || '';
    form.elements['address'].value = fields[3] || '';
    form.elements['legal_person'].value = fields[4] || '';
    form.elements['size'].value = fields[5] || '';
    form.elements['contact_level'].value = fields[6] || '';
    form.elements['email'].value = fields[7] || '';

    const clientPhonesStr = fields[8] || '';
    const clientPhones = clientPhonesStr.split(',').filter(p => p.trim());
    const phoneContainer = document.getElementById('client-phone-inputs-container');
    const firstPhoneInput = phoneContainer.querySelector('.phone-input');
    if (clientPhones.length > 0) {
        firstPhoneInput.value = clientPhones[0];
        for (let i = 1; i < clientPhones.length; i++) {
            addClientPhoneInput();
            phoneContainer.lastElementChild.querySelector('.phone-input').value = clientPhones[i];
        }
    } else {
        addClientPhoneInput();
    }
    updateRemoveButtonsVisibility(phoneContainer);

    const contactsStr = fields.slice(9).join(';') || '';
    const contacts = contactsStr.split(',').filter(c => c.trim());
    const contactsContainer = document.getElementById('contacts-container');
    contactsContainer.innerHTML = '';
    contacts.forEach(contactData => {
        addContactGroup();
        const newGroup = contactsContainer.lastElementChild;
        const contactFields = contactData.split('=');
        // 字段索引: 0:Name, 1:Gender, 2:Year, 3:Month, 4:Day, 5:Email, 6+:Phones(~)

        newGroup.querySelector('.contact-name').value = contactFields[0] || '';
        newGroup.querySelector('.contact-gender').value = contactFields[1] || '未知';
        newGroup.querySelector('.contact-birth-year').value = contactFields[2] || '';
        newGroup.querySelector('.contact-birth-month').value = contactFields[3] || '';
        newGroup.querySelector('.contact-birth-day').value = contactFields[4] || '';
        newGroup.querySelector('.contact-email').value = contactFields[5] || '';

        const contactPhonesStr = contactFields.slice(6).join('.') || '';
        const contactPhones = contactPhonesStr.split('~').filter(p => p.trim());
        const contactPhoneContainer = newGroup.querySelector('.contact-phones-container');

        const firstContactPhoneGroup = contactPhoneContainer.querySelector('.input-group-dynamic');
        let firstContactPhoneInput = null;
        if (firstContactPhoneGroup) {
            firstContactPhoneInput = firstContactPhoneGroup.querySelector('.contact-phone-input');
        }

        if (firstContactPhoneGroup && firstContactPhoneInput && !firstContactPhoneInput.value && contactPhones.length > 0) {
            firstContactPhoneGroup.remove();
        }

        if (contactPhones.length > 0) {
            contactPhones.forEach(phone => {
                const addPhoneBtn = newGroup.querySelector('.add-contact-phone-btn');
                addContactPhoneInput(addPhoneBtn);
                const newlyAddedInput = contactPhoneContainer.lastElementChild.querySelector('.contact-phone-input');
                if (newlyAddedInput) {
                    newlyAddedInput.value = phone;
                }
            });
        } else {
            if (contactPhoneContainer.children.length === 0) {
                const addPhoneBtn = newGroup.querySelector('.add-contact-phone-btn');
                addContactPhoneInput(addPhoneBtn);
            }
        }
        updateContactRemoveButtonsVisibility(contactPhoneContainer);
    });

    updateHoverTargets();
}

function submitClientUpdate() {
    const form = document.getElementById('client-form');
    const resultDiv = document.getElementById('client-add-result');
    resultDiv.textContent = '更新中...';
    resultDiv.style.color = 'inherit';

    const clientId = document.getElementById('editing-client-id').value;
    if (!clientId || clientId === '0') {
        resultDiv.textContent = '错误：无效的客户ID，无法更新。';
        resultDiv.style.color = 'red';
        return;
    }

    const clientData = {
        id: clientId,
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
        if (phone) { clientPhones.push(phone); }
    });
    const clientPhonesStr = clientPhones.join(',');

    let contactsArray = [];
    const contactGroups = document.querySelectorAll('#contacts-container .contact-group');
    contactGroups.forEach(group => {
        const name = group.querySelector('.contact-name').value.trim();
        if (!name) {
            console.warn("更新时跳过一个没有名字的联络员输入组。");
            return;
        }
        const gender = group.querySelector('.contact-gender').value.trim() || '未知';
        const year = group.querySelector('.contact-birth-year').value.trim() || '0';
        const month = group.querySelector('.contact-birth-month').value.trim() || '0';
        const day = group.querySelector('.contact-birth-day').value.trim() || '0';
        const email = group.querySelector('.contact-email').value.trim();
        let contactPhones = [];
        const contactPhoneInputs = group.querySelectorAll('.contact-phone-input');
        contactPhoneInputs.forEach(input => {
            const phone = input.value.trim();
            if (phone) { contactPhones.push(phone); }
        });
        const contactPhonesStr = contactPhones.join('~');
        const contactString = `${name}=${gender}=${year}=${month}=${day}=${email}=${contactPhonesStr}`;
        contactsArray.push(contactString);
    });
    const contactsStr = contactsArray.join(',');

    const finalClientString = [
        clientData.id, clientData.name, clientData.region, clientData.address,
        clientData.legal_person, clientData.size, clientData.contact_level,
        clientData.email, clientPhonesStr, contactsStr
    ].join(';');

    console.log("最终更新的字符串:", finalClientString);

    fetch('/api/update_client', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: finalClientString })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error updating client:', data.error);
                resultDiv.textContent = '更新客户失败: ' + data.error;
                resultDiv.style.color = 'red';
                showCustomAlert('更新客户失败：' + data.error, 'error');
            } else {
                resultDiv.textContent = data.output || '更新成功！';
                resultDiv.style.color = 'green';
                showCustomAlert('客户信息已更新！', 'success');
                setEditingState(false);
                showView('client-list-view', 'client-section');
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            resultDiv.textContent = '更新客户时发生错误: ' + error.message;
            resultDiv.style.color = 'red';
            showCustomAlert('更新客户信息时发生网络错误。', 'error');
        });
}

function cancelClientUpdate() {
    showCustomConfirm(
        "未保存的更改将丢失。",
        "确定要取消编辑吗？",
        () => {
            setEditingState(false);
            setFormReadOnly(false);
            const viewBackBtn = document.getElementById('client-view-back-btn');
            if (viewBackBtn) {
                viewBackBtn.style.display = 'none';
            }
            resetAndPrepareAddForm();
            showView('client-list-view', 'client-section');
        }
    );
}

// ================================================================
// ==================== 删除客户 ===================================
// ================================================================

function deleteClient(clientId) {
    showCustomConfirm(
        `客户 ID 为 ${clientId} 的记录将被永久删除，此操作无法撤销。`,
        `确定要删除客户吗？`,
        () => {
            fetch(`/api/delete_client/${clientId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error deleting client:', data.error);
                        showCustomAlert('删除客户失败：' + data.error, 'error');
                    } else {
                        showCustomAlert(`客户 ${clientId} 已删除。`, 'success');
                        fetchClientData();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showCustomAlert("删除客户时发生网络错误。", 'error');
                });
        }
    );
}

// ================================================================
// ==================== 搜索功能 ===================================
// ================================================================

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

// ================================================================
// ==================== 用户管理 (保持不变/待实现) ==================
// ================================================================

// - User 相关 -
function submitUser() { /* ... 省略 ... */ console.log("Submitting user..."); }
// *** 注意: 显示用户列表的 fetchUserData 和 generateUserTable 需要你自己实现 ***
// function fetchUserData() { console.log("Fetching user data (Not Implemented)..."); }
// function generateUserTable(output) { console.log("Generating user table (Not Implemented)..."); }

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/index.html';
}

// ================================================================
// ==================== 自定义提示系统 =============================
// ================================================================
function showCustomAlert(message, type = 'info', duration = 4000) {
    const container = document.getElementById('custom-alert-container');
    if (!container) {
        console.error('Custom alert container not found!');
        // Fallback to default alert if container is missing
        alert(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `custom-alert alert-${type}`; // Base class + type class

    // 图标映射
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    const iconName = icons[type] || icons.info;

    // 构建内部 HTML
    alertElement.innerHTML = `
        <span class="material-icons alert-icon">${iconName}</span>
        <span class="alert-message">${message}</span>
        <button type="button" class="alert-close-btn" aria-label="Close">
            <span class="material-icons" style="font-size: inherit;">close</span>
        </button>
    `;

    // 添加到容器
    container.appendChild(alertElement);

    // --- 显示动画 ---
    // 使用 requestAnimationFrame 确保元素已添加到 DOM 并且 CSS 可以应用初始状态
    requestAnimationFrame(() => {
        alertElement.classList.add('show');
    });


    // --- 关闭逻辑 ---
    let closeTimeout;

    const closeAlert = () => {
        clearTimeout(closeTimeout); // 清除可能存在的自动关闭计时器
        alertElement.classList.remove('show'); // 触发关闭动画

        // 等待动画结束后再移除元素
        alertElement.addEventListener('transitionend', () => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, { once: true }); // 确保事件只触发一次

        // 作为备用，以防 transitionend 未触发（例如元素被立即隐藏）
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 500); // 动画时间 + 一点缓冲
    };

    // 绑定关闭按钮事件
    alertElement.querySelector('.alert-close-btn').addEventListener('click', closeAlert);

    // 设置自动关闭 (如果 duration > 0)
    if (duration > 0) {
        closeTimeout = setTimeout(closeAlert, duration);
    }

    // 更新悬停目标，使关闭按钮的光标效果生效
    updateHoverTargets();
}

// ================================================================
// ============ 自定义确认对话框系统 ================================
// ================================================================

// 全局变量用于存储 confirm 的回调
let confirmCallback = null;

function showCustomConfirm(message, title = '确认操作', onConfirm, onCancel) {
    const overlay = document.getElementById('custom-confirm-overlay');
    const box = document.getElementById('custom-confirm-box');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!overlay || !box || !confirmTitle || !confirmMessage || !okBtn || !cancelBtn) {
        console.error("自定义确认对话框的某些元素未找到！");
        // 回退到原生 confirm
        if (window.confirm(`${title}\n${message}`)) {
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        } else {
            if (typeof onCancel === 'function') {
                onCancel();
            }
        }
        return;
    }

    // 设置内容
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;

    // 存储回调
    confirmCallback = { confirm: onConfirm, cancel: onCancel };

    // 显示对话框
    overlay.classList.add('show');

    // 确保按钮有悬停效果
    updateHoverTargets();
}

// 关闭自定义确认对话框的函数
function closeCustomConfirm() {
    const overlay = document.getElementById('custom-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // 清除回调，防止内存泄漏
    confirmCallback = null;
}

// --- 在 DOMContentLoaded 事件监听器中或文件底部添加按钮事件监听 ---
document.addEventListener('DOMContentLoaded', () => {
    showMainSection('client-section');
    updateHoverTargets();

    // 自定义确认对话框按钮事件
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => {
            if (confirmCallback && typeof confirmCallback.confirm === 'function') {
                confirmCallback.confirm(); // 执行确认回调
            }
            closeCustomConfirm(); // 关闭对话框
        });
    }

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (confirmCallback && typeof confirmCallback.cancel === 'function') {
                confirmCallback.cancel(); // 执行取消回调 (如果提供了)
            }
            closeCustomConfirm(); // 关闭对话框
        });
    }

    // (可选) 点击遮罩层也可以关闭 (相当于取消)
    const overlay = document.getElementById('custom-confirm-overlay');
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            // 确保点击的是遮罩层本身，而不是对话框内部
            if (event.target === overlay) {
                if (confirmCallback && typeof confirmCallback.cancel === 'function') {
                    confirmCallback.cancel(); // 执行取消回调
                }
                closeCustomConfirm();
            }
        });
    }
});