const fs = require('fs');
const path = require('path');
const { Client } = require('minecraft-launcher-core-node');
const cfg = require('./config');

function gameDir() {
  const p = path.join(process.cwd(), cfg.gameDirName);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать: ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function ensureAuthlibInjector(dir) {
  const jar = path.join(dir, 'authlib-injector.jar');
  if (!fs.existsSync(jar)) {
    await downloadFile(cfg.authlibInjector.url, jar);
  }
  return jar;
}

async function launch(profile, emit) {
  const dir = gameDir();

  // JVM-аргументы: authlib-injector (только если настроен auth-сервер)
  const jvmOptions = [];
  if (cfg.auth.apiUrl) {
    const jar = await ensureAuthlibInjector(dir);
    jvmOptions.push(
      `-javaagent:${jar}=${cfg.auth.apiUrl}`,
      '-Dauthlibinjector.legacySkinPolyfill=true'
    );
  }

  const client = new Client();
  client.on('download-status', (d) => emit({ type: 'download', name: d.name }));
  client.on('progress', (p) => emit({ type: 'progress', done: p.task, total: p.total }));
  client.on('data', (d) => emit({ type: 'log', line: String(d) }));
  client.on('close', (code) => emit({ type: 'close', code }));

  const options = {
    root: dir,
    version: { number: cfg.minecraftVersion, type: 'release' },
    memory: { max: cfg.memory.max, min: cfg.memory.min },
    auth: profile,
    overrides: {
      gameDirectory: dir,
      jvmOptions,
    },
  };

  if (cfg.javaPath) options.javaPath = cfg.javaPath;
  if (cfg.fabricLoader) options.loader = { type: 'fabric', version: cfg.fabricLoader, build: 'latest' };
  if (cfg.modpack.url) options.clientPackage = cfg.modpack.url; // zip со сборкой модов
  if (cfg.server.host) options.server = { host: cfg.server.host, port: cfg.server.port }; // автоподключение

  await client.launch(options);
}

module.exports = { launch };
