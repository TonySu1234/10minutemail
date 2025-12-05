const API_BASE = 'https://www.1secmail.com/api/v1/';

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
    // 1secmail supports action=genRandomMailbox
    const res = await fetch(`${API_BASE}?action=genRandomMailbox&count=1`);
    const data = await res.json();
    // returns ["xxxxx@1secmail.com"]
    const email = data[0];
    currentEmail = email;
    emailInput.value = email;
    addressWrap.classList.remove('hidden');
    timerEl.classList.remove('hidden');

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
  const [login, domain] = currentEmail.split('@');
  try {
    const res = await fetch(`${API_BASE}?action=getMessages&login=${login}&domain=${domain}`);
    const msgs = await res.json();
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
    div.innerHTML = `
      <div class="left">
        <div class="sub">${escapeHtml(m.subject || '(no subject)')}</div>
        <div class="muted">From: ${escapeHtml(m.from)}</div>
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
  const [login, domain] = currentEmail.split('@');
  try {
    const res = await fetch(`${API_BASE}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
    const msg = await res.json();
    showMessage(msg);
  } catch (err) {
    console.error('openMessage error', err);
  }
}

function showMessage(msg) {
  messageView.classList.remove('hidden');
  msgSubject.textContent = msg.subject || '(no subject)';
  msgFrom.textContent = msg.from || '';
  msgDate.textContent = msg.date || '';
  // 1secmail returns textBody/htmlBody
  msgBody.innerHTML = msg.htmlBody || escapeHtml(msg.textBody || '(no content)');
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
