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
    if (t) {
        t.addEventListener("mouseover", n);
        t.addEventListener("mouseout", s);
    }
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
        var init = function init() {
            body = document.querySelector('body');
            menu = document.querySelector('.menu-icon');
            if (body && menu) {
                applyListeners();
            }
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
    const container = document.querySelector('.content-container');
    if (!container) return;
    if (document.body.classList.contains('app-locked')) {
        showCustomAlert("请先完成或取消当前操作后再切换板块。", "warning");
        return;
    }
    const currentActiveSection = container.querySelector('.main-section.active');
    const sectionToShow = document.getElementById(sectionIdToShow);
    if (currentActiveSection && currentActiveSection !== sectionToShow) {
        currentActiveSection.classList.remove('active');
    }
    if (sectionToShow && !sectionToShow.classList.contains('active')) {
        sectionToShow.classList.add('active');
        let defaultViewId = null;
        if (sectionIdToShow === 'client-section') {
            defaultViewId = 'client-list-view';
        } else if (sectionIdToShow === 'user-section') {
            defaultViewId = 'user-list-view';
        } else if (sectionIdToShow === 'sales-section') {
            defaultViewId = 'sales-list-view';
        } else if (sectionIdToShow === 'communication-section') {
            defaultViewId = 'communication-list-view';
        } else if (sectionIdToShow === 'group-section') {
            defaultViewId = 'group-list-view';
        } else if (sectionIdToShow === 'backup-section') {
            setTimeout(() => {
                if (typeof fetchBackups === 'function') {
                    fetchBackups();
                }
            }, 50);
        }
        if (defaultViewId) {
            setTimeout(() => {
                showView(defaultViewId, sectionIdToShow);
            }, 50);
        }
    }
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
    const currentlyLocked = document.body.classList.contains('app-locked');
    parentSection.querySelectorAll('.secondary-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (currentlyLocked) {
            btn.classList.add('disabled');
        } else {
            btn.classList.remove('disabled');
        }
    });
    const clickedButton = parentSection.querySelector(`.secondary-nav-btn[onclick*="${viewIdToShow}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
        if (currentlyLocked) {
            clickedButton.classList.add('disabled');
        }
    }
    const currentActiveView = parentSection.querySelector('.content-view.active');
    const viewToShow = document.getElementById(viewIdToShow);
    if (!viewToShow) {
        return;
    }
    if (currentActiveView && currentActiveView !== viewToShow) {
        currentActiveView.classList.remove('active');
    }
    if (!viewToShow.classList.contains('active')) {
        viewToShow.classList.add('active');
        setTimeout(() => {
            if (!document.body.classList.contains('app-locked')) {
                if (viewIdToShow === 'client-list-view' && typeof fetchClientData === 'function') {
                    fetchClientData();
                } else if (viewIdToShow === 'user-list-view' && typeof fetchUserData === 'function') {
                    fetchUserData();
                } else if (viewIdToShow === 'sales-list-view' && typeof fetchSalesData === 'function') {
                    fetchSalesData();
                } else if (viewIdToShow === 'communication-list-view' && typeof fetchCommunicationData === 'function') {
                    fetchCommunicationData();
                } else if (viewIdToShow === 'add-client-view' && typeof resetAndPrepareClientAddForm === 'function') {
                    resetAndPrepareClientAddForm();
                } else if (viewIdToShow === 'add-user-view' && typeof resetAndPrepareUserAddForm === 'function') {
                    resetAndPrepareUserAddForm();
                } else if (viewIdToShow === 'add-sales-view' && typeof resetAndPrepareSalesAddForm === 'function') {
                    resetAndPrepareSalesAddForm();
                } else if (viewIdToShow === 'add-communication-view' && typeof resetAndPrepareCommunicationAddForm === 'function') {
                    resetAndPrepareCommunicationAddForm();
                } else if (viewIdToShow === 'group-list-view' && typeof fetchGroupData === 'function') {
                    fetchGroupData();
                }
                else if (viewIdToShow === 'add-group-view' && typeof resetAndPrepareGroupAddForm === 'function') {
                    resetAndPrepareGroupAddForm();
                }
            }
        }, 50);
    }
    else if (viewToShow.classList.contains('active') && !currentlyLocked) {
        if (viewIdToShow === 'client-list-view' && typeof fetchClientData === 'function') {
            fetchClientData();
        } else if (viewIdToShow === 'user-list-view' && typeof fetchUserData === 'function') {
            fetchUserData();
        } else if (viewIdToShow === 'sales-list-view' && typeof fetchSalesData === 'function') {
            fetchSalesData();
        } else if (viewIdToShow === 'communication-list-view' && typeof fetchCommunicationData === 'function') {
            fetchCommunicationData();
        } else if (viewIdToShow === 'group-list-view' && typeof fetchGroupData === 'function') {
            fetchGroupData();
        }
    }
    updateHoverTargets();
}
function updateHoverTargets() {
    document.querySelectorAll('.hover-target').forEach(el => {
        o(el);
    });
}
function setAppLockedState(isLocked) {
    const body = document.body;
    const secondaryBtns = document.querySelectorAll('.secondary-nav-btn');
    const mainNavLinks = document.querySelectorAll('.nav__list-item a');
    if (isLocked) {
        body.classList.add('app-locked');
        secondaryBtns.forEach(btn => btn.classList.add('disabled'));
        mainNavLinks.forEach(link => link.classList.add('disabled'));
    } else {
        body.classList.remove('app-locked');
        secondaryBtns.forEach(btn => btn.classList.remove('disabled'));
        mainNavLinks.forEach(link => link.classList.remove('disabled'));
    }
    updateHoverTargets();
}
function showCustomAlert(message, type = 'info', duration = 4000) {
    const container = document.getElementById('custom-alert-container');
    if (!container) {
        alert(`[${type.toUpperCase()}] ${message}`);
        return;
    }
    const alertElement = document.createElement('div');
    alertElement.className = `custom-alert alert-${type}`;
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    const iconName = icons[type] || icons.info;
    alertElement.innerHTML = `
        <span class="material-icons alert-icon">${iconName}</span>
        <span class="alert-message">${message}</span>
        <button type="button" class="alert-close-btn" aria-label="Close">
            <span class="material-icons" style="font-size: inherit;">close</span>
        </button>
    `;
    container.appendChild(alertElement);
    requestAnimationFrame(() => alertElement.classList.add('show'));
    let closeTimeout;
    const closeAlert = () => {
        clearTimeout(closeTimeout);
        alertElement.classList.remove('show');
        alertElement.addEventListener('transitionend', () => alertElement.remove(), { once: true });
        setTimeout(() => { if (alertElement.parentNode) alertElement.remove(); }, 500);
    };
    alertElement.querySelector('.alert-close-btn').addEventListener('click', closeAlert);
    if (duration > 0) closeTimeout = setTimeout(closeAlert, duration);
    updateHoverTargets();
}
let confirmCallback = null;
function showCustomConfirm(message, title = '确认操作', onConfirm, onCancel) {
    const overlay = document.getElementById('custom-confirm-overlay');
    const box = document.getElementById('custom-confirm-box');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    if (!overlay || !box || !confirmTitle || !confirmMessage || !okBtn || !cancelBtn) {
        if (window.confirm(`${title}\n${message}`)) { if (typeof onConfirm === 'function') onConfirm(); }
        else { if (typeof onCancel === 'function') onCancel(); }
        return;
    }
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = { confirm: onConfirm, cancel: onCancel };
    overlay.classList.add('show');
    updateHoverTargets();
}
function closeCustomConfirm() {
    const overlay = document.getElementById('custom-confirm-overlay');
    if (overlay) overlay.classList.remove('show');
    confirmCallback = null;
}
function displayUserInfo() {
    const username = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role");
    const sales_id = sessionStorage.getItem("sales_id");
    const nameSpan = document.getElementById("user-display-name");
    const roleSpan = document.getElementById("user-display-role");
    if (username && role && nameSpan && roleSpan) {
        nameSpan.textContent = username;
        let roleDisplay = role;
        switch (role) {
            case 'manager':
                roleDisplay = '经理';
                break;
            case 'sales':
                roleDisplay = `业务员 (ID: ${sales_id !== '0' && sales_id !== '-1' ? sales_id : 'N/A'})`;
                break;
            default:
                roleDisplay = '未知角色';
        }
        roleSpan.textContent = roleDisplay;
    } else {
        showCustomAlert("用户身份信息丢失，请重新登录。", "error", 5000);
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    }
}
function applyActionPermissions() {
    const role = sessionStorage.getItem("role");
    const isSales = (role === 'sales');
    const isManager = (role === 'manager');
    document.querySelectorAll('.action-requires-manager').forEach(el => {
        el.style.display = isManager ? '' : 'none';
    });
    document.querySelectorAll('.action-hidden-for-sales').forEach(el => {
        el.style.display = isSales ? 'none' : '';
    });
    document.querySelectorAll('.action-disabled-for-sales').forEach(el => {
        el.disabled = isSales;
        if (isSales) el.classList.add('disabled'); else el.classList.remove('disabled');
    });
    const clientSection = document.getElementById('client-section');
    if (clientSection) {
        clientSection.querySelectorAll('.secondary-nav-btn[onclick*="add-client-view"]').forEach(btn => btn.style.display = isSales ? 'none' : '');
    }
    const userSection = document.getElementById('user-section');
    if (userSection && !isManager) {
        userSection.querySelectorAll('.secondary-nav-btn, .edit-btn, .delete-btn').forEach(btn => btn.style.display = 'none');
    }
    const salesSection = document.getElementById('sales-section');
    if (salesSection && !isManager) {
        salesSection.querySelectorAll('.secondary-nav-btn, .edit-btn, .delete-btn').forEach(btn => btn.style.display = 'none');
    }
    const commSection = document.getElementById('communication-section');
    if (commSection) {
        const addCommButton = commSection.querySelector('.secondary-nav-btn[onclick*="add-communication-view"]');
        if (addCommButton) {
            addCommButton.style.display = isSales ? '' : 'none';
        }
    }
    updateHoverTargets();
}
function applyMenuPermissions() {
    const role = sessionStorage.getItem("role");
    if (!role) return;
    const menuPermissions = {
        'manager': [
            'menu-client-management',
            'menu-user-management',
            'menu-sales-management',
            'menu-communication-management',
            'menu-backup-management',
            'menu-group-management'
        ],
        'sales': [
            'menu-client-management',
            'menu-communication-management'
        ],
    };
    const allowedMenus = menuPermissions[role] || [];
    const allMenuItems = document.querySelectorAll('.nav__list .nav__list-item[id]');
    allMenuItems.forEach(item => {
        if (allowedMenus.includes(item.id)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
    const firstVisibleMenuItemLink = document.querySelector('.nav__list .nav__list-item[id]:not([style*="display: none"]) a');
    if (firstVisibleMenuItemLink) {
        const onclickAttr = firstVisibleMenuItemLink.getAttribute('onclick');
        const match = onclickAttr ? onclickAttr.match(/showMainSection\('([^']+)'\)/) : null;
        if (match && match[1]) {
            const currentActiveSection = document.querySelector('.main-section.active');
            if (!currentActiveSection || currentActiveSection.id !== match[1]) {
                setTimeout(() => showMainSection(match[1]), 50);
            } else {
                const currentActiveView = currentActiveSection.querySelector('.content-view.active');
                if (currentActiveView) {
                    setTimeout(() => showView(currentActiveView.id, currentActiveSection.id), 50);
                }
            }
        }
    } else {
        showCustomAlert("您没有访问任何模块的权限。", "warning");
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) contentContainer.innerHTML = '<p style="padding: 20px; text-align: center;">您没有访问任何模块的权限。</p>';
    }
}
function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('sales_id');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('sales_id');
    showCustomAlert('您已成功登出。', 'info', 2000);
    setTimeout(() => window.location.href = '/index.html', 1500);
}
document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    displayUserInfo();
    applyMenuPermissions();
    updateHoverTargets();
    applyActionPermissions();
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const overlay = document.getElementById('custom-confirm-overlay');
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => {
            if (confirmCallback && typeof confirmCallback.confirm === 'function') {
                confirmCallback.confirm();
            }
            closeCustomConfirm();
        });
    }
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (confirmCallback && typeof confirmCallback.cancel === 'function') {
                confirmCallback.cancel();
            }
            closeCustomConfirm();
        });
    }
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                if (confirmCallback && typeof confirmCallback.cancel === 'function') {
                    confirmCallback.cancel();
                }
                closeCustomConfirm();
            }
        });
    }
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeChangePasswordModal();
            }
        });
        modal.querySelectorAll('.hover-target').forEach(el => o(el));
    }
    const changePwdButton = document.querySelector('.user-actions-area button[onclick="showChangePasswordModal()"]');
    if (changePwdButton) o(changePwdButton);
    const toggleBtn = document.getElementById('toggleDetailedSearchBtn');
    const detailedArea = document.getElementById('detailed-search-area');
    if (toggleBtn && detailedArea) {
        toggleBtn.addEventListener('click', () => {
            detailedArea.classList.toggle('show');
            toggleBtn.classList.toggle('active');
        });
        if (currentClientNameSearch || currentClientRegionSearch || currentClientAddressSearch ||
            currentClientLegalPersonSearch || currentClientSizeSearch || currentClientContactLevelSearch ||
            currentClientEmailSearch || currentClientContactCountSearch) {
            detailedArea.classList.add('show');
            toggleBtn.classList.add('active');
        }
    }
    const salesToggleBtn = document.getElementById('toggleDetailedSalesSearchBtn');
    const salesDetailedArea = document.getElementById('detailed-sales-search-area');
    if (salesToggleBtn && salesDetailedArea) {
        salesToggleBtn.addEventListener('click', () => {
            salesDetailedArea.classList.toggle('show');
            salesToggleBtn.classList.toggle('active');
        });
        if (currentSalesNameSearch || currentSalesEmailSearch || currentSalesClientCountSearch) {
            salesDetailedArea.classList.add('show');
            salesToggleBtn.classList.add('active');
        }
    }
    const commToggleBtn = document.getElementById('toggleDetailedCommSearchBtn');
    const commDetailedArea = document.getElementById('detailed-comm-search-area');
    if (commToggleBtn && commDetailedArea) {
        commToggleBtn.addEventListener('click', () => {
            commDetailedArea.classList.toggle('show');
            commToggleBtn.classList.toggle('active');
        });
        if (currentCommClientIdSearch || currentCommContactIdSearch || currentCommSalesIdSearch || currentCommDurationSearch || currentCommContentSearch) {
            commDetailedArea.classList.add('show');
            commToggleBtn.classList.add('active');
        }
    }
    const groupToggleBtn = document.getElementById('toggleDetailedGroupSearchBtn');
    const groupDetailedArea = document.getElementById('detailed-group-search-area');
    if (groupToggleBtn && groupDetailedArea) {
        groupToggleBtn.addEventListener('click', () => {
            groupDetailedArea.classList.toggle('show');
            groupToggleBtn.classList.toggle('active');
        });
        if (currentGroupNameSearch || currentGroupClientCountSearch) {
            groupDetailedArea.classList.add('show');
            groupToggleBtn.classList.add('active');
        }
    }
});
function showChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        document.getElementById('change-password-form').reset();
        const errorP = document.getElementById('password-change-error');
        if (errorP) errorP.style.display = 'none';
        modal.classList.add('show');
        updateHoverTargets();
    }
}
function closeChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
function submitPasswordChange() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const errorP = document.getElementById('password-change-error');
    if (errorP) {
        errorP.textContent = '';
        errorP.style.display = 'none';
    }
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        const msg = '所有密码字段都必须填写。';
        if (errorP) {
            errorP.textContent = msg;
            errorP.style.display = 'block';
        } else {
            showCustomAlert(msg, 'warning');
        }
        return;
    }
    const username = sessionStorage.getItem("username");
    if (!username) {
        showCustomAlert("无法获取当前用户信息，请重新登录。", "error");
        return;
    }
    const submitBtn = document.querySelector('#change-password-modal .submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';
    }
    fetch('/api/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            old_password: oldPassword,
            new_password: newPassword
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `服务器错误，状态码: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            showCustomAlert(data.output || "密码修改成功！", 'success');
            closeChangePasswordModal();
        })
        .catch(error => {
            console.error("密码修改失败:", error);
            const message = error.message || "发生未知错误";
            if (errorP) {
                errorP.textContent = message;
                errorP.style.display = 'block';
            } else {
                showCustomAlert(message, 'error');
            }
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '确认修改';
            }
        });
}