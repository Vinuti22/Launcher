// Статус сервера: Minecraft Server List Ping (онлайн/макс + пинг). null — сервер недоступен.
const net = require('net');

const varint = (n) => { const b = []; do { let t = n & 127; n >>>= 7; if (n) t |= 128; b.push(t); } while (n); return Buffer.from(b); };

function queryServer(host, port, timeout = 4000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let buf = Buffer.alloc(0), done = false;
    const finish = (v) => { if (!done) { done = true; s.destroy(); resolve(v); } };
    const s = net.connect({ host, port }, () => {
      const h = Buffer.from(host);
      const hs = Buffer.concat([varint(0), varint(767), varint(h.length), h, Buffer.from([port >> 8, port & 255]), varint(1)]);
      s.write(Buffer.concat([varint(hs.length), hs, Buffer.from([1, 0])]));
    });
    s.setTimeout(timeout, () => finish(null));
    s.on('error', () => finish(null));
    s.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        let o = 0;
        const rv = () => { let n = 0, sh = 0, b; do { b = buf[o++]; if (b === undefined) throw 0; n |= (b & 127) << sh; sh += 7; } while (b & 128); return n; };
        const len = rv(); if (buf.length < o + len) return;
        rv(); const sl = rv();
        const j = JSON.parse(buf.slice(o, o + sl).toString());
        finish({ online: j.players.online, max: j.players.max, ping: Date.now() - t0 });
      } catch { /* ждём остальные данные */ }
    });
  });
}

module.exports = { queryServer };
