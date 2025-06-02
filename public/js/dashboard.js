document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authModal = document.getElementById('authModal');
  const closeModalBtn = document.getElementById('closeModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const welcomeMessage = document.getElementById('userGreeting')

  function showLoginButton() {
    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    loginBtn.addEventListener('click', () => {
      authModal.classList.remove('hidden');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });
  }

  function showLogoutButton(username) {

    welcomeMessage.textContent = `Hello, ${username}`;

    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    logoutBtn.addEventListener('click', async () => {
      await fetch('/logout');
      localStorage.removeItem('username');
      location.reload();
    });
  }

  const storedUsername = localStorage.getItem('username');

  if (storedUsername) {
    showLogoutButton(storedUsername);
  } else {
    showLoginButton();
  }

  closeModalBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
  });

  document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const body = new URLSearchParams(formData);

    const res = await fetch('/login', {
      method: 'POST',
      body
    });

    if (!res.ok) {
      loginError.textContent = 'Wrong username or password';
    } else {
      const data = await res.json();
      localStorage.setItem('username', data.username);
      authModal.classList.add('hidden');
      loginError.textContent = '';
      showLogoutButton(data.username);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const body = new URLSearchParams();
    body.append('username', formData.get('newUsername'));
    body.append('password', formData.get('newPassword'));

    const res = await fetch('/register', {
      method: 'POST',
      body
    });

    if (!res.ok) {
      registerError.textContent = 'Username already taken or invalid';
    } else {
      const data = await res.json();
      localStorage.setItem('username', data.username);
      authModal.classList.add('hidden');
      registerError.textContent = '';
      showLogoutButton(data.username);
    }
  });

  async function loadRssFeed() {
    try {
      const res = await fetch('/rss');
      if (!res.ok) throw new Error('RSS fetch failed');
  
      const items = await res.json();
      const list = document.getElementById('rssList');
  
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'rss__item';

        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        a.target = '_blank';
        a.className = 'rss__link';

        const desc = document.createElement('p');
        desc.textContent = item.content;
        desc.className = 'rss__desc';

        li.appendChild(a);
        li.appendChild(desc);
        list.appendChild(li);
      });
    } catch (err) {
      console.error('RSS error:', err);
    
      const fallback = document.createElement('a');
      fallback.className = 'rss__fallback';
      fallback.textContent = 'Could not load feed. Try again.';
      fallback.href = "/"
    
      document.getElementById('rssSection').appendChild(fallback);
    }
  }

  loadRssFeed();
});