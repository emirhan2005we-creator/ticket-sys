# Interaktiver 3D-Viewer (Startseite)

`hero3d.src.js` ist der Quellcode des 3D-Bauteils im Startbereich der Website.
Die Bauteile (Welle, Flansch, Gehäuse, Adapter) werden im Browser aus Profilen erzeugt,
ganz ohne 3D-Dateien und ohne externe Server.

```bash
cd tools/3d-viewer
npm install
npm run build   # erzeugt website/assets/js/hero3d.js (minifiziert, ca. 150 KB gzip)
```

Danach in allen HTML-Seiten die Versionsnummer `main.js?v=…` erhöhen.

So verhält sich der Viewer:
- Er wird erst nach dem Laden der Seite nachgeladen (`main.js`). Bis dahin und ohne WebGL
  bleibt das Standbild `teile-uebersicht.webp` sichtbar.
- Bedienung: Ziehen dreht das Teil, Antippen gibt Schwung, die Tabs wechseln das Bauteil.
- Mit „Bewegung reduzieren“ im Betriebssystem dreht sich das Teil nicht von selbst.
- Außerhalb des sichtbaren Bereichs pausiert das Rendern (spart Akku).
