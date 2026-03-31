document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  // Try teacher login first
  let session = App.loginTeacher(email, password);
  
  if (session) {
    showMessage(`Login successful! Redirecting...`, 'success');
    setTimeout(() => {
      window.location.href = 'teacher.html';
    }, 1500);
    return;
  }

  // Try student login
  session = App.loginStudent(email, password);
  
  if (session) {
    showMessage(`Login successful! Redirecting...`, 'success');
    setTimeout(() => {
      window.location.href = 'student.html';
    }, 1500);
    return;
  }

  // Login failed
  showMessage('Invalid email or password', 'error');
});

function showMessage(text, type) {
  const container = document.getElementById('message-container');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  container.innerHTML = '';
  container.appendChild(message);
}