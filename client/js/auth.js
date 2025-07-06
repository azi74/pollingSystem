document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await makeRequest('/auth/login', 'POST', { email, password });
        setToken(response.access_token);
        redirectBasedOnRole();
      } catch (error) {
        console.error('Login failed:', error);
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      
      try {
        await makeRequest('/auth/register', 'POST', { name, email, password, role });
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Registration failed:', error);
      }
    });
  }

  // Check if user is already logged in
  if (getToken()) {
    redirectBasedOnRole();
  }
});