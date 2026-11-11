const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { Client } = require('minecraft-launcher-core');
const cfg = require('./config');

function gameDir() {
  // В собранном exe — рядом с ним (для portable — рядом с самим portable-файлом)
  const base = app.isPackaged
    ? (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath))
    : process.cwd();
  const p = path.join(base, cfg.gameDirName);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать: ${url} (HTTP ${res.status})`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function ensureAuthlibInjector(dir) {
  const jar = path.join(dir, 'authlib-injector.jar');
  if (!fs.existsSync(jar)) {
    await downloadFile(cfg.authlibInjector.url, jar);
  }
  return jar;
}

// Fabric: MCLC сам его не ставит, поэтому качаем профиль с fabricmc.net
// и кладём в versions/<имя>/<имя>.json — дальше MCLC подхватит его как custom-версию.
async function ensureFabric(dir) {
  const name = `fabric-loader-${cfg.fabricLoader}-${cfg.minecraftVersion}`;
  const verDir = path.join(dir, 'versions', name);
  const json = path.join(verDir, `${name}.json`);
  if (!fs.existsSync(json)) {
    fs.mkdirSync(verDir, { recursive: true });
    const url = `https://meta.fabricmc.net/v2/versions/loader/${cfg.minecraftVersion}/${cfg.fabricLoader}/profile/json`;
    await downloadFile(url, json);
  }
  return name;
}

async function launch(profile, emit) {
  const dir = gameDir();

  // JVM-аргументы: authlib-injector (только если настроен auth-сервер)
  const customArgs = [];
  if (cfg.auth.apiUrl) {
    const jar = await ensureAuthlibInjector(dir);
    customArgs.push(
      `-javaagent:${jar}=${cfg.auth.apiUrl}`,
      '-Dauthlibinjector.legacySkinPolyfill=true'
    );
  }

  const version = { number: cfg.minecraftVersion, type: 'release' };
  if (cfg.fabricLoader) version.custom = await ensureFabric(dir);

  const client = new Client();
  client.on('debug', (d) => emit({ type: 'log', line: String(d) }));
  client.on('data', (d) => emit({ type: 'log', line: String(d) }));
  client.on('download-status', (d) => emit({ type: 'download', name: d.name }));
  client.on('progress', (p) => emit({ type: 'progress', done: p.task, total: p.total }));
  client.on('close', (code) => emit({ type: 'close', code }));

  const options = {
    root: dir,
    version,
    memory: { max: cfg.memory.max, min: cfg.memory.min },
    authorization: profile,
    overrides: { gameDirectory: dir },
  };

  if (customArgs.length) options.customArgs = customArgs;
  if (cfg.javaPath) options.javaPath = cfg.javaPath;
  if (cfg.modpack.url) options.clientPackage = cfg.modpack.url; // zip со сборкой модов
  if (cfg.server.host) options.server = { host: cfg.server.host, port: String(cfg.server.port) }; // автоподключение

  const proc = await client.launch(options);
  if (!proc) throw new Error('Игра не запустилась — смотри лог выше.');
}

module.exports = { launch };
