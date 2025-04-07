function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.access_token) {
                sessionStorage.setItem("token", data.access_token);
                sessionStorage.setItem("role", data.role);
                sessionStorage.setItem("username", username);
                window.location.href = "/pages/manager.html";
            } else {
                alert("登录失败: " + (data.error || "未知错误"));
            }
        })
        .catch(error => {
            console.error(error);
            alert("登录请求出错!");
        });
}