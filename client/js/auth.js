const API_BASE_URL = 'http://localhost:3000'; 

// Use localStorage to persist tokens across page reloads
function setToken(token) {
  localStorage.setItem('authToken', token);
  window.authToken = token; // Keep for backward compatibility
}

function getToken() {
  // Check localStorage first, then fallback to window
  return localStorage.getItem('authToken') || window.authToken || null;
}

function removeToken() {
  localStorage.removeItem('authToken');
  window.authToken = null;
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle 401 errors by clearing token and redirecting
      if (response.status === 401) {
        removeToken();
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

function getUserInfo() {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role
  };
}

function getUserRole() {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.role : null;
}

function redirectBasedOnRole() {
  const userInfo = getUserInfo();
  
  if (!userInfo) {
    window.location.href = 'login.html';
    return;
  }

  switch (userInfo.role) {
    case 'ADMIN':
      window.location.href = 'admin.html';
      break;
    case 'USER':
    default:
      window.location.href = 'user.html';
      break;
  }
}

function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (!decoded) return false;
  
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    removeToken();
    return false;
  }
  
  return true;
}

function checkAuth() {
  const currentPage = window.location.pathname;
  
  // Skip auth check for login/register pages
  if (currentPage.includes('login.html') || 
      currentPage.includes('register.html') || 
      currentPage.includes('index.html')) {
    return true;
  }
  
  if (!isAuthenticated()) {
    alert('Please login to access this page');
    window.location.href = 'login.html';
    return false;
  }
  
  return true;
}

function showLoading(formId) {
  const form = document.getElementById(formId);
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
  }
}

function hideLoading(formId, originalText) {
  const form = document.getElementById(formId);
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function logout() {
  removeToken();
  alert('You have been logged out successfully');
  window.location.href = 'login.html';
}

function protectRoute(allowedRoles = []) {
  if (!isAuthenticated()) {
    alert('Please login to access this page');
    window.location.href = 'login.html';
    return false;
  }
  
  if (allowedRoles.length > 0) {
    const userInfo = getUserInfo();
    if (!userInfo || !allowedRoles.includes(userInfo.role)) {
      alert('You do not have permission to access this page');
      window.location.href = 'login.html';
      return false;
    }
  }
  
  return true;
}

// DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication on page load
  checkAuth();
  
  // Handle login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('Please fill in all fields');
        return;
      }
      
      showLoading('loginForm');
      
      try {
        const response = await makeRequest('/auth/login', 'POST', { email, password });
        setToken(response.access_token);
        alert('Login successful!');
        redirectBasedOnRole();
      } catch (error) {
        console.error('Login failed:', error);
        alert(error.message || 'Login failed. Please check your credentials.');
      } finally {
        hideLoading('loginForm', 'Login');
      }
    });
  }

  // Handle register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
   
      if (!name || !email || !password || !role) {
        alert('Please fill in all fields');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
   
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      
      showLoading('registerForm');
      
      try {
        await makeRequest('/auth/register', 'POST', { name, email, password, role });
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Registration failed:', error);
        alert(error.message || 'Registration failed. Please try again.');
      } finally {
        hideLoading('registerForm', 'Register');
      }
    });
  }

  // Handle logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Handle back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const role = getUserRole();
      window.location.href = role === 'ADMIN' ? 'admin.html' : 'user.html';
    });
  }

  // If already authenticated on login/register pages, redirect
  if (isAuthenticated()) {
    const currentPage = window.location.pathname;
    if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
      redirectBasedOnRole();
    }
  }
});

// Global utilities
window.authUtils = {
  logout,
  protectRoute,
  getUserInfo,
  getUserRole,
  isAuthenticated,
  makeRequest,
  getToken,
  setToken,
  removeToken
};