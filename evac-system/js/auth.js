'use strict';

const AUTH_SESSION_KEY = 'evachub-session';
const AUTH_REMEMBER_KEY = 'evachub-remember';
const AUTH_USERS_KEY = 'evachub-users';

/** Demo accounts aligned with ICS roles at LGU level */
const DEMO_ACCOUNTS = [
  {
    id: 'usr-001',
    username: 'ldrrmo',
    password: 'ldrrmo123',
    name: 'Engr. Roberto Cruz',
    role: 'ldrrmo',
    roleLabel: 'LDRRMO Officer',
    email: 'ldrrmo@municipality.gov.ph',
    office: 'Local DRRM Office',
    centerId: null,
  },
  {
    id: 'usr-002',
    username: 'coordinator1',
    password: 'coord123',
    name: 'Maria Santos',
    role: 'coordinator',
    roleLabel: 'Evacuation Center Coordinator',
    email: 'maria.santos@barangay.gov.ph',
    office: 'Barangay San Jose',
    centerId: 'EC-001',
  },
  {
    id: 'usr-003',
    username: 'coordinator2',
    password: 'coord123',
    name: 'Ana Villanueva',
    role: 'coordinator',
    roleLabel: 'Evacuation Center Coordinator',
    email: 'ana.villanueva@barangay.gov.ph',
    office: 'Barangay Sta. Cruz',
    centerId: 'EC-003',
  },
  {
    id: 'usr-004',
    username: 'campmgr',
    password: 'camp123',
    name: 'Juan Reyes',
    role: 'camp_manager',
    roleLabel: 'Camp Management Personnel',
    email: 'juan.reyes@municipality.gov.ph',
    office: 'Municipal Gymnasium',
    centerId: 'EC-002',
  },
];

export function isLDRRMO(session) {
  return session?.role === 'ldrrmo';
}

export function canManageAllCenters(session) {
  return isLDRRMO(session);
}

export function getAssignedCenterId(session) {
  return session?.centerId || null;
}

function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function simpleHash(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function hashPassword(password, salt) {
  const payload = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return simpleHash(payload);
}

async function verifyPassword(password, salt, expectedHash) {
  const hash = await hashPassword(password, salt);
  return hash === expectedHash;
}

function loadRegisteredUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function findDemoAccount(username) {
  const normalized = username.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.username.toLowerCase() === normalized);
}

function findRegisteredUser(username) {
  const normalized = username.trim().toLowerCase();
  return loadRegisteredUsers().find((u) => u.username.toLowerCase() === normalized);
}

function findAccount(username) {
  return findDemoAccount(username) || findRegisteredUser(username);
}

function toSessionUser(account) {
  return {
    id: account.id,
    username: account.username,
    name: account.name,
    role: account.role,
    roleLabel: account.roleLabel,
    email: account.email || '',
    office: account.office || '',
    centerId: account.centerId ?? null,
  };
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.userId || !session?.username) {
      clearSession();
      return null;
    }
    if (!findAccount(session.username)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

function saveSession(user, remember) {
  const session = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    roleLabel: user.roleLabel,
    email: user.email,
    office: user.office,
    centerId: user.centerId,
    loggedInAt: new Date().toISOString(),
  };

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  if (remember) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_REMEMBER_KEY, '1');
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
  }

  return session;
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);
}

async function authenticate(username, password) {
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();

  if (!trimmedUser || !trimmedPass) {
    return { ok: false, error: 'Enter both username and password.' };
  }

  const demo = findDemoAccount(trimmedUser);
  if (demo) {
    if (demo.password !== trimmedPass) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    return { ok: true, user: toSessionUser(demo) };
  }

  const registered = findRegisteredUser(trimmedUser);
  if (!registered) {
    return { ok: false, error: 'Invalid username or password.' };
  }

  const valid = await verifyPassword(trimmedPass, registered.salt, registered.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Invalid username or password.' };
  }

  return { ok: true, user: toSessionUser(registered) };
}

async function register(username, password) {
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();

  if (trimmedUser.length < 2) {
    return { ok: false, error: 'Username must be at least 2 characters.' };
  }
  if (trimmedPass.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }
  if (findAccount(trimmedUser)) {
    return { ok: false, error: 'That username is already taken.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(trimmedPass, salt);
  const user = {
    id: `usr-${crypto.randomUUID()}`,
    username: trimmedUser,
    passwordHash,
    salt,
    name: trimmedUser,
    role: 'coordinator',
    roleLabel: 'Evacuation Center Coordinator',
    email: '',
    office: '',
    centerId: null,
    createdAt: new Date().toISOString(),
  };

  const users = loadRegisteredUsers();
  users.push(user);
  saveRegisteredUsers(users);

  return { ok: true, user: toSessionUser(user) };
}

export function updateUserUI(session) {
  if (!session) return;

  document.querySelectorAll('[data-user-name]').forEach((el) => {
    el.textContent = session.name;
  });

  document.querySelectorAll('[data-user-role]').forEach((el) => {
    el.textContent = session.roleLabel;
  });

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=1e40af&color=fff`;
  document.querySelectorAll('[data-user-avatar]').forEach((el) => {
    el.src = avatarUrl;
    el.alt = session.name;
  });

  const roleEl = document.getElementById('settingsRole');
  const emailEl = document.getElementById('settingsEmail');
  const officeEl = document.getElementById('settingsOffice');
  if (roleEl) roleEl.textContent = session.roleLabel;
  if (emailEl) emailEl.textContent = session.email;
  if (officeEl) officeEl.textContent = session.office;
}

export function applyRoleVisibility(session) {
  const isAdmin = isLDRRMO(session);
  document.querySelectorAll('[data-ldrrmo-only]').forEach((el) => {
    el.hidden = !isAdmin;
  });
  document.querySelectorAll('[data-field-only]').forEach((el) => {
    el.hidden = isAdmin;
  });
}

export function initLogin(onSuccess) {
  const loginScreen = document.getElementById('loginScreen');
  const appRoot = document.getElementById('appRoot');
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPassword');
  const rememberCheckbox = document.getElementById('loginRemember');
  const rememberRow = document.getElementById('loginRememberRow');
  const usernameInput = document.getElementById('loginUsername');
  const submitBtn = document.getElementById('loginSubmit');
  const loginTabs = document.querySelectorAll('.login-tab');

  if (!loginScreen || !appRoot || !form || !errorEl || !passwordInput || !usernameInput) {
    console.error('Login UI elements missing');
    return { showLogin() {}, logout() {} };
  }

  let loginMode = 'login';

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function setLoginMode(mode) {
    loginMode = mode;
    loginTabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    if (rememberRow) rememberRow.hidden = mode !== 'login';
    passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    if (submitBtn) {
      submitBtn.innerHTML =
        mode === 'login'
          ? '<i class="bi bi-box-arrow-in-right"></i> Sign In'
          : '<i class="bi bi-person-plus"></i> Create Account';
    }
    showError('');
  }

  function showLogin() {
    loginScreen.hidden = false;
    appRoot.hidden = true;
    document.body.classList.remove('app-active');
  }

  function showApp(session) {
    loginScreen.hidden = true;
    appRoot.hidden = false;
    document.body.classList.add('app-active');
    updateUserUI(session);
    applyRoleVisibility(session);
    try {
      if (onSuccess) onSuccess(session);
    } catch (err) {
      console.error('Dashboard failed to load:', err);
      clearSession();
      showLogin();
      showError('Dashboard failed to load. Please refresh and try again.');
    }
  }

  async function attemptLogin(username, password, remember) {
    const result = await authenticate(username, password);
    if (!result.ok) {
      showError(result.error);
      return false;
    }
    const session = saveSession(result.user, remember);
    showError('');
    showApp(session);
    return true;
  }

  async function attemptRegister(username, password) {
    const result = await register(username, password);
    if (!result.ok) {
      showError(result.error);
      return false;
    }
    const session = saveSession(result.user, true);
    showError('');
    showApp(session);
    return true;
  }

  function logout() {
    clearSession();
    usernameInput.value = '';
    passwordInput.value = '';
    if (rememberCheckbox) rememberCheckbox.checked = false;
    setLoginMode('login');
    showLogin();
    showError('');
  }

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      const icon = togglePassword.querySelector('i');
      if (icon) icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  }

  loginTabs.forEach((tab) => {
    tab.addEventListener('click', () => setLoginMode(tab.dataset.mode || 'login'));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const username = usernameInput.value;
      const password = passwordInput.value;
      if (loginMode === 'login') {
        await attemptLogin(
          username,
          password,
          rememberCheckbox ? rememberCheckbox.checked : false
        );
      } else {
        await attemptRegister(username, password);
      }
    } catch (err) {
      console.error('Auth failed:', err);
      showError('Sign-in failed. Use a local server (not file://) and try again.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  if (rememberCheckbox && localStorage.getItem(AUTH_REMEMBER_KEY)) {
    rememberCheckbox.checked = true;
    const session = loadSession();
    if (session) usernameInput.value = session.username;
  }

  setLoginMode('login');

  const existing = loadSession();
  if (existing) {
    showApp(existing);
  } else {
    showLogin();
  }

  return { showLogin, logout, attemptLogin, getSession: loadSession };
}
