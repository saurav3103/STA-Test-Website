document.addEventListener('DOMContentLoaded', function () {
  const userTable = document.getElementById('user-table');
  const emptyState = document.getElementById('empty-state');

  // Fetch teachers and students from App's storage
  const teachers = JSON.parse(localStorage.getItem('et_teachers')) || {};
  const students = JSON.parse(localStorage.getItem('et_students')) || {};

  // Convert to array and combine
  const teacherArray = Object.entries(teachers).map(([email, data]) => ({
    email,
    name: data.name,
    role: 'teacher',
  }));

  const studentArray = Object.entries(students).map(([email, data]) => ({
    email,
    name: data.name,
    role: 'student',
  }));

  const allUsers = [...teacherArray, ...studentArray];

  if (allUsers.length === 0) {
    emptyState.style.display = 'block';
    userTable.parentElement.style.display = 'none';
    return;
  }

  // Populate the table
  allUsers.forEach((user) => {
    const row = document.createElement('tr');
    const roleClass = user.role === 'teacher' ? 'teacher' : 'student';
    const roleText = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    
    row.innerHTML = `
      <td>${user.email}</td>
      <td><span class="role-badge ${roleClass}">${roleText}</span></td>
      <td><button class="btn-delete" onclick="deleteUser('${user.email}', '${user.role}')">DELETE</button></td>
    `;
    userTable.appendChild(row);
  });
});

function deleteUser(email, role) {
  if (confirm(`Are you sure you want to delete ${email}?`)) {
    if (role === 'teacher') {
      const teachers = JSON.parse(localStorage.getItem('et_teachers')) || {};
      delete teachers[email];
      localStorage.setItem('et_teachers', JSON.stringify(teachers));
    } else {
      const students = JSON.parse(localStorage.getItem('et_students')) || {};
      delete students[email];
      localStorage.setItem('et_students', JSON.stringify(students));
    }
    location.reload();
  }
}