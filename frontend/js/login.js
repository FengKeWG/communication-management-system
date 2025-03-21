function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

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

                switch (data.role) {
                    case "manager":
                        window.location.href = "/pages/manager.html";
                        break;
                    case "sales":
                        window.location.href = "/pages/sales.html";
                        break;
                    default:
                        alert("未知角色!");
                }
            } else {
                alert("登录失败!");
            }
        });
}