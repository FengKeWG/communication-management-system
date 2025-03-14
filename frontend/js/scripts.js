function showAddClient() {
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-list').classList.remove('active');
}

function showClientList() {
    document.getElementById('add-client').classList.remove('active');
    document.getElementById('client-list').classList.add('active');
    fetch('/api/list_clients')
        .then(response => response.json())
        .then(data => {
            document.getElementById('list-result').textContent = data.output;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('list-result').textContent = '获取客户列表失败';
        });
}

document.getElementById('client-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    fetch('/api/add_client', {
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
            document.getElementById('add-result').textContent = '添加客户失败';
        });
});