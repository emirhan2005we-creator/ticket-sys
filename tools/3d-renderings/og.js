const sharp = require('sharp');
(async () => {
  const W = 1200, H = 630;
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="78%" cy="10%" r="90%"><stop offset="0" stop-color="#1e4a78"/><stop offset=".55" stop-color="#0c1d31"/><stop offset="1" stop-color="#081424"/></radialGradient>
    <pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>
    <rect x="0" y="0" width="${W}" height="6" fill="#c9d1da"/>
    <text x="64" y="120" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" letter-spacing="4" fill="#8ab9e6">PRÄZISION AUS ERFAHRUNG</text>
    <text x="64" y="200" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="58" fill="#ffffff">AY-Tech</text>
    <text x="64" y="252" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#dfe6ee">Präzisionsteile GmbH</text>
    <text x="64" y="340" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#bcc6d0">CNC-Drehen · CNC-Fräsen</text>
    <text x="64" y="380" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#bcc6d0">Präzisions- und Sonderteile</text>
    <text x="64" y="560" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#8ab9e6">Georgsmarienhütte · Made in Germany</text>
  </svg>`);
  const parts = await sharp('out/hero.png').trim({ threshold: 1 }).resize({ width: 700 }).toBuffer();
  const meta = await sharp(parts).metadata();
  await sharp(bg).composite([{ input: parts, left: W - meta.width - 20, top: Math.round((H - meta.height) / 2) + 20 }])
    .jpeg({ quality: 82, mozjpeg: true }).toFile(require('path').join(__dirname, '../../website/assets/img/og-image.jpg'));
  console.log('og-image.jpg', Math.round(require('fs').statSync(require('path').join(__dirname, '../../website/assets/img/og-image.jpg')).size / 1024), 'KB');
})();
