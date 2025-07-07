document.addEventListener('DOMContentLoaded', async () => {
  // Admin page functionality
  if (window.location.pathname.includes('admin.html')) {
    await loadAdminPolls();
    setupPollModal();
  }
  
  // User page functionality
  if (window.location.pathname.includes('user.html')) {
    await loadUserPolls();
  }
  
  // Poll detail page functionality
  if (window.location.pathname.includes('poll-detail.html')) {
    await loadPollDetails();
  }
});

async function loadAdminPolls() {
  try {
    const polls = await window.authUtils.makeRequest('/polls');
    const pollsList = document.getElementById('pollsList');
    pollsList.innerHTML = '';
    
    polls.forEach(poll => {
      const pollElement = document.createElement('div');
      pollElement.className = 'poll-card';
      
      const status = new Date(poll.expiresAt) > new Date() ? 
        '<span class="poll-status active">Active</span>' : 
        '<span class="poll-status expired">Expired</span>';
      
      pollElement.innerHTML = `
        <h3>${poll.title}</h3>
        ${poll.description ? `<p>${poll.description}</p>` : ''}
        <p>Options: ${poll.options.join(', ')}</p>
        <p>Visibility: ${poll.isPublic ? 'Public' : 'Private'}</p>
        <p>Expires: ${new Date(poll.expiresAt).toLocaleString()}</p>
        ${status}
        <button onclick="viewPollDetails(${poll.id})">View Details</button>
        <button onclick="editPoll(${poll.id})" ${new Date(poll.expiresAt) < new Date() ? 'disabled' : ''}>Edit</button>
        <button onclick="deletePoll(${poll.id})">Delete</button>
      `;
      
      pollsList.appendChild(pollElement);
    });
  } catch (error) {
    console.error('Failed to load polls:', error);
  }
}

async function loadUserPolls() {
  try {
    const polls = await window.authUtils.makeRequest('/polls');
    const pollsList = document.getElementById('pollsList');
    pollsList.innerHTML = '';
    
    polls.forEach(poll => {
      const pollElement = document.createElement('div');
      pollElement.className = 'poll-card';
      
      const status = new Date(poll.expiresAt) > new Date() ? 
        '<span class="poll-status active">Active</span>' : 
        '<span class="poll-status expired">Expired</span>';
      
      pollElement.innerHTML = `
        <h3>${poll.title}</h3>
        ${poll.description ? `<p>${poll.description}</p>` : ''}
        <p>Options: ${poll.options.join(', ')}</p>
        <p>Expires: ${new Date(poll.expiresAt).toLocaleString()}</p>
        ${status}
        <button onclick="viewPollDetails(${poll.id})">View Details</button>
      `;
      
      pollsList.appendChild(pollElement);
    });
  } catch (error) {
    console.error('Failed to load polls:', error);
  }
}

function setupPollModal() {
  const modal = document.getElementById('createPollModal');
  const btn = document.getElementById('createPollBtn');
  const span = document.getElementsByClassName('close')[0];
  const visibilitySelect = document.getElementById('pollVisibility');
  const allowedUsersGroup = document.getElementById('allowedUsersGroup');

  btn.onclick = function() {
    modal.style.display = 'block';
  };

  span.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  visibilitySelect.addEventListener('change', function() {
    allowedUsersGroup.style.display = this.value === 'false' ? 'block' : 'none';
  });

  const createPollForm = document.getElementById('createPollForm');
  createPollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('pollTitle').value;
    const description = document.getElementById('pollDescription').value;
    const options = document.getElementById('pollOptions').value.split(',').map(opt => opt.trim());
    const isPublic = document.getElementById('pollVisibility').value === 'true';
    const allowedUsers = document.getElementById('allowedUsers').value;
    const duration = parseInt(document.getElementById('pollDuration').value);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    try {
      const pollData = {
        title,
        description,
        options,
        isPublic,
        expiresAt,
        allowedUserIds: isPublic ? [] : allowedUsers.split(',').map(id => parseInt(id.trim()))
      };
      
      await window.authUtils.makeRequest('/polls', 'POST', pollData);
      modal.style.display = 'none';
      createPollForm.reset();
      await loadAdminPolls();
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  });
}

async function loadPollDetails() {
  const pollId = new URLSearchParams(window.location.search).get('id');
  if (!pollId) {
    window.location.href = window.authUtils.getUserRole() === 'ADMIN' ? 'admin.html' : 'user.html';
    return;
  }
  
  try {
    const response = await window.authUtils.makeRequest(`/polls/${pollId}/results`);
    const { poll, results } = response;
    
    const pollDetails = document.getElementById('pollDetails');
    pollDetails.innerHTML = `
      <h2>${poll.title}</h2>
      ${poll.description ? `<p>${poll.description}</p>` : ''}
      <p>Options: ${poll.options.join(', ')}</p>
      <p>Status: ${new Date(poll.expiresAt) > new Date() ? 'Active' : 'Expired'}</p>
      <p>Expires: ${new Date(poll.expiresAt).toLocaleString()}</p>
    `;
    
    const voteSection = document.getElementById('voteSection');
    if (new Date(poll.expiresAt) > new Date()) {
      voteSection.innerHTML = `
        <h3>Vote</h3>
        <form id="voteForm">
          <select id="voteOption">
            ${poll.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
          <button type="submit">Submit Vote</button>
        </form>
      `;
      
      document.getElementById('voteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const option = document.getElementById('voteOption').value;
        try {
          await window.authUtils.makeRequest(`/polls/${pollId}/vote`, 'POST', { option });
          alert('Vote submitted successfully!');
          await loadPollDetails();
        } catch (error) {
          console.error('Failed to submit vote:', error);
        }
      });
    } else {
      voteSection.innerHTML = '<p>This poll has expired. Voting is closed.</p>';
    }
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = `
      <h3>Results</h3>
      <div class="results-chart">
        ${results.map(result => `
          <div>
            <p>${result.option}: ${result.count} votes</p>
            <div class="chart-bar" style="width: ${(result.count / Math.max(1, results.reduce((sum, r) => sum + r.count, 0)) * 100)}%">
              ${result.count}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load poll details:', error);
    window.location.href = window.authUtils.getUserRole() === 'ADMIN' ? 'admin.html' : 'user.html';
  }
}

// Global functions for button clicks
function viewPollDetails(pollId) {
  window.location.href = `poll-detail.html?id=${pollId}`;
}

async function editPoll(pollId) {
  try {
    const poll = await window.authUtils.makeRequest(`/polls/${pollId}`);
    
    const modal = document.getElementById('createPollModal');
    const modalTitle = modal.querySelector('h2');
    const form = document.getElementById('createPollForm');
    
    modalTitle.textContent = 'Edit Poll';
    document.getElementById('pollTitle').value = poll.title;
    document.getElementById('pollDescription').value = poll.description || '';
    document.getElementById('pollOptions').value = poll.options.join(', ');
    document.getElementById('pollVisibility').value = poll.isPublic ? 'true' : 'false';
    document.getElementById('allowedUsers').value = poll.allowedUsers?.map(u => u.id).join(', ') || '';
    document.getElementById('pollDuration').value = Math.floor((new Date(poll.expiresAt) - new Date()) / (60 * 1000));
    
    modal.style.display = 'block';
    
    // Change form submission to update instead of create
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('pollTitle').value;
      const description = document.getElementById('pollDescription').value;
      const options = document.getElementById('pollOptions').value.split(',').map(opt => opt.trim());
      const isPublic = document.getElementById('pollVisibility').value === 'true';
      const allowedUsers = document.getElementById('allowedUsers').value;
      const duration = parseInt(document.getElementById('pollDuration').value);
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      try {
        await window.authUtils.makeRequest(`/polls/${pollId}`, 'PUT', {
          title,
          description,
          options,
          isPublic,
          expiresAt,
          allowedUserIds: isPublic ? [] : allowedUsers.split(',').map(id => parseInt(id.trim()))
        });
        
        modal.style.display = 'none';
        form.reset();
        form.onsubmit = null;
        await loadAdminPolls();
      } catch (error) {
        console.error('Failed to update poll:', error);
      }
    };
  } catch (error) {
    console.error('Failed to fetch poll for editing:', error);
  }
}

async function deletePoll(pollId) {
  if (!confirm('Are you sure you want to delete this poll?')) return;
  
  try {
    await window.authUtils.makeRequest(`/polls/${pollId}`, 'DELETE');
    await loadAdminPolls();
  } catch (error) {
    console.error('Failed to delete poll:', error);
  }
}