<?php
/**
 * MMSAR support form endpoint
 * - Appends each submission to data/submissions.json
 * - Emails mallacootamsar@gmail.com
 *
 * POST JSON or form-urlencoded. Returns JSON.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['result' => 'error', 'message' => 'POST only']);
    exit;
}

// ─── Config ───────────────────────────────────────────────
const NOTIFY_TO   = 'mallacootamsar@gmail.com';
const NOTIFY_FROM = 'noreply@mmsar.au';
const SITE_NAME   = 'MMSAR';
const MAX_BODY    = 20000;

// Paths: data lives next to public web root sibling if possible, else under site
$dataDir  = dirname(__DIR__) . '/data';
$dataFile = $dataDir . '/submissions.json';

// ─── Read body ────────────────────────────────────────────
$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > MAX_BODY) {
    http_response_code(413);
    echo json_encode(['result' => 'error', 'message' => 'Payload too large']);
    exit;
}

$in = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false || (isset($raw[0]) && ($raw[0] === '{' || $raw[0] === '['))) {
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['result' => 'error', 'message' => 'Invalid JSON']);
        exit;
    }
    $in = $decoded;
} else {
    $in = $_POST;
}

// Honeypot (bots fill hidden "website" field)
if (!empty($in['website'])) {
    echo json_encode(['result' => 'success']); // fake OK
    exit;
}

// ─── Sanitize ─────────────────────────────────────────────
function s(mixed $v, int $max = 500): string {
    if (!is_string($v) && !is_numeric($v)) {
        return '';
    }
    $t = trim((string) $v);
    $t = strip_tags($t);
    if (strlen($t) > $max) {
        $t = substr($t, 0, $max);
    }
    return $t;
}

$emailRaw = strtolower(s($in['email'] ?? $in['Email'] ?? '', 200));
$email = filter_var($emailRaw, FILTER_VALIDATE_EMAIL);
if ($email === false) {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'Please enter a valid email address.']);
    exit;
}
// Normalise for uniqueness (case-insensitive)
$email = strtolower($email);

// Public list shows Alias only (not real legal name). Accept alias or name.
$alias = s($in['alias'] ?? $in['Alias'] ?? $in['name'] ?? $in['Name'] ?? '', 80);
if ($alias === '') {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'Please enter an Alias for the public list (protects your privacy).']);
    exit;
}
// Block obvious full-email-as-alias
if (str_contains($alias, '@')) {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'Use an Alias for the public list — not your email address.']);
    exit;
}

$intent = s($in['intent'] ?? $in['Intent'] ?? 'support', 40);
$allowedIntents = ['support', 'volunteer', 'informed', 'status_quo'];
if (!in_array($intent, $allowedIntents, true)) {
    $intent = 'support';
}

// Always public as Alias — emails never published, contact list not released
$public = true;
$name = $alias;

// Connection to place (multi-select, at least one)
$connectionLabels = [
    'live_here'       => 'Lives here',
    'boat_here'       => 'Boats here',
    'family_friends'  => 'Family/friends live or boat here',
    'interested'      => 'Following / interested',
    'msar_experience' => 'Marine rescue / emergency experience',
];
$connection = [];
if (!empty($in['connection']) && is_array($in['connection'])) {
    foreach ($in['connection'] as $c) {
        $c = s((string) $c, 40);
        if (isset($connectionLabels[$c])) {
            $connection[] = $c;
        }
    }
}
// Also accept individual flags
foreach (array_keys($connectionLabels) as $key) {
    $v = $in[$key] ?? '0';
    if (($v === '1' || $v === 1 || $v === true || $v === 'on') && !in_array($key, $connection, true)) {
        $connection[] = $key;
    }
}
$connection = array_values(array_unique($connection));
if (count($connection) === 0) {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'Please tick at least one connection (live here, boat here, etc.).']);
    exit;
}

$roles = [];
if (!empty($in['roles']) && is_array($in['roles'])) {
    foreach ($in['roles'] as $r) {
        $r = s((string) $r, 40);
        if ($r !== '') {
            $roles[] = $r;
        }
    }
} else {
    foreach (['Crew', 'Skipper', 'Radio', 'Admin', 'General'] as $key) {
        $v = $in[$key] ?? $in[strtolower($key)] ?? '0';
        if ($v === '1' || $v === 1 || $v === true || $v === 'on') {
            $roles[] = $key;
        }
    }
}
$roles = array_values(array_unique($roles));

$other    = s($in['other'] ?? $in['Other'] ?? '', 300);
$comments = s($in['comments'] ?? $in['Comments'] ?? '', 2000);

$connectionShort = [];
foreach ($connection as $c) {
    $connectionShort[] = $connectionLabels[$c];
}

$record = [
    'id'                  => bin2hex(random_bytes(8)),
    'received_at'         => gmdate('c'),
    'alias'               => $alias,
    'name'                => $name, // same as alias — public display only
    'email'               => $email,
    'intent'              => $intent,
    'public'              => true,
    'connection'          => $connection,
    'connection_labels'   => $connectionShort,
    'roles'               => $roles,
    'other'               => $other,
    'comments'            => $comments,
    'ip'                  => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent'          => s($_SERVER['HTTP_USER_AGENT'] ?? '', 300),
];

// ─── Ensure data dir + file ───────────────────────────────
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0750, true) && !is_dir($dataDir)) {
        http_response_code(500);
        echo json_encode(['result' => 'error', 'message' => 'Cannot create data directory.']);
        exit;
    }
}

// Protect directory (in case .htaccess missing)
$htaccess = $dataDir . '/.htaccess';
if (!is_file($htaccess)) {
    @file_put_contents($htaccess, "Require all denied\nDeny from all\n");
}

if (!is_file($dataFile)) {
    @file_put_contents($dataFile, "[]\n", LOCK_EX);
}

// ─── Append JSON (file lock) + unique email ───────────────
$fp = fopen($dataFile, 'c+');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(['result' => 'error', 'message' => 'Cannot open submissions file.']);
    exit;
}

if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['result' => 'error', 'message' => 'Could not lock submissions file.']);
    exit;
}

$contents = stream_get_contents($fp);
$list = json_decode($contents ?: '[]', true);
if (!is_array($list)) {
    $list = [];
}

// One submission per email (case-insensitive)
foreach ($list as $existing) {
    if (!is_array($existing)) {
        continue;
    }
    $existingEmail = strtolower(trim((string) ($existing['email'] ?? '')));
    if ($existingEmail !== '' && $existingEmail === $email) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(409);
        echo json_encode([
            'result'  => 'error',
            'message' => 'This email is already on the list. One entry per email address.',
        ]);
        exit;
    }
}

$list[] = $record;

$json = json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    flock($fp, LOCK_UN);
    fclose($fp);
    http_response_code(500);
    echo json_encode(['result' => 'error', 'message' => 'JSON encode failed.']);
    exit;
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, $json . "\n");
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

// ─── Email notification ───────────────────────────────────
$intentLabel = [
    'support'    => 'Supports local management',
    'volunteer'  => 'Supports local management and offers to help',
    'informed'   => 'Stay informed',
    'status_quo' => 'Fine with how it is run now',
][$intent] ?? $intent;

$rolesText = $roles ? implode(', ', $roles) : '—';
$subject = sprintf('[%s] New %s — %s', SITE_NAME, $intent, $name !== '' ? $name : $email);

$body = "New MMSAR website submission\n";
$body .= "============================\n\n";
$body .= "When:    " . $record['received_at'] . " (UTC)\n";
$body .= "Intent:  " . $intentLabel . "\n";
$body .= "Public:  Yes — Alias + connection tags on public list\n";
$body .= "Alias:   " . $alias . "\n";
$body .= "Email:   " . $email . " (private — not released)\n";
$body .= "Connect: " . implode(', ', $connectionShort) . "\n";
$body .= "Roles:   " . $rolesText . "\n";
$body .= "Other:   " . ($other !== '' ? $other : '—') . "\n";
$body .= "Comment: " . ($comments !== '' ? $comments : '—') . "\n";
$body .= "\nID: " . $record['id'] . "\n";
$body .= "IP: " . $record['ip'] . "\n";
$body .= "\n— Stored in data/submissions.json on the server\n";
$body .= "— Public list: https://mmsar.au/#voices\n";

$headers = [
    'From: ' . SITE_NAME . ' Form <' . NOTIFY_FROM . '>',
    'Reply-To: ' . ($name !== '' ? $name . ' <' . $email . '>' : $email),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: MMSAR-Form/1.0',
];

// mail() may be filtered on some hosts; failure still keeps the JSON record
$mailed = @mail(NOTIFY_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

echo json_encode([
    'result'  => 'success',
    'id'      => $record['id'],
    'emailed' => (bool) $mailed,
    'message' => 'Thank you — you are on the list.',
]);
