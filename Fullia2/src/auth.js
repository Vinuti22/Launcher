const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const cfg = require('./config');
const discord = require('./discord');

const file = (n) => path.join(app.getPath('userData'), n);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2));
const key = (n) => n.toLowerCase();
const accounts = () => readJson(file('accounts.json'), {});
const isOffline = () => cfg.offlineTestMode || !cfg.auth.apiUrl;
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

// Стабильный UUID для офлайн-ника (как у ванильного offline-режима)
function offlineUuid(name) {
  const h = crypto.createHash('md5').update('OfflinePlayer:' + name).digest();
  h[6] = (h[6] & 0x0f) | 0x30; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

// Запись об аккаунте: пароль (локальный режим) + состояние Discord-подтверждения
function upsert(name, patch) {
  const all = accounts();
  const k = key(name);
  all[k] = { name, discord: { verified: false, code: discord.newCode(), id: null, tag: null }, ...all[k], ...patch };
  writeJson(file('accounts.json'), all);
  return all[k];
}

function withDiscord(p) {
  if (!p) return null;
  const a = accounts()[key(p.name)];
  return { ...p, discord: a ? a.discord : { verified: false, code: null } };
}
const rawSession = () => readJson(file('session.json'), null);
const saveSession = (p) => { writeJson(file('session.json'), p); return withDiscord(p); };
const getSession = () => withDiscord(rawSession());
function logout() { try { fs.unlinkSync(file('session.json')); } catch { /* нет файла — ок */ } }

async function yggdrasilRequest(pathname, body) {
  const res = await fetch(cfg.auth.apiUrl + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.errorMessage || `Ошибка авторизации (HTTP ${res.status})`);
  return data;
}

function toProfile(a) {
  return {
    access_token: a.accessToken,
    client_token: a.clientToken,
    uuid: a.selectedProfile ? a.selectedProfile.id : crypto.randomUUID(),
    name: a.selectedProfile ? a.selectedProfile.name : a.username,
    user_properties: '{}',
    meta: { type: 'mojang' },
  };
}

async function login(username, password) {
  username = (username || '').trim();
  if (!username || !password) throw new Error('Введи ник и пароль.');
  let profile;
  if (isOffline()) {
    const acc = accounts()[key(username)];
    if (!acc || !acc.hash || acc.hash !== hash(password, acc.salt)) throw new Error('Неверный ник или пароль.');
    profile = {
      access_token: '0', client_token: '0', uuid: offlineUuid(acc.name), name: acc.name,
      user_properties: '{}', meta: { type: 'mojang' }, offline: true,
    };
  } else {
    profile = toProfile(await yggdrasilRequest('/authenticate', {
      username, password, agent: { name: 'Minecraft', version: 1 }, requestUser: false,
    }));
    upsert(profile.name, {});
  }
  return saveSession(profile);
}

async function register(username, password) {
  username = (username || '').trim();
  if (!NAME_RE.test(username)) throw new Error('Ник: 3–16 символов, латиница, цифры и _.');
  if (!password || password.length < 6) throw new Error('Пароль — минимум 6 символов.');
  if (isOffline()) {
    const old = accounts()[key(username)];
    if (old && old.hash) throw new Error('Такой ник уже занят.');
    const salt = crypto.randomBytes(16).toString('hex');
    upsert(username, { name: username, salt, hash: hash(password, salt) });
  } else {
    await yggdrasilRequest(cfg.auth.registerPath, { username, password });
    upsert(username, {});
  }
  return login(username, password);
}

// Спрашивает у Discord-бота, подтвердил ли игрок аккаунт
async function checkDiscord() {
  const s = rawSession();
  if (!s) throw new Error('Сначала войди в аккаунт.');
  const acc = accounts()[key(s.name)];
  const r = await discord.check(acc.discord);
  if (r.verified) upsert(s.name, { discord: { ...acc.discord, verified: true, id: r.id || null, tag: r.tag || null } });
  return { configured: r.configured, session: withDiscord(s) };
}

module.exports = { login, register, logout, getSession, checkDiscord };
