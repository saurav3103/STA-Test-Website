document.getElementById('register-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

  // Validation
  if (!email || !password || !role) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }

  // Use App's registration system
  if (role === 'student') {
    const result = App.registerStudent(email, password, name);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage('Registration successful! Redirecting to login...', 'success');
      document.getElementById('register-form').reset();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  } else if (role === 'teacher') {
    // Register teacher using App's internal system
    const result = App.registerTeacher(email, password, name);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage('Registration successful! Redirecting to login...', 'success');
      document.getElementById('register-form').reset();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  }
});

function showMessage(text, type) {
  const container = document.getElementById('message-container');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  container.innerHTML = '';
  container.appendChild(message);
}