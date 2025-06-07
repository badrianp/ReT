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

  if (storedUsername) {
    (async () => {
      const res = await fetch('/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: storedUsername })
      });
  
      const data = await res.json();
      if (!data.exists) {
        localStorage.removeItem('username');
        location.reload();
      } else {
        showLogoutButton(storedUsername);
      }
    })();
  } else {
    showLoginButton();
  }

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
    localStorage.removeItem('openAddFeedAfterLogin');
    authModal.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
  };

  document.getElementById('authModal').onclick = (e) => {
    if (e.target === e.currentTarget) {
      localStorage.removeItem('openAddFeedAfterLogin');
      e.currentTarget.classList.add('hidden');
      loginError.textContent = '';
      registerError.textContent = '';
    }
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

  // === login user ===
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
      location.reload();
    }
  };

  // === register user ===
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
      location.reload();
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

  // === load cards ===
  async function loadTopicFeeds() {
    try {
      const res = await fetch('/rss-categories');
      if (!res.ok) throw new Error('RSS fetch failed');
  
      const topics = await res.json();
      const container = document.getElementById('topicsContainer');
  
      for (const topic of topics) {
        const section = document.createElement('div');
        section.className = 'topic__card';
  
        const header = document.createElement('div');
        header.classList.add('topic__header');
  
        const logo = new Image();
        logo.classList.add('rss__favicon');
        logo.alt = 'favicon';
        logo.src = getFaviconUrl(topic.items[0]?.url);
        logo.onerror = () => {
          logo.onerror = null;
          logo.src = '/public/img/default-favicon.png';
        };
  
        const title = document.createElement('h3');
        title.innerText = topic.title;
        title.className = 'topic__title';
  
        header.appendChild(logo);
        header.appendChild(title);

        if (topic.added_by === storedUsername || storedUsername === 'admin') {
          const deleteBtn = document.createElement('span');
          deleteBtn.textContent = '🗑';
          deleteBtn.className = 'topic__delete';
          deleteBtn.onclick = async () => {
            const confirmDelete = confirm(`Delete feed "${topic.title}"?`);
            if (confirmDelete) {
              const res = await fetch('/delete-feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ id: topic.id, username: storedUsername })
              });
              if (res.ok) location.reload();
              else alert('Delete failed');
            }
          };
          header.appendChild(deleteBtn);
        }

        const list = document.createElement('ul');
        list.className = 'topic__list';
  
        for (const item of topic.items.slice(0, 8)) {
          const li = document.createElement('li');
          li.classList.add("rss__group");
  
          const a = document.createElement('a');
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
        }
  
        section.appendChild(header);
        section.appendChild(list);

        const likeBtn = document.createElement('span');
        likeBtn.className = 'topic__like';
        likeBtn.style.cursor = 'pointer';

        likeBtn.innerHTML = `
          <svg class="like-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.8 4.6c-1.6-1.6-4.3-1.6-5.9 0L12 7.5l-2.9-2.9c-1.6-1.6-4.3-1.6-5.9 0s-1.6 4.3 0 5.9l8.8 8.8 8.8-8.8c1.6-1.6 1.6-4.3 0-5.9z" />
          </svg>
        `;

        let liked = false;
        const svgIcon = likeBtn.querySelector('svg');

        if (storedUsername) {
          const res = await fetch('/check-topic-like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: storedUsername, topicId: topic.id })
          });
          liked = (await res.json()).liked;
          svgIcon.classList.toggle('filled', liked);
        }

        const likeCount = document.createElement('span');
        likeCount.className = 'like-count';
        likeCount.innerText = topic.likesCount;

        likeBtn.onclick = async () => {
          if (!storedUsername) return loginBtn.click();

          const endpoint = liked ? '/unlike-topic' : '/like-topic';
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: storedUsername, topicId: topic.id })
          });

          liked = !liked;
          svgIcon.classList.toggle('filled', liked);
          likeCount.textContent = parseInt(likeCount.textContent) + (liked ? 1 : -1);
        };

        const likesDiv = document.createElement('div');
        likesDiv.classList.add('like-wrapper');
        likesDiv.appendChild(likeBtn);
        likesDiv.appendChild(likeCount);

        section.appendChild(likesDiv);
        container.appendChild(section);
        // await new Promise(r => setTimeout(r, 30));
      }
    } catch (err) {
      console.error('Error loading topics:', err);
    }
  }

  loadTopicFeeds();

  document.getElementById('closeRssModal').onclick = () => {
    document.getElementById('rssModal').classList.add('hidden');
  };

  document.getElementById('rssModal').onclick = (e) => {
    if (e.target == e.currentTarget)
      document.getElementById('rssModal').classList.add('hidden');
  };

  // === feed upload form ===
  const addFeedCard = document.getElementById('addFeedCard');

  addFeedCard.onclick = () => {
    if (storedUsername) {
      document.getElementById('addFeedModal').classList.remove('hidden');
    } else {
      localStorage.setItem('openAddFeedAfterLogin', 'true');
      loginBtn.click();
    }
  };

  document.getElementById('closeAddFeed').onclick = () => {
    document.getElementById('addFeedModalError').textContent = '';
    document.getElementById('addFeedModal').classList.add('hidden');
  };
  
  document.getElementById('addFeedModal').onclick = (e) => {
    if (e.target == e.currentTarget) {
      document.getElementById('addFeedModalError').textContent = '';
      document.getElementById('addFeedModal').classList.add('hidden');
    }
  };
  
  // === add feed form ===
  document.getElementById('addFeedFormModal').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('modalFeedTitle').value.trim();
    const url = document.getElementById('modalFeedUrl').value.trim();
    const error = document.getElementById('addFeedModalError');
  
    if (!title || !url) {
      error.textContent = 'Please enter both title and URL.';
      return;
    }
  
    const res = await fetch('/add-feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title, url, username: storedUsername })
    });
  
    if (!res.ok) {
      const data = await res.json();
      error.textContent = data.error || 'Failed to add feed.';
    } else {
      error.textContent = '';
      location.reload();
    }
  };

  // === when add feed was intended before login/register===
  if (localStorage.getItem('openAddFeedAfterLogin') === 'true') {
    localStorage.removeItem('openAddFeedAfterLogin');
    if (storedUsername) {
      document.getElementById('addFeedModal').classList.remove('hidden');
    }
  }
});