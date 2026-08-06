/* Generate VALID Nexora PWA icons (PNG + ICO) — pure Node, no deps */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

/* ---------- PNG encoder ---------- */
function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf);
  // manual CRC32 fallback
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // 10,11,12 = 0
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- ICO encoder (PNG-embedded, Vista+) ---------- */
function encodeICO(pngs /* [{size, png}] */) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type icon
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  const blobs = [];
  for (const { size, png } of pngs) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0; // palette
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4);  // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    blobs.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

/* ---------- Draw the Nexora flower icon ---------- */
function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const R = size / 2;
  // petal geometry (scaled to size)
  const petalLen = size * 0.24;   // radial semi-axis
  const petalWid = size * 0.15;   // tangential semi-axis
  const petalDist = size * 0.17;  // petal center distance from middle
  const petals = [0, 1, 2, 3, 4].map(i => (i * 2 * Math.PI) / 5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R) { buf.writeUInt32BE(0, (y * size + x) * 4); continue; } // transparent outside circle
      // gradient background (rose pink → deep magenta)
      const t = Math.min(1, d / R);
      const r = Math.round(0xe6 - (0x8e - 0xe6) * 0); // keep
      // vertical-ish gradient: top #E6007E, bottom #8e004b
      const gy = y / size;
      const br = Math.round(0xe6 + (0x8e - 0xe6) * gy);
      const bg_ = Math.round(0x00 + (0x00 - 0x00) * gy);
      const bb = Math.round(0x7e + (0x4b - 0x7e) * gy);
      // rounded-square mask instead of circle for app-icon look
      const corner = size * 0.22;
      const qx = Math.max(corner - x, x - (size - corner), 0);
      const qy = Math.max(corner - y, y - (size - corner), 0);
      const inRounded = Math.sqrt(qx * qx + qy * qy) <= corner;
      if (!inRounded) { buf.writeUInt32BE(0, (y * size + x) * 4); continue; }
      let cr = br, cg = bg_, cb = bb, ca = 255;
      // white flower: 5 petals + center
      let white = 0;
      for (const a of petals) {
        const pcx = cx + Math.cos(a) * petalDist;
        const pcy = cy + Math.sin(a) * petalDist;
        const ux = Math.cos(a), uy = Math.sin(a);
        const vx = -Math.sin(a), vy = Math.cos(a);
        const px = dx + (cx - pcx) * 1, py = dy + (cy - pcy) * 1;
        const xt = px * ux + py * uy;
        const yt = px * vx + py * vy;
        const ex = xt / petalLen, ey = yt / petalWid;
        if (ex * ex + ey * ey <= 1) { white = 1; break; }
      }
      // center circle
      if (d <= size * 0.10) white = 1;
      if (white) {
        cr = 255; cg = 255; cb = 255; ca = 245;
        // subtle petal shading for depth
        if (d > size * 0.05 && d < size * 0.30) { cr = 255; cg = 240; cb = 246; }
      }
      const val = ((ca << 24) | (cr << 16) | (cg << 8) | cb) >>> 0;
      buf.writeUInt32BE(val, (y * size + x) * 4);
    }
  }
  return buf;
}

/* ---------- Generate all files ---------- */
const sizes = { 'public/pwa-192x192.png': 192, 'public/pwa-512x512.png': 512, 'public/apple-touch-icon.png': 180, 'public/favicon-16.png': 16, 'public/favicon-32.png': 32 };
for (const [file, size] of Object.entries(sizes)) {
  const png = encodePNG(size, makeIcon(size));
  fs.writeFileSync(file, png);
  console.log('✅', file, '(' + size + 'x' + size + ', ' + png.length + ' bytes)');
}
// valid favicon.ico (16 + 32 embedded)
const ico = encodeICO([
  { size: 16, png: encodePNG(16, makeIcon(16)) },
  { size: 32, png: encodePNG(32, makeIcon(32)) },
]);
fs.writeFileSync('public/favicon.ico', ico);
console.log('✅ public/favicon.ico (' + ico.length + ' bytes)');
console.log('DONE');
