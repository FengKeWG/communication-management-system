function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    if (!username || !password) {
        alert("请输入用户名和密码！");
        return;
    }
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                sessionStorage.setItem("token", data.access_token);
                sessionStorage.setItem("role", data.role);
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("sales_id", data.sales_id);
                window.location.href = "/pages/manager.html";
            } else {
                alert("登录失败: " + (data.error || "返回数据格式错误"));
            }
        })
        .catch(error => {
            alert("登录失败: " + (error.serverError || error.message || "登录请求出错!"));
        });
}

const modal = document.getElementById('forgotPasswordModal');
const verificationStep = document.getElementById('verificationStep');
const resetStep = document.getElementById('resetStep');
const verificationError = document.getElementById('verificationError');
const resetError = document.getElementById('resetError');
const resetSuccess = document.getElementById('resetSuccess');
const verifiedUsernameInput = document.getElementById('verifiedUsername');

function showForgotPasswordModal(event) {
    if (event) {
        event.preventDefault();
    }
    verificationStep.style.display = 'block';
    resetStep.style.display = 'none';
    const inputsToClear = modal.querySelectorAll('#fpUsername, #fpName, #fpBirthYear, #fpBirthMonth, #fpBirthDay, #fpEmail, #fpNewPassword, #fpConfirmPassword');
    inputsToClear.forEach(input => {
        input.value = '';
    });
    verificationError.textContent = '';
    resetError.textContent = '';
    resetSuccess.textContent = '';
    verifiedUsernameInput.value = '';
    modal.style.display = 'block';
    void modal.offsetWidth;
    modal.classList.add('modal-show');
}

function closeForgotPasswordModal() {
    modal.classList.remove('modal-show');
    setTimeout(() => {
        if (modal) {
            modal.style.display = 'none';
        }
    }, 300);
}

window.onclick = function (event) {
    if (event.target == modal) {
        closeForgotPasswordModal();
    }
}

function handleVerificationSubmit() {
    const username = document.getElementById('fpUsername').value.trim();
    const name = document.getElementById('fpName').value.trim();
    const yearStr = document.getElementById('fpBirthYear').value;
    const monthStr = document.getElementById('fpBirthMonth').value;
    const dayStr = document.getElementById('fpBirthDay').value;
    const email = document.getElementById('fpEmail').value.trim();
    verificationError.textContent = '';

    if (!username || !name || !yearStr || !monthStr || !dayStr || !email) {
        verificationError.textContent = '所有字段均为必填项。';
        return;
    }

    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
        verificationError.textContent = '请输入有效的年、月、日数字。';
        return;
    }

    fetch('/api/forgot_password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            name: name,
            birth_year: yearNum,
            birth_month: monthNum,
            birth_day: dayNum,
            email: email
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                verificationError.textContent = data.error;
            }
            else {
                verifiedUsernameInput.value = username;
                verificationStep.style.display = 'none';
                resetStep.style.display = 'block';
                resetError.textContent = '';
                resetSuccess.textContent = '';
                document.getElementById('fpNewPassword').value = '';
                document.getElementById('fpConfirmPassword').value = '';
                document.getElementById('fpNewPassword').focus();
            }
        })
        .catch(error => {
            verificationError.textContent = '请求验证时出错，请检查网络连接或联系管理员。';
        });
}

function handlePasswordResetSubmit() {
    const username = verifiedUsernameInput.value;
    const newPassword = document.getElementById('fpNewPassword').value;
    const confirmPassword = document.getElementById('fpConfirmPassword').value;
    resetError.textContent = '';
    resetSuccess.textContent = '';
    if (!newPassword || !confirmPassword) {
        resetError.textContent = '请输入新密码并确认。';
        return;
    }
    if (!username) {
        resetError.textContent = '无法获取用户信息，请重新开始验证。';
        return;
    }
    fetch('/api/forgot_password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            new_password: newPassword
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resetError.textContent = data.error;
                resetSuccess.textContent = '';
            }
            else {
                resetSuccess.textContent = data.output;
                resetError.textContent = '';
                setTimeout(() => {
                    closeForgotPasswordModal();
                }, 2000);
            }
        })
        .catch(error => {
            resetError.textContent = '请求重置密码时出错，请检查网络连接。';
        });
}