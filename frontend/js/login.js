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
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    let error = new Error(err.error || `HTTP error! status: ${response.status}`);
                    error.serverError = err.error;
                    throw error;
                }).catch(() => {
                    throw new Error(`登录失败，服务器状态码: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.access_token) {
                sessionStorage.setItem("token", data.access_token);
                sessionStorage.setItem("role", data.role);
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("sales_id", data.sales_id);
                console.log(`Login successful: Role=${data.role}, SalesID=${data.sales_id}`);
                window.location.href = "/pages/manager.html";
            } else {
                alert("登录失败: " + (data.error || "返回数据格式错误"));
            }
        })
        .catch(error => {
            console.error("Login error details:", error);
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
    const year = document.getElementById('fpBirthYear').value;
    const month = document.getElementById('fpBirthMonth').value;
    const day = document.getElementById('fpBirthDay').value;
    const email = document.getElementById('fpEmail').value.trim();
    verificationError.textContent = '';
    if (!username || !name || !year || !month || !day || !email) {
        verificationError.textContent = '所有字段均为必填项。';
        return;
    }
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum) ||
        monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 ||
        yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        verificationError.textContent = '请输入有效的生日日期。';
        return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        verificationError.textContent = '请输入有效的邮箱地址。';
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
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200 && body.success) {
                verifiedUsernameInput.value = username;
                verificationStep.style.display = 'none';
                resetStep.style.display = 'block';
                resetError.textContent = '';
                resetSuccess.textContent = '';
                document.getElementById('fpNewPassword').value = '';
                document.getElementById('fpConfirmPassword').value = '';
                document.getElementById('fpNewPassword').focus();
            } else {
                verificationError.textContent = '验证失败：' + (body.error || '未知错误，请稍后重试');
            }
        })
        .catch(error => {
            console.error("Verification fetch error:", error);
            verificationError.textContent = '请求验证时出错，请检查网络连接。';
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
    if (newPassword !== confirmPassword) {
        resetError.textContent = '两次输入的密码不一致。';
        document.getElementById('fpConfirmPassword').focus();
        return;
    }
    if (!username) {
        resetError.textContent = '无法获取用户信息，请重新开始验证。';
        return;
    }
    if (newPassword.length < 6) {
        resetError.textContent = '新密码长度至少需要6位。';
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
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200 && body.success) {
                resetSuccess.textContent = body.message || '密码已成功重置！';
                resetError.textContent = '';
                setTimeout(() => {
                    closeForgotPasswordModal();
                }, 2000);
            } else {
                resetError.textContent = '密码重置失败：' + (body.error || '未知错误，请稍后重试');
                resetSuccess.textContent = '';
            }
        })
        .catch(error => {
            console.error("Password reset fetch error:", error);
            resetError.textContent = '请求重置密码时出错，请检查网络连接。';
        });
}