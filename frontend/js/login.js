// frontend/js/login.js

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
                // Try to parse error json, fallback to status text
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
                sessionStorage.setItem("sales_id", data.sales_id); // Ensure sales_id is stored
                console.log(`Login successful: Role=${data.role}, SalesID=${data.sales_id}`);
                // Redirect to the manager page (adjust path if necessary)
                window.location.href = "/pages/manager.html";
            } else {
                // Handle cases where response is ok, but no token (should ideally not happen with proper backend logic)
                alert("登录失败: " + (data.error || "返回数据格式错误"));
            }
        })
        .catch(error => {
            console.error("Login error details:", error);
            // Display server error if available, otherwise generic message
            alert("登录失败: " + (error.serverError || error.message || "登录请求出错!"));
        });
}

// --- Forgot Password Modal Logic ---

const modal = document.getElementById('forgotPasswordModal');
const verificationStep = document.getElementById('verificationStep');
const resetStep = document.getElementById('resetStep');
const verificationError = document.getElementById('verificationError');
const resetError = document.getElementById('resetError');
const resetSuccess = document.getElementById('resetSuccess');
const verifiedUsernameInput = document.getElementById('verifiedUsername'); // Hidden input

function showForgotPasswordModal(event) {
    if (event) {
        event.preventDefault(); // Prevent default link behavior
    }

    // Reset modal state to initial view
    verificationStep.style.display = 'block';
    resetStep.style.display = 'none';

    // Clear all relevant input fields
    const inputsToClear = modal.querySelectorAll('#fpUsername, #fpName, #fpBirthYear, #fpBirthMonth, #fpBirthDay, #fpEmail, #fpNewPassword, #fpConfirmPassword');
    inputsToClear.forEach(input => {
        input.value = '';
        // Let CSS handle the label state based on empty value
    });

    // Clear messages and hidden field
    verificationError.textContent = '';
    resetError.textContent = '';
    resetSuccess.textContent = '';
    verifiedUsernameInput.value = '';

    // Show modal using animation class
    modal.style.display = 'block'; // Make it part of layout
    void modal.offsetWidth; // Force reflow for transition
    modal.classList.add('modal-show');
}

function closeForgotPasswordModal() {
    modal.classList.remove('modal-show'); // Trigger fade-out animation

    // Hide after animation completes
    setTimeout(() => {
        // Check if modal still exists before hiding (important for fast clicks)
        if (modal) {
            modal.style.display = 'none';
        }
    }, 300); // Match CSS transition duration (0.3s)
}

// Close modal if clicking on the backdrop
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

    verificationError.textContent = ''; // Clear previous errors

    // Basic client-side validation
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
    // Simple email format check (can be improved with regex)
    if (!email.includes('@') || !email.includes('.')) {
        verificationError.textContent = '请输入有效的邮箱地址。';
        return;
    }


    // --- Send verification data to backend ---
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
        .then(response => response.json().then(data => ({ status: response.status, body: data }))) // Always parse JSON
        .then(({ status, body }) => {
            if (status === 200 && body.success) {
                // Verification successful
                verifiedUsernameInput.value = username; // Store for reset step
                verificationStep.style.display = 'none';
                resetStep.style.display = 'block';
                resetError.textContent = '';
                resetSuccess.textContent = '';
                // Clear password fields when showing reset step
                document.getElementById('fpNewPassword').value = '';
                document.getElementById('fpConfirmPassword').value = '';
                // Optionally focus the first password field
                document.getElementById('fpNewPassword').focus();
                // **NO LONGER MANUALLY SETTING LABEL STYLES HERE**
            } else {
                // Verification failed
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

    resetError.textContent = ''; // Clear previous errors
    resetSuccess.textContent = ''; // Clear previous success messages

    // Client-side validation
    if (!newPassword || !confirmPassword) {
        resetError.textContent = '请输入新密码并确认。';
        return;
    }
    if (newPassword !== confirmPassword) {
        resetError.textContent = '两次输入的密码不一致。';
        document.getElementById('fpConfirmPassword').focus(); // Focus confirm field
        return;
    }
    if (!username) {
        resetError.textContent = '无法获取用户信息，请重新开始验证。';
        return;
    }
    // Add password complexity rules here if desired (e.g., min length)
    if (newPassword.length < 6) { // Example: minimum 6 characters
        resetError.textContent = '新密码长度至少需要6位。';
        return;
    }

    // --- Send reset request to backend ---
    fetch('/api/forgot_password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            new_password: newPassword
        })
    })
        .then(response => response.json().then(data => ({ status: response.status, body: data }))) // Always parse JSON
        .then(({ status, body }) => {
            if (status === 200 && body.success) {
                // Reset successful
                resetSuccess.textContent = body.message || '密码已成功重置！';
                resetError.textContent = '';
                // Close modal after a delay
                setTimeout(() => {
                    closeForgotPasswordModal();
                }, 2000); // Close after 2 seconds
            } else {
                // Reset failed
                resetError.textContent = '密码重置失败：' + (body.error || '未知错误，请稍后重试');
                resetSuccess.textContent = '';
            }
        })
        .catch(error => {
            console.error("Password reset fetch error:", error);
            resetError.textContent = '请求重置密码时出错，请检查网络连接。';
        });
}