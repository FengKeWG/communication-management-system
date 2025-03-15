function showAddClient() {
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-list').classList.remove('active');
}

function showClientList() {
    // 获取添加客户端的容器元素
    document.getElementById('add-client').classList.remove('active');
    // 获取客户端列表的容器元素
    document.getElementById('client-list').classList.add('active');
    // 使用 fetch API 发送 GET 请求到 /api/list_clients 路由，获取客户端列表
    fetch('/api/list_clients')
        // 当响应成功时，将响应体解析为 JSON
        .then(response => response.json())
        // 当 JSON 解析成功时，将客户端列表数据展示在页面上
        .then(data => {
            // 将后端返回的客户端列表数据设置到 list-result 元素的文本内容中
            document.getElementById('list-result').textContent = data.output;
        })
        .catch(error => {
            // 在控制台输出错误信息
            console.error('Error:', error);
            document.getElementById('list-result').textContent = '获取客户列表失败';
        });
}

// getElementById('client-form') 尝试获取 HTML 文档中 id 属性值为 "client-form" 的元素
// .addEventListener() 给 HTML 元素添加事件监听器
// 'submit' 监听的是 submit 事件
// function (e) { ... } 当 submit 事件被触发时，这个函数会被执行
document.getElementById('client-form').addEventListener('submit', function (e) {
    // 阻止表单的默认提交行为，防止页面刷新
    e.preventDefault();
    // 获取表单元素
    const formData = new FormData(this); // 'this' 指向当前表单元素
    // 获取用于显示添加结果的元素
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