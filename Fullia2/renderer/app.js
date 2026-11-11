const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const api = window.launcherAPI;
let session = null;
let info = null;

// Интерфейс нарисован под 1280×720 и масштабируется под размер окна
const fit = () => { $('#stage').style.zoom = Math.min(innerWidth / 1280, innerHeight / 720); };
addEventListener('resize', fit); fit();

let tt;
function toast(msg, bad) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(tt); tt = setTimeout(() => { t.className = ''; }, 3500);
}
const clean = (e) => String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
const err = (m) => { $('#auth-err').textContent = m; };

function log(msg, cls = '') {
  const el = $('#log'), d = document.createElement('div');
  d.className = cls; d.textContent = msg; el.appendChild(d); el.scrollTop = el.scrollHeight;
}
const setP = (pct) => { $('#pfill').style.width = Math.min(100, Math.max(0, pct)) + '%'; };

function screen(id) {
  $$('.screen').forEach((s) => { s.hidden = s.id !== id; });
  $('#stage').className = id;
}
function view(name) {
  $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + name));
  $$('.nav').forEach((n) => n.classList.toggle('on', n.dataset.view === name));
}
const verified = () => !!(session && session.discord && session.discord.verified);

function fillProfile() {
  $('#pf-name').textContent = session.name + (session.offline ? ' (локальный аккаунт)' : '');
  const b = $('#pf-badge');
  b.textContent = verified() ? 'подтверждён' : 'не подтверждён';
  b.className = 'badge' + (verified() ? ' ok' : '');
  $('#pf-tag').textContent = (session.discord && session.discord.tag) || '';
  $('#pf-verify').hidden = verified();
}
function fillVerify() {
  $('#vf-cmd').textContent = '/verify ' + (session.discord.code || '');
  const b = $('#vf-badge');
  b.textContent = verified() ? 'подтверждён' : 'ожидает';
  b.className = 'badge' + (verified() ? ' ok' : '');
  $('#vf-skip').hidden = info.discord.requireVerification && !verified();
}
function enter(justRegistered) {
  fillProfile();
  if (justRegistered || (info.discord.requireVerification && !verified())) { fillVerify(); screen('s-verify'); }
  else { screen('s-main'); view('home'); }
}

// --- вход / регистрация ---
$$('[data-tab]').forEach((b) => { b.onclick = () => {
  $$('[data-tab]').forEach((x) => x.classList.toggle('on', x === b));
  $('#f-login').hidden = b.dataset.tab !== 'login';
  $('#f-reg').hidden = b.dataset.tab !== 'reg';
  err('');
}; });
$('#f-login').onsubmit = async (e) => {
  e.preventDefault(); err('');
  try { session = await api.login($('#l-name').value, $('#l-pass').value); enter(false); }
  catch (x) { err(clean(x)); }
};
$('#f-reg').onsubmit = async (e) => {
  e.preventDefault(); err('');
  const p = $('#r-pass').value;
  if (p !== $('#r-pass2').value) { err('Пароли не совпадают.'); return; }
  try { session = await api.register($('#r-name').value, p); enter(true); }
  catch (x) { err(clean(x)); }
};

// --- Discord ---
async function checkDiscord() {
  try {
    const r = await api.checkDiscord();
    session = r.session;
    if (verified()) { toast('Аккаунт подтверждён ✨'); fillProfile(); screen('s-main'); view('home'); }
    else toast(r.configured ? 'Пока не подтверждено — отправь боту команду.' : 'Discord-бот ещё не подключён.');
  } catch (x) { toast(clean(x), true); }
}
$('#vf-check').onclick = checkDiscord;
$('#vf-skip').onclick = () => { screen('s-main'); view('home'); };
$('#vf-copy').onclick = () => { navigator.clipboard.writeText($('#vf-cmd').textContent).then(() => toast('Команда скопирована'), () => {}); };
$('#pf-verify').onclick = () => { fillVerify(); screen('s-verify'); };

// --- навигация и кнопки ---
$$('[data-view]').forEach((b) => { b.onclick = () => view(b.dataset.view); });
$$('[data-go]').forEach((b) => { b.onclick = () => view(b.dataset.go); });
$$('[data-w]').forEach((b) => { b.onclick = () => api.win(b.dataset.w); });
$$('[data-link]').forEach((b) => { b.onclick = async () => {
  if (!(await api.openLink(b.dataset.link))) toast(b.dataset.soon || 'Ссылка пока не настроена (src/config.js → links).', true);
}; });
$('#btn-logout').onclick = async () => { await api.logout(); session = null; $('#l-pass').value = ''; screen('s-auth'); };

// --- запуск игры ---
$('#btn-play').onclick = async () => {
  if (info.discord.requireVerification && !verified()) { toast('Сначала подтверди аккаунт через Discord.', true); view('profile'); return; }
  setP(0); $('#pstat').textContent = 'Запускаем игру…'; log('Запуск игры...');
  try { await api.launch(); }
  catch (e) { $('#pstat').textContent = ''; log('Ошибка: ' + clean(e), 'err'); toast(clean(e), true); }
};
api.onGameEvent((ev) => {
  if (ev.type === 'progress' && ev.total) { setP((ev.done / ev.total) * 100); $('#pstat').textContent = 'Загрузка файлов…'; }
  else if (ev.type === 'download') log('Скачивание: ' + ev.name);
  else if (ev.type === 'log') log(ev.line);
  else if (ev.type === 'close') { setP(0); $('#pstat').textContent = ''; log('Игра закрыта (код ' + ev.code + ')', ev.code === 0 ? 'ok' : 'err'); }
});

// --- статус сервера ---
const hist = [];
async function pollStatus() {
  const s = await api.status().catch(() => null);
  const max = (s && s.max) || info.server.maxPlayers;
  $('#pill-text').textContent = s ? `Сервер онлайн: ${s.online} / ${max}` : 'Сервер недоступен';
  $('#pill').classList.toggle('off', !s);
  $('#st-dot').classList.toggle('off', !s);
  $('#st-online').textContent = `Онлайн: ${s ? s.online : '—'} / ${max}`;
  $('#st-ping').textContent = s ? s.ping + 'ms' : '—';
  hist.push(s ? s.online : 0); if (hist.length > 28) hist.shift();
  const top = Math.max(...hist, 1);
  $('#bars').innerHTML = Array.from({ length: 28 }, (_, i) => {
    const v = hist[i - (28 - hist.length)];
    return `<i style="height:${v === undefined ? 8 : 10 + 90 * (v / top)}%"></i>`;
  }).join('');
}

(async () => {
  info = await api.info();
  $('#ver').textContent = 'v' + info.brand.version;
  $('#st-ip').textContent = info.server.displayIp || info.server.host;
  $('#st-ver').textContent = info.mc;
  $('#news').innerHTML = info.news.map((n) =>
    `<div class="ni"><div class="ic"><img src="assets/${n.icon === 'octopus' ? 'mascot.png' : 'news-gift.png'}" alt=""></div><div><b>${n.title}</b><p>${n.text}</p><small>${n.date}</small></div></div>`).join('');
  session = await api.getSession();
  if (session) enter(false); else screen('s-auth');
  pollStatus(); setInterval(pollStatus, 30000);
})();
