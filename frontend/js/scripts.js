function showAddClient() {
    document.getElementById('add-client').classList.add('active');
    document.getElementById('client-list').classList.remove('active');
}

function logout() {
    sessionStorage.clear();
    window.location.href = "/";
}