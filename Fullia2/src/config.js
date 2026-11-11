// ============================================================
//  ГЛАВНЫЙ КОНФИГ ЛАУНЧЕРА — меняй всё под свой проект здесь
// ============================================================

module.exports = {
  brand: { name: 'FulliaCraft', version: '1.0.0' },

  // Версия Minecraft твоей сборки
  minecraftVersion: '26.2',

  // Версия Fabric loader (подбери под сборку: https://fabricmc.net/develop)
  fabricLoader: '0.20.1',

  // --- Авторизация ---
  auth: {
    // URL твоего Yggdrasil API (Blessing Skin или свой сервер).
    // Пока не поднят — оставь пустым: аккаунты хранятся локально на этом ПК.
    apiUrl: '', // например: 'https://auth.fulliacraft.ru'
    registerPath: '/api/register', // эндпоинт регистрации на твоём бэкенде
  },

  // Тестовый режим: аккаунты (ник + пароль) хранятся локально, без бэкенда
  offlineTestMode: true,

  // --- Discord (подтверждение аккаунта через бота) ---
  discord: {
    // true — без подтверждения в Discord играть нельзя
    requireVerification: false,
    // URL API твоего бота. Лаунчер спросит GET {botApiUrl}/verify/<КОД>
    // и ждёт ответ JSON: { "verified": true, "discordId": "...", "discordTag": "..." }
    botApiUrl: '',
  },

  // Ссылки для кнопок (пустые — кнопка покажет «ссылка пока не настроена»)
  links: {
    discord: '', // приглашение на Discord-сервер
    shop: '',    // магазин / донат
    site: '',
  },

  // authlib-injector: jar качается сюда при первом запуске (залей на свой хостинг)
  authlibInjector: {
    url: 'https://your-domain.ru/files/authlib-injector.jar',
  },

  // Сервер для автоподключения и карточки «Статус сервера»
  server: {
    host: 'localhost',   // позже впиши адрес из playit.gg или свой домен
    port: 25565,
    displayIp: 'play.fulliacraft.ru', // что показывать игрокам
    maxPlayers: 3000,    // показывается, пока сервер не ответил
  },

  // Новости в главном меню
  news: [
    { icon: 'gift', title: 'Новый сезон ивентов!', text: 'Участвуй в уникальных ивентах и получай награды!', date: '10.11.2026' },
    { icon: 'octopus', title: 'Обновление магазина', text: 'Новые товары и приятные скидки на донат!', date: '08.11.2026' },
  ],

  // Модпак: zip со сборкой модов, лаунчер скачает сам (залей на хостинг)
  modpack: {
    url: '', // например: 'https://your-domain.ru/files/modpack.zip'
  },

  // Память и Java
  memory: { min: '1024M', max: '4096M' },
  javaPath: undefined, // если нужна конкретная Java: 'C:\\Program Files\\Java\\bin\\java.exe'

  // Папка, куда ставится игра (рядом с лаунчером)
  gameDirName: 'MyServerGame',
};
