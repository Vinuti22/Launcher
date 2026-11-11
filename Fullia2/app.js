const $ = (id) => document.getElementById(id);
let session = null;

function log(msg, cls = '') {
  const el = $('log');
  const line = document.createElement('div');
  line.className = 'log-line ' + cls;
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function setProgress(pct) {
  $('progress-fill').style.width = Math.min(100, Math.max(0, pct)) + '%';
}

function showProfile() {
  const authed = !!session;
  $('auth-panel').style.display = authed ? 'none' : 'block';
  $('profile-panel').style.display = authed ? 'block' : 'none';
  if (authed) {
    $('profile-name').textContent = session.name + (session.offline ? ' (офлайн-режим)' : '');
  }
}

async function wrap(promise, okMsg) {
  try {
    const r = await promise;
    if (okMsg) log(okMsg, 'ok');
    return r;
  } catch (e) {
    log('Ошибка: ' + (e.message || e), 'err');
    throw e;
  }
}

$('btn-login').onclick = async () => {
  const username = $('username').value.trim();
  const password = $('password').value;
  session = await wrap(window.launcherAPI.login(username, password), 'Вход выполнен.');
  showProfile();
};

$('btn-register').onclick = async () => {
  const username = $('username').value.trim();
  const password = $('password').value;
  await wrap(window.launcherAPI.register(username, password), 'Регистрация успешна, теперь войди.');
};

$('btn-logout').onclick = async () => {
  await window.launcherAPI.logout();
  session = null;
  showProfile();
};

$('btn-play').onclick = async () => {
  setProgress(0);
  log('Запуск игры...');
  try {
    await wrap(window.launcherAPI.launch());
  } catch { /* ошибка уже выведена */ }
};

window.launcherAPI.onGameEvent((ev) => {
  if (ev.type === 'progress' && ev.total) {
    setProgress((ev.done / ev.total) * 100);
  } else if (ev.type === 'download') {
    log('Скачивание: ' + ev.name);
  } else if (ev.type === 'log') {
    log(ev.line);
  } else if (ev.type === 'close') {
    setProgress(0);
    log('Игра закрыта (код ' + ev.code + ')', ev.code === 0 ? 'ok' : 'err');
  }
});

(async () => {
  session = await window.launcherAPI.getSession();
  showProfile();
  if (session) log('Сессия восстановлена: ' + session.name, 'ok');
})();
