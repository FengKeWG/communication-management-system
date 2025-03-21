function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/index.html';
}