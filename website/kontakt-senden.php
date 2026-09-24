<?php
/**
 * AY-Tech Präzisionsteile GmbH – Versand des Kontaktformulars
 *
 * Voraussetzungen: PHP 8.0+ mit mbstring und funktionierender mail()-Funktion
 * (bei deutschen Hostern wie IONOS, Strato, All-inkl. o. Ä. standardmäßig vorhanden).
 *
 * Vor dem Livegang die Adressen unten anpassen. ABSENDER muss eine Adresse auf der
 * eigenen Domain sein, sonst landen die Mails beim Empfänger häufig im Spam.
 *
 * Datei-Upload: Die Server-Einstellungen upload_max_filesize und post_max_size müssen
 * mindestens 10 MB erlauben (beim Hoster meist voreingestellt, sonst per php.ini/.user.ini).
 * Hochgeladene Dateien werden nur als E-Mail-Anhang versendet und nicht gespeichert.
 */
declare(strict_types=1);

date_default_timezone_set('Europe/Berlin');

// ---- Konfiguration (PLATZHALTER) ------------------------------------------
const EMPFAENGER     = 'info@ihre-domain.de';
const ABSENDER       = 'website@ihre-domain.de';
const ABSENDER_NAME  = 'Website AY-Tech';
const SEITE_OK       = 'danke.html';
const SEITE_FEHLER   = 'kontakt.html?status=fehler#formular';
const SEITE_UNGUELTIG = 'kontakt.html?status=ungueltig#formular';
const SEITE_DATEI    = 'kontakt.html?status=datei#formular';
const MIN_SEKUNDEN   = 3; // schneller ausgefüllte Formulare gelten als Spam

const ANLIEGEN = ['Angebotsanfrage', 'Technische Frage', 'Allgemeine Anfrage'];

// Anhänge
const MAX_DATEIEN = 3;
const MAX_BYTES   = 10 * 1024 * 1024; // zusammen
const ENDUNGEN    = ['pdf', 'step', 'stp', 'igs', 'iges', 'dxf', 'dwg', 'zip', 'jpg', 'jpeg', 'png'];

// ---------------------------------------------------------------------------

function weiterleiten(string $ziel): void
{
    header('Location: ' . $ziel, true, 303);
    exit;
}

/** Liest ein Formularfeld, entfernt Steuerzeichen und kürzt auf $max Zeichen. */
function feld(string $name, int $max = 200, bool $mehrzeilig = false): string
{
    $wert = $_POST[$name] ?? '';
    if (!is_string($wert)) {
        return '';
    }
    $wert = str_replace(["\r\n", "\r"], "\n", $wert);
    $muster = $mehrzeilig ? '/[\x00-\x09\x0B-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u';
    $wert = (string) preg_replace($muster, ' ', $wert);
    return mb_substr(trim($wert), 0, $max);
}

/**
 * Prüft hochgeladene Dateien. Gibt eine Liste [name, pfad] zurück
 * oder null, wenn eine Datei nicht erlaubt ist.
 */
function anhaenge(): ?array
{
    $f = $_FILES['dateien'] ?? null;
    if (!is_array($f) || !is_array($f['name'] ?? null)) {
        return [];
    }
    $liste = [];
    $gesamt = 0;
    foreach ($f['name'] as $i => $original) {
        $fehler = $f['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($fehler === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $pfad = (string) ($f['tmp_name'][$i] ?? '');
        if ($fehler !== UPLOAD_ERR_OK || !is_uploaded_file($pfad)) {
            return null;
        }
        $endung = strtolower(pathinfo((string) $original, PATHINFO_EXTENSION));
        if (!in_array($endung, ENDUNGEN, true)) {
            return null;
        }
        $gesamt += (int) filesize($pfad);
        // Dateiname: Umlaute umschreiben, nur sichere Zeichen behalten
        $name = strtr(basename((string) $original), ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'Ä' => 'Ae', 'Ö' => 'Oe', 'Ü' => 'Ue', 'ß' => 'ss']);
        $name = trim((string) preg_replace('/[^A-Za-z0-9._-]+/', '_', $name), '._');
        $stamm = substr(pathinfo($name, PATHINFO_FILENAME), 0, 60);
        $liste[] = ['name' => ($stamm !== '' ? $stamm : 'datei') . '.' . $endung, 'pfad' => $pfad];
    }
    if (count($liste) > MAX_DATEIEN || $gesamt > MAX_BYTES) {
        return null;
    }
    return $liste;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    weiterleiten('kontakt.html');
}

// Zu große Uploads: PHP verwirft dann das komplette Formular
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    weiterleiten(SEITE_DATEI);
}

// ---- Spam-Schutz ----------------------------------------------------------
// Honeypot: Menschen sehen dieses Feld nicht. Bots erhalten eine scheinbare Erfolgsmeldung.
if (feld('website') !== '') {
    weiterleiten(SEITE_OK);
}
// Ausfüllzeit (nur ausgewertet, wenn JavaScript aktiv war)
$dauer = feld('dauer', 10);
if ($dauer !== '' && ctype_digit($dauer) && (int) $dauer < MIN_SEKUNDEN) {
    weiterleiten(SEITE_OK);
}

// ---- Eingaben prüfen ------------------------------------------------------
$anliegen   = feld('anliegen', 40);
$name       = feld('name', 100);
$firma      = feld('firma', 120);
$email      = feld('email', 160);
$telefon    = feld('telefon', 40);
$stueckzahl = feld('stueckzahl', 60);
$werkstoff  = feld('werkstoff', 80);
$nachricht  = feld('nachricht', 5000, true);
$datenschutz = feld('datenschutz', 5);

if (!in_array($anliegen, ANLIEGEN, true)) {
    $anliegen = 'Allgemeine Anfrage';
}

$gueltig = $name !== ''
    && $nachricht !== ''
    && $datenschutz === 'ja'
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && ($telefon === '' || preg_match('/^[0-9 +()\/.-]{4,40}$/', $telefon) === 1);

if (!$gueltig) {
    weiterleiten(SEITE_UNGUELTIG);
}

$dateien = anhaenge();
if ($dateien === null) {
    weiterleiten(SEITE_DATEI);
}

// ---- E-Mail zusammenstellen -----------------------------------------------
$betreff = mb_encode_mimeheader(
    '[Website] ' . $anliegen . ' von ' . $name . ($firma !== '' ? ' (' . $firma . ')' : ''),
    'UTF-8',
    'Q'
);

$zeilen = [
    'Neue Anfrage über das Kontaktformular der Website',
    str_repeat('=', 50),
    '',
    'Anliegen:     ' . $anliegen,
    'Name:         ' . $name,
    'Firma:        ' . ($firma !== '' ? $firma : '–'),
    'E-Mail:       ' . $email,
    'Telefon:      ' . ($telefon !== '' ? $telefon : '–'),
    'Stückzahl:    ' . ($stueckzahl !== '' ? $stueckzahl : '–'),
    'Werkstoff:    ' . ($werkstoff !== '' ? $werkstoff : '–'),
    '',
    'Nachricht:',
    str_repeat('-', 50),
    $nachricht,
    str_repeat('-', 50),
    '',
    'Anhänge:      ' . ($dateien ? implode(', ', array_column($dateien, 'name')) : '–'),
    '',
    'Datenschutzhinweis bestätigt: ja',
    'Gesendet am: ' . date('d.m.Y, H:i') . ' Uhr',
];
$text = implode("\r\n", str_replace("\n", "\r\n", $zeilen));

$kopf = [
    'From: ' . mb_encode_mimeheader(ABSENDER_NAME, 'UTF-8', 'Q') . ' <' . ABSENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'X-Mailer: AY-Tech Kontaktformular',
];

if ($dateien) {
    // Mehrteilige Nachricht mit Anhängen
    $grenze = 'AYT-' . bin2hex(random_bytes(12));
    $kopf[] = 'Content-Type: multipart/mixed; boundary="' . $grenze . '"';
    $inhalt = '--' . $grenze . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $text . "\r\n";
    foreach ($dateien as $datei) {
        $inhalt .= '--' . $grenze . "\r\n"
            . 'Content-Type: application/octet-stream; name="' . $datei['name'] . "\"\r\n"
            . "Content-Transfer-Encoding: base64\r\n"
            . 'Content-Disposition: attachment; filename="' . $datei['name'] . "\"\r\n\r\n"
            . chunk_split(base64_encode((string) file_get_contents($datei['pfad'])))
            . "\r\n";
    }
    $inhalt .= '--' . $grenze . '--';
} else {
    $kopf[] = 'Content-Type: text/plain; charset=UTF-8';
    $kopf[] = 'Content-Transfer-Encoding: 8bit';
    $inhalt = $text;
}

$gesendet = mail(EMPFAENGER, $betreff, $inhalt, implode("\r\n", $kopf), '-f' . ABSENDER);

weiterleiten($gesendet ? SEITE_OK : SEITE_FEHLER);
