document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  if (!email || !password || !role) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  const session = role === 'teacher'
    ? App.loginTeacher(email, password)
    : App.loginStudent(email, password);

  if (session) {
    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = role === 'teacher' ? 'teacher.html' : 'student.html';
    }, 1200);
    return;
  }

  // Login failed
  showMessage(`Invalid ${role} credentials`, 'error');
});

function showMessage(text, type) {
  const container = document.getElementById('message-container');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  container.innerHTML = '';
  container.appendChild(message);
}