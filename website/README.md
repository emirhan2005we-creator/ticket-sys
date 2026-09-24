# Website – AY-Tech Präzisionsteile GmbH

Statische Firmenwebsite (HTML5, CSS, etwas JavaScript) mit PHP-Kontaktformular.
Kein Framework, kein Build-Schritt: Die Dateien können direkt zu jedem Hoster mit PHP hochgeladen werden.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Hero mit 3D-Viewer, Kennzahlen, Vorstellung, Scroll-Story „Vom Rohling zum Präzisionsteil“, Leistungen, Vorteile (Bento-Grid), Branchen, FAQ, Schnellanfrage mit Datei-Upload |
| `ueber-uns.html` | Geschichte, Geschäftsführer, Philosophie, Qualitätsanspruch |
| `leistungen.html` | CNC-Drehen, CNC-Fräsen, Präzisions-/Sonderteile, Werkstoffe, Anfrage-Checkliste |
| `qualitaet.html` | Prüfprozess, Zertifizierungen, Maschinenpark, Messtechnik |
| `branchen.html` | Branchen und Referenzen (Kundenlogos nur mit Freigabe) |
| `kontakt.html` | Anfrageformular, Kontaktdaten, Anfahrt |
| `impressum.html` | Impressum nach § 5 DDG inkl. HRB 219627, AG Osnabrück |
| `datenschutz.html` | Datenschutzerklärung (DSGVO) |
| `danke.html`, `404.html` | Bestätigungs- und Fehlerseite (nicht indexiert) |
| `kontakt-senden.php` | Versand beider Formulare per E-Mail, inkl. Zeichnungen als Anhang |
| `.user.ini` | PHP-Upload-Grenzen (12 MB) für Hoster mit PHP-FPM/CGI |

```
assets/css/style.css   Gesamtes Styling (Design-Tokens oben in :root)
assets/js/main.js      Navigation, Formulare, Animationen (Funken, Neigen, Zähler, Einblenden)
assets/js/hero3d.js    Interaktiver 3D-Viewer der Startseite (Quelle: tools/3d-viewer)
assets/fonts/          Inter, Space Grotesk, Space Mono (lokal, SIL Open Font License)
assets/img/            3D-Bauteilansichten (WebP, je groß + klein), og-image.jpg; hier auch echte Fotos ablegen
.htaccess              Apache: 404-Seite, Caching, Komprimierung, Sicherheits-Header
robots.txt, sitemap.xml, favicon.svg
```

## Lokal ansehen

```bash
cd website
php -S localhost:8000
```

Dann <http://localhost:8000> öffnen. Die Seiten funktionieren auch per Doppelklick,
das Formular aber nur mit PHP.

## Checkliste vor dem Livegang

Alle noch offenen Inhalte sind im Browser **gelb markiert** (`class="ph-text"`)
bzw. als **Foto-Platzhalter** (`class="ph"`) sichtbar. Offene Stellen finden:

```bash
grep -rn "ph-text\|class=\"ph\|ihre-domain\|20XX\|Musterstraße\|000000" --include=*.html --include=*.php --include=*.xml --include=*.txt .
```

1. **Kontaktdaten** in allen Seiten ersetzen: Straße, Telefon (auch in `tel:+495401000000`),
   E-Mail, Fax, Geschäftszeiten, USt-IdNr. (Impressum).
2. **Domain** `ihre-domain.de` überall ersetzen (HTML, `sitemap.xml`, `robots.txt`, `kontakt-senden.php`).
3. **Kontaktformular:** In `kontakt-senden.php` `EMPFAENGER` und `ABSENDER` setzen.
   Der Absender muss eine Adresse auf der eigenen Domain sein. Danach eine Testanfrage senden,
   auch mit angehängter PDF-Datei. Erlaubt sind PDF, STEP, IGES, DXF, DWG, ZIP, JPG und PNG,
   bis zu 3 Dateien mit zusammen 10 MB. Falls größere Dateien abgelehnt werden,
   greift beim Hoster die `.user.ini` nicht. Dann die Upload-Grenze im Kundenmenü des Hosters erhöhen.
4. **Fachliche Angaben bestätigen:** Toleranzen, Werkstückgrößen, Maschinenpark, Messtechnik,
   Zertifizierungen, Branchen, Werkstoffe, Zeitstrahl, Zitat des Geschäftsführers.
   Außerdem die Zusagen in den FAQ auf der Startseite: Angebotsfrist, Geheimhaltungsvereinbarung (NDA)
   auf Wunsch, Fertigung nach Muster und Liefergebiet.
   Nur angeben, was tatsächlich zutrifft; sonst Abschnitt entfernen.
5. **Fotos einsetzen:** Die Bauteilbilder sind 3D-Visualisierungen typischer Teile, gekennzeichnet als
   „3D-Ansicht“, und können bleiben. Echte Fotos wirken auf Kunden aber noch stärker. Besonders wichtig
   sind Geschäftsführer-Porträt, Halle/Maschinen, Messraum und Teile aus der eigenen Fertigung.
   Diese Stellen zeigen noch Blaupausen-Platzhalter („Foto folgt“).
   Ein Beispiel für den Bild-Code steht als Kommentar in `index.html` (Abschnitt „Über AY-Tech“).
   Empfehlung: WebP, je 2–3 Größen (800/1200/1800 px) mit `srcset`, `width`/`height` angeben,
   `loading="lazy"` und aussagekräftiger `alt`-Text. Dateinamen- und Alt-Text-Vorschläge stehen
   in den Kommentaren über jedem Platzhalter.
6. **Datenschutzerklärung:** Hoster eintragen und Speicherdauer der Logfiles prüfen.
   Impressum und Datenschutzerklärung **vor dem Livegang rechtlich prüfen lassen**
   (z. B. Anwalt oder Generator wie eRecht24).
7. **HTTPS:** SSL-Zertifikat beim Hoster aktivieren, dann die Weiterleitung in `.htaccess` einkommentieren.
8. **Markierung entfernen:** Wenn alles ersetzt ist, in `style.css` den Block
   „12. Platzhalter“ löschen.
9. Optional: Social-Media-Vorschaubild (`og:image`, 1200×630 px) und `apple-touch-icon` ergänzen,
   Seite in der Google Search Console anmelden und `sitemap.xml` einreichen.

## Pflege

- Header und Footer stehen in jeder HTML-Datei. Änderungen an Navigation oder Kontaktdaten
  also in allen Seiten vornehmen (Suchen & Ersetzen).
- Nach Änderungen an `style.css` oder `main.js` die Version in den `<head>`-Links hochzählen
  (`style.css?v=1` → `?v=2`), damit Browser die neue Datei laden.
- Farben, Schriftgrößen und Abstände zentral in `:root` in `style.css` anpassen.

## Design und Animationen

- Farben: Dunkelblau/Stahl, Akzent „Funkenorange“ (`--accent` in `style.css`) für Buttons und Highlights
- Überschriften in Space Grotesk, Fließtext in Inter
- Startseite: interaktives 3D-Bauteil (drehbar, folgt der Maus, 4 Bauteile per Tab, Achsanzeige),
  CAD-Fadenkreuz mit Koordinaten in mm, Laufband, das auf Scrollrichtung und -tempo reagiert,
  hochzählende Kennzahl, Wort-für-Wort-Animation der Überschrift, metallischer Glanz auf „Präzision.“
- Scroll-Story „Vom Rohling zum Präzisionsteil“: Beim Scrollen wird aus dem Rohling die Welle gedreht
  (mit Funkenflug), die Nut gefräst, per Messring geprüft und das fertige Teil präsentiert.
  Ohne WebGL steht dort ein Standbild; mit „Bewegung reduzieren“ werden die Schritte als Liste gezeigt.
- Vorteile als Bento-Grid mit Digitalanzeige, Losgrößen-Balken, Prüf-Häkchen, Terminbalken und Koordinaten
- Filmkorn-Textur auf dunklen Flächen, technische Details in Space Mono
- Überall: Funkenflug beim Klick auf orange Buttons, magnetische Buttons, Karten neigen sich zur Maus,
  Lichtkegel folgt dem Zeiger, Unterstreichungen zeichnen sich beim Scrollen ein,
  Fortschrittsbalken im Header, weiche Seitenübergänge (View Transitions)
- Alle Bewegungen entfallen automatisch, wenn im Betriebssystem „Bewegung reduzieren“ aktiv ist

## Technik und Datenschutz

- Mobile-First, responsiv ab 320 px Breite; auf dem Handy feste Leiste „Anrufen / Angebot anfordern“
- Zwei Anfragewege: Schnellanfrage auf der Startseite und ausführliches Formular auf der Kontaktseite,
  beide über `kontakt-senden.php`
- Bauteilbilder als 3D-Renderings (WebP mit Transparenz, 14–72 KB); Quelle und Skripte unter
  `tools/3d-renderings/`
- Keine Cookies, kein Tracking, keine externen Anfragen; die Schrift liegt lokal
  (kein Cookie-Banner nötig, solange das so bleibt)
- Karten nur als Link, nicht eingebettet: keine Datenübertragung an Google ohne Klick
- Spam-Schutz ohne Drittanbieter (unsichtbares Feld + Mindest-Ausfüllzeit)
- SEO: eigene Titel und Beschreibungen, Canonical-Links, Open Graph, strukturierte Daten
  (schema.org/Organization), Sitemap
- Barrierefreiheit: semantisches HTML, Skip-Link, Tastaturbedienung, sichtbarer Fokus,
  ausreichende Kontraste, `prefers-reduced-motion`
- Geprüft mit html-validate (0 Fehler) und axe-core (WCAG 2.1 AA, 0 Verstöße)
