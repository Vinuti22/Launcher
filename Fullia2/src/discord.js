// Место под Discord-бота. Пока botApiUrl пустой — это заглушка:
// код подтверждения уже выдаётся игроку, а проверка просто возвращает «не настроено».
const crypto = require('crypto');
const cfg = require('./config');

const newCode = () => 'FC-' + crypto.randomBytes(3).toString('hex').toUpperCase();

// Игрок пишет боту /verify FC-XXXXXX, бот запоминает пару «код → Discord-пользователь».
// Лаунчер спрашивает у бота: GET {botApiUrl}/verify/<код> → { verified, discordId, discordTag }
async function check(d) {
  if (!cfg.discord.botApiUrl) return { configured: false, verified: false };
  const res = await fetch(`${cfg.discord.botApiUrl}/verify/${encodeURIComponent(d.code)}`);
  if (!res.ok) throw new Error(`Бот не ответил (HTTP ${res.status})`);
  const j = await res.json().catch(() => ({}));
  return { configured: true, verified: !!j.verified, id: j.discordId, tag: j.discordTag };
}

module.exports = { newCode, check };
