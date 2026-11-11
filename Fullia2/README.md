# FulliaCraft Launcher

Лаунчер на Electron в лавандовом kawaii-стиле: сначала вход/регистрация, потом главное меню.

## Запуск
```bash
npm install
npm start          # разработка
build.bat          # сборка .exe (иконка: build/icon.ico)
```
Нужны Node.js и Java 21.

## Как устроено
- **Вход / регистрация** — в тестовом режиме аккаунты (ник + пароль, пароль хешируется) лежат локально в `accounts.json` в папке данных приложения. Когда поднимешь auth-сервер: `auth.apiUrl` + `offlineTestMode: false`.
- **Discord** — всё в `src/config.js → discord` и `src/discord.js`.
  Игрок получает код `FC-XXXXXX`, пишет боту `/verify FC-XXXXXX`; лаунчер спрашивает `GET {botApiUrl}/verify/<код>` и ждёт `{ "verified": true, "discordId": "...", "discordTag": "..." }`.
  `requireVerification: true` — без подтверждения играть нельзя.
- **Ссылки** (Discord, магазин, сайт) — `config.links`.
- **Новости и IP** в меню — `config.news`, `config.server.displayIp`.
- **Статус сервера** — настоящий (онлайн и пинг) по `server.host/port`.
- Картинки: `renderer/assets/` (`icon.png`, `mascot.png`, `bg.png`); иконка exe — `build/icon.ico`.

## FulliaCraft pastel redesign

The renderer now uses the FulliaCraft pastel pink/lavender visual system: glass panels, a crowned octopus mascot, custom inline navigation icons, pastel server/news cards, and matching launcher/app icon assets. The existing login, Discord verification, server polling, and game launch handlers remain wired to the same DOM IDs.
