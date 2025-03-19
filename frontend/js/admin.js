function showAddUser() {
    document.getElementById('add-user').classList.add('active');
    document.getElementById('user-list').classList.remove('active');
}

function showUserList() {
    document.getElementById('user-list').classList.add('active');
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
            document.getElementById('add-result').textContent = data.output;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('add-result').textContent = '添加用户失败';
        });
}