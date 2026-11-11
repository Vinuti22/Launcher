// ============================================================
//  ГЛАВНЫЙ КОНФИГ ЛАУНЧЕРА — меняй всё под свой проект здесь
// ============================================================

module.exports = {
  // Версия Minecraft твоей сборки
  minecraftVersion: '26.2',

  // Версия Fabric loader (подбери под сборку: https://fabricmc.net/develop)
  fabricLoader: '0.18.4'

  // --- Авторизация ---
  auth: {
    // URL твоего Yggdrasil API (Blessing Skin или свой сервер).
    // Пока не поднят — оставь пустым, будет офлайн-вход для тестов.
    apiUrl: '', // например: 'https://auth.myserver.ru'
    registerPath: '/api/register', // эндпоинт регистрации на твоём бэкенде
  },

  // Тестовый режим: вход без бэкенда, просто по нику
  offlineTestMode: true,

  // authlib-injector: jar качается сюда при первом запуске (залей на свой хостинг)
  authlibInjector: {
    url: 'https://your-domain.ru/files/authlib-injector.jar',
  },

  // Сервер для автоподключения
  server: {
    host: 'localhost',   // позже впиши адрес из playit.gg или свой домен
    port: 25565,
  },

  // Модпак: zip со сборкой модов, лаунчер скачает сам (залей на хостинг)
  modpack: {
    url: '', // например: 'https://your-domain.ru/files/modpack.zip'
  },

  // Память и Java
  memory: { min: '1024M', max: '4096M' },
  javaPath: undefined, // если нужна конкретная Java: 'C:\Program Files\Java\bin\java.exe'

  // Папка, куда ставится игра (рядом с лаунчером)
  gameDirName: 'MyServerGame',
};
