const { chromium } = require('playwright-core');
const sharp = require('sharp');
const fs = require('fs');
// usage: node capture.js outdir scene:w:h[:extra] ...
(async () => {
  const [outdir, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const job of jobs) {
    const [scene, w, h, extra = ''] = job.split(':');
    const p = await b.newPage({ viewport: { width: 800, height: 600 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const t0 = Date.now();
    await p.goto(`http://127.0.0.1:8100/render.html?scene=${scene}&w=${w}&h=${h}&ss=2${extra ? '&' + extra.replace(/,/g, '&') : ''}`);
    await p.waitForFunction(() => window.__done === true, null, { timeout: 180000 }).catch(() => {});
    if (errs.length) console.log(scene, 'ERR', errs.slice(0, 3));
    const data = await p.evaluate(() => window.renderer ? window.renderer.domElement.toDataURL('image/png') : null);
    if (!data) { console.log(scene, 'no data'); continue; }
    const buf = Buffer.from(data.split(',')[1], 'base64');
    await sharp(buf).resize(+w, +h).png().toFile(`${outdir}/${scene}.png`);
    console.log(scene, `${Date.now() - t0}ms`);
    await p.close();
  }
  await b.close();
})();
