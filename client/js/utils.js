const API_BASE_URL = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function getUserRole() {
  const token = getToken();
  if (!token) return null;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role;
}

function redirectBasedOnRole() {
  const role = getUserRole();
  if (role === 'ADMIN') {
    window.location.href = 'admin.html';
  } else if (role === 'USER') {
    window.location.href = 'user.html';
  } else {
    window.location.href = 'index.html';
  }
}

function handleApiError(error) {
  console.error('API Error:', error);
  if (error.status === 401) {
    clearToken();
    redirectBasedOnRole();
  }
  alert(error.message || 'An error occurred');
}

async function makeRequest(url, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      window.location.href = 'index.html';
    });
  }

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const role = getUserRole();
      window.location.href = role === 'ADMIN' ? 'admin.html' : 'user.html';
    });
  }
});