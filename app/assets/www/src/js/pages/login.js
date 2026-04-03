document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  const session = App.loginAccount(email, password);

  if (session) {
    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = session.role === 'teacher' ? 'teacher.html' : 'student.html';
    }, 1200);
    return;
  }

  // Login failed
  showMessage('Invalid credentials', 'error');
});

function showMessage(text, type) {
  const container = document.getElementById('message-container');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  container.innerHTML = '';
  container.appendChild(message);
}