const sharp = require('sharp');
const out = require('path').join(__dirname, '../../website/assets/img/');
const jobs = [
  ['hero', 'teile-uebersicht', [1400, 700]],
  ['shaft', 'welle', [1200, 600]],
  ['shaftDetail', 'welle-buchse', [1200, 600]],
  ['housing', 'gehaeuse', [1200, 600]],
  ['flange', 'flansch', [1200, 600]],
  ['adapter', 'adapter', [1200, 600]],
  ['bushing', 'buchsen', [1200, 600]],
];
const dims = {};
(async () => {
  for (const [src, name, widths] of jobs) {
    const trimmed = await sharp(`out/${src}.png`).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    const { width, height } = trimmed.info;
    const pad = Math.round(Math.max(width, height) * 0.04);
    const padded = await sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
    dims[name] = {};
    for (const [i, w] of widths.entries()) {
      const file = `${out}${name}${i ? '-sm' : ''}.webp`;
      const info = await sharp(padded.data).resize({ width: Math.min(w, padded.info.width) }).webp({ quality: 80, alphaQuality: 85, effort: 6 }).toFile(file);
      dims[name][i ? 'sm' : 'lg'] = [info.width, info.height];
      console.log(file.replace(out, ''), `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
    }
  }
  require('fs').writeFileSync('img-dims.json', JSON.stringify(dims, null, 1));
})();
