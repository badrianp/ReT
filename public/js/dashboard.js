document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authModal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const welcomeMessage = document.getElementById('userGreeting');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  const storedUsername = localStorage.getItem('username');
  storedUsername ? showLogoutButton(storedUsername) : showLoginButton();

  function showLoginButton() {
    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    loginBtn.onclick = () => {
      authModal.classList.remove('hidden');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    };
  }

  function showLogoutButton(username) {
    welcomeMessage.textContent = `Hello, ${username}`;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    logoutBtn.onclick = async () => {
      await fetch('/logout');
      localStorage.removeItem('username');
      location.reload();
    };
  }

  document.getElementById('closeModal').onclick = () => {
    authModal.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
  };

  document.getElementById('switchToRegister').onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  };

  document.getElementById('switchToLogin').onclick = (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/login', {
      method: 'POST',
      body: new URLSearchParams(new FormData(loginForm))
    });
    if (!res.ok) loginError.textContent = 'Wrong username or password';
    else {
      const data = await res.json();
      localStorage.setItem('username', data.username);
      authModal.classList.add('hidden');
      loginError.textContent = '';
      showLogoutButton(data.username);
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const body = new URLSearchParams({
      username: formData.get('newUsername'),
      password: formData.get('newPassword')
    });
    const res = await fetch('/register', { method: 'POST', body });
    if (!res.ok) registerError.textContent = 'Username already taken or invalid';
    else {
      const data = await res.json();
      localStorage.setItem('username', data.username);
      authModal.classList.add('hidden');
      registerError.textContent = '';
      showLogoutButton(data.username);
    }
  };

  function getHostname(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  function getFaviconUrl(link) {
    const domain = getHostname(link);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  }

  function timeSince(dateString) {
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now - then) / 1000);
    const intervals = [
      { label: 'y', seconds: 31536000 },
      { label: 'mo', seconds: 2592000 },
      { label: 'd', seconds: 86400 },
      { label: 'h', seconds: 3600 },
      { label: 'm', seconds: 60 }
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count}${i.label}`;
    }
    return 'just now';
  }

  async function loadTopicFeeds() {
    try {
      const res = await fetch('/rss-categories');
      if (!res.ok) throw new Error('RSS fetch failed');

      const topics = await res.json();
      const container = document.getElementById('topicsContainer');
      container.innerHTML = '';

      topics.forEach(topic => {
        const section = document.createElement('section');
        section.className = 'topic__card';

        const header = document.createElement('div');
        header.classList.add('topic__header');

        const logo = document.createElement('img');
        logo.classList.add('rss__favicon');
        logo.src = getFaviconUrl(topic.items[0]?.url);
        logo.alt = 'favicon';
        const title = document.createElement('h3');
        title.innerText = topic.title;
        title.className = 'topic__title';
        header.appendChild(logo);
        header.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'topic__list';

        topic.items.slice(0, 8).forEach(item => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          li.classList.add("rss__group")
          a.href = item.url;
          a.textContent = item.title;
          a.target = '_blank';
          a.className = 'rss__link';

          const timeElement = document.createElement('span');
          timeElement.classList.add("rss__time");
          timeElement.innerHTML = timeSince(item.pubDate || item.isoDate || '');

          a.onclick = (e) => {
            e.preventDefault();
            const modal = document.getElementById('rssModal');
            const modalBody = document.getElementById('rssModalBody');
            const modalTitle = document.getElementById('rssModalTitle');
            modalBody.innerHTML = item.content || '<p>No preview available.</p>';
            modalTitle.innerText = item.title;
            modalTitle.href = item.url;
            modalTitle.target = '_blank';
            modalTitle.rel = 'noopener noreferrer';
            modal.classList.remove('hidden');
          };

          li.appendChild(a);
          li.appendChild(timeElement);
          list.appendChild(li);
        });

        section.appendChild(header);
        section.appendChild(list);
        container.appendChild(section);
      });
    } catch (err) {
      console.error('Error loading topics:', err);
    }
  }

  loadTopicFeeds();

  document.getElementById('closeRssModal').onclick = () => {
    document.getElementById('rssModal').classList.add('hidden');
  };

  document.getElementById('rssModal').onclick = () => {
    document.getElementById('rssModal').classList.add('hidden');
  };

  // === Custom RSS ===
  const customForm = document.getElementById('customRssForm');
  const customInput = document.getElementById('customRssInput');
  const customList = document.getElementById('customRssList');

  customForm.onsubmit = async (e) => {
    e.preventDefault();
    const url = customInput.value.trim();
    const res = await fetch('/custom-rss', {
      method: 'POST',
      body: new URLSearchParams({ url }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    customList.innerHTML = '';
    if (!res.ok) {
      const li = document.createElement('li');
      li.textContent = 'Could not load feed.';
      customList.appendChild(li);
      return;
    }

    const items = await res.json();
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'rss__item';

      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      a.target = '_blank';
      a.className = 'rss__link';

      a.onclick = (e) => {
        e.preventDefault();
        const modal = document.getElementById('rssModal');
        const modalBody = document.getElementById('rssModalBody');
        modalBody.innerHTML = item.content || '<p>No preview available.</p>';
        modal.classList.remove('hidden');
      };

      li.appendChild(a);
      customList.appendChild(li);
    });
  };
});