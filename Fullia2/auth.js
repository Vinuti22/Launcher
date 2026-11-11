const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const cfg = require('./config');

const sessionFile = () => path.join(app.getPath('userData'), 'session.json');

function saveSession(s) {
  fs.writeFileSync(sessionFile(), JSON.stringify(s, null, 2));
}

function getSession() {
  try {
    return JSON.parse(fs.readFileSync(sessionFile(), 'utf8'));
  } catch {
    return null;
  }
}

function logout() {
  try {
    fs.unlinkSync(sessionFile());
  } catch { /* файла нет — и ладно */ }
}

async function yggdrasilRequest(pathname, body) {
  const res = await fetch(cfg.auth.apiUrl + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.errorMessage || `Ошибка авторизации (HTTP ${res.status})`);
  }
  return data;
}

function toProfile(authData) {
  return {
    access_token: authData.accessToken,
    client_token: authData.clientToken,
    uuid: authData.selectedProfile ? authData.selectedProfile.id : crypto.randomUUID(),
    name: authData.selectedProfile ? authData.selectedProfile.name : authData.username,
    user_properties: '{}',
    meta: { type: 'mojang' },
  };
}

async function login(username, password) {
  if (!username || !password) throw new Error('Введи логин и пароль.');

  // Пока auth-сервер не поднят — тестовый офлайн-вход
  if (cfg.offlineTestMode || !cfg.auth.apiUrl) {
    const profile = {
      access_token: '0',
      client_token: '0',
      uuid: crypto.randomUUID(),
      name: username,
      user_properties: '{}',
      meta: { type: 'mojang' },
      offline: true,
    };
    saveSession(profile);
    return profile;
  }

  // Настоящий Yggdrasil-логин
  const data = await yggdrasilRequest('/authenticate', {
    username,
    password,
    agent: { name: 'Minecraft', version: 1 },
    requestUser: false,
  });
  const profile = toProfile(data);
  saveSession(profile);
  return profile;
}

async function register(username, password) {
  if (!username || !password) throw new Error('Введи логин и пароль.');
  if (cfg.offlineTestMode || !cfg.auth.apiUrl) {
    throw new Error('Регистрация появится, когда поднимешь auth-сервер. Пока просто войди по нику.');
  }

  await yggdrasilRequest(cfg.auth.registerPath, { username, password });
  return login(username, password);
}

module.exports = { login, register, logout, getSession };
