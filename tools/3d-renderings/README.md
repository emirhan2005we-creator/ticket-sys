# 3D-Bauteilansichten

Die Bauteilbilder der Website (`website/assets/img/*.webp`) und das Social-Media-Bild
(`og-image.jpg`) sind 3D-Visualisierungen, erzeugt mit three.js in einem Headless-Chromium.
Die Bauteile sind im Code modelliert, als Drehprofile (`lathe`) und Frästeile (`extrude`),
siehe `render.html`.

```bash
cd tools/3d-renderings
npm install
npm run serve        # in einem zweiten Terminal laufen lassen (Port 8100)
npm run render       # rendert alle Szenen nach out/*.png
npm run export       # beschneidet, erzeugt WebP (groß + klein) und og-image.jpg
```

`capture.js` erwartet einen Chromium-Browser. Pfad bei Bedarf in `capture.js` anpassen
(`executablePath`) oder `npx playwright install chromium` ausführen.

Neue Szene: In `render.html` unter `SCENES` eine Funktion ergänzen (Bauteile platzieren,
Kamera setzen), dann in `package.json` (render) und `export.js` eintragen.
