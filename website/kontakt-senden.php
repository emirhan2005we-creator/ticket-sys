<?php
/**
 * AY-Tech Präzisionsteile GmbH – Versand des Kontaktformulars
 *
 * Voraussetzungen: PHP 8.0+ mit mbstring und funktionierender mail()-Funktion
 * (bei deutschen Hostern wie IONOS, Strato, All-inkl. o. Ä. standardmäßig vorhanden).
 *
 * Vor dem Livegang die Adressen unten anpassen. ABSENDER muss eine Adresse auf der
 * eigenen Domain sein, sonst landen die Mails beim Empfänger häufig im Spam.
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
const MIN_SEKUNDEN   = 3; // schneller ausgefüllte Formulare gelten als Spam

const ANLIEGEN = ['Angebotsanfrage', 'Technische Frage', 'Allgemeine Anfrage'];

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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    weiterleiten('kontakt.html');
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
    'Datenschutzhinweis bestätigt: ja',
    'Gesendet am: ' . date('d.m.Y, H:i') . ' Uhr',
];
$text = implode("\r\n", str_replace("\n", "\r\n", $zeilen));

$kopfzeilen = implode("\r\n", [
    'From: ' . mb_encode_mimeheader(ABSENDER_NAME, 'UTF-8', 'Q') . ' <' . ABSENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: AY-Tech Kontaktformular',
]);

$gesendet = mail(EMPFAENGER, $betreff, $text, $kopfzeilen, '-f' . ABSENDER);

weiterleiten($gesendet ? SEITE_OK : SEITE_FEHLER);
