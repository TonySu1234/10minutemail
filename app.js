const API_BASE = 'https://api.mail.gw';

const $ = sel => document.querySelector(sel);
const generateBtn = $('#generateBtn');
const emailInput = $('#emailInput');
const addressWrap = $('#addressWrap');
const timerEl = $('#timer');
const copyBtn = $('#copyBtn');
const messagesEl = $('#messages');
const messageView = $('#messageView');
const backBtn = $('#backBtn');
const msgSubject = $('#msgSubject');
const msgFrom = $('#msgFrom');
const msgDate = $('#msgDate');
const msgBody = $('#msgBody');

let pollInterval = null;
let countdownInterval = null;
let expiresAt = null;
let currentEmail = null;

function formatTimeLeft(ms) {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2,'0');
  const s = (total % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

async function generateAddress() {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  try {
    // mail.gw flow: GET /domains -> POST /accounts -> POST /token
    const domainsRes = await fetch(`${API_BASE}/domains`);
    const domainsJson = await domainsRes.json();
    const members = domainsJson['hydra:member'] || [];
    if (!members.length) throw new Error('no domains available');
    const domain = members[0].domain;

    // create random username and password
    const username = `tmp${Math.random().toString(36).slice(2,9)}`;
    const address = `${username}@${domain}`;
    const password = Math.random().toString(36).slice(2,12);

    // JavaScript code starts here
    const acctRes = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({address, password})
    });
    if (!acctRes.ok) {
      const txt = await acctRes.text();
      throw new Error('create account failed: ' + txt);
    }

    // get token
    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({address, password})
    });
    if (!tokenRes.ok) throw new Error('token request failed');
    const tokenJson = await tokenRes.json();
    const token = tokenJson.token;

    currentEmail = address;
    emailInput.value = address;
    addressWrap.classList.remove('hidden');
    timerEl.classList.remove('hidden');

    // store token for authenticated requests
    window.__mailgw = {token, account: tokenJson.id};

    // set 10 minutes from now
    const now = Date.now();
    expiresAt = now + 10 * 60 * 1000;
    startCountdown();
    startPolling();
  } catch (err) {
    alert('Failed to generate address');
    console.error(err);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Temporary Address';
  }
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const left = expiresAt - Date.now();
  timerEl.textContent = formatTimeLeft(left);
  if (left <= 0) {
    clearInterval(countdownInterval);
    stopPolling();
    timerEl.textContent = 'Expired';
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  fetchMessages();
  pollInterval = setInterval(fetchMessages, 5000);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}

async function fetchMessages() {
  if (!currentEmail) return;
  try {
    const token = window.__mailgw && window.__mailgw.token;
    if (!token) return;
    const res = await fetch(`${API_BASE}/messages`, {headers: {Authorization: `Bearer ${token}`}});
    if (!res.ok) {
      console.error('messages list failed', res.status);
      return;
    }
    const json = await res.json();
    const msgs = json['hydra:member'] || [];
    renderMessages(msgs);
  } catch (err) {
    console.error('fetchMessages error', err);
  }
}

function renderMessages(msgs) {
  messagesEl.innerHTML = '';
  if (!msgs || msgs.length === 0) {
    messagesEl.innerHTML = '<p class="muted">No messages yet. Waiting for incoming mail…</p>';
    return;
  }
  msgs.slice().reverse().forEach(m => {
    const div = document.createElement('div');
    div.className = 'message';
    const fromAddr = (m.from && (m.from.address || (typeof m.from === 'string' ? m.from : ''))) || '';
    div.innerHTML = `
      <div class="left">
        <div class="sub">${escapeHtml(m.subject || '(no subject)')}</div>
        <div class="muted">From: ${escapeHtml(fromAddr)}</div>
      </div>
      <div>
        <button data-id="${m.id}" class="viewBtn">View</button>
      </div>
    `;
    messagesEl.appendChild(div);
  });
  // attach handlers
  document.querySelectorAll('.viewBtn').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    await openMessage(id);
  }));
}

async function openMessage(id) {
  try {
    const token = window.__mailgw && window.__mailgw.token;
    if (!token) return;
    const res = await fetch(`${API_BASE}/messages/${id}`, {headers: {Authorization: `Bearer ${token}`}});
    if (!res.ok) {
      console.error('message fetch failed', res.status);
      return;
    }
    const msg = await res.json();
    showMessage(msg);
  } catch (err) {
    console.error('openMessage error', err);
  }
}

function showMessage(msg) {
  messageView.classList.remove('hidden');
  msgSubject.textContent = msg.subject || '(no subject)';
  // mail.gw has a `from` object and `createdAt`, `text`, `html` (array)
  const fromAddr = (msg.from && (msg.from.address || msg.from)) || '';
  msgFrom.textContent = fromAddr;
  msgDate.textContent = msg.createdAt || msg.updatedAt || '';
  if (msg.html && Array.isArray(msg.html) && msg.html.length) {
    // prefer the first html block
    msgBody.innerHTML = msg.html[0];
  } else if (msg.text) {
    msgBody.textContent = msg.text;
  } else {
    msgBody.textContent = '(no content)';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
}

// UI handlers
generateBtn.addEventListener('click', () => {
  generateAddress();
});
copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(emailInput.value);
  copyBtn.textContent = 'Copied';
  setTimeout(() => copyBtn.textContent = 'Copy', 1500);
});
backBtn.addEventListener('click', () => {
  messageView.classList.add('hidden');
});

// Expose helpers for testing
window.__tmpmail = {generateAddress, fetchMessages};
