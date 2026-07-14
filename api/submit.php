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

$email = filter_var(s($in['email'] ?? $in['Email'] ?? '', 200), FILTER_VALIDATE_EMAIL);
if ($email === false) {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'A valid email is required.']);
    exit;
}

$name = s($in['name'] ?? $in['Name'] ?? '', 120);
$intent = s($in['intent'] ?? $in['Intent'] ?? 'support', 40);
$allowedIntents = ['support', 'volunteer', 'informed', 'status_quo'];
if (!in_array($intent, $allowedIntents, true)) {
    $intent = 'support';
}

// Public list is default; emails always stay private
$publicRaw = $in['public'] ?? $in['Public'] ?? true;
$public = !($publicRaw === false || $publicRaw === '0' || $publicRaw === 0 || $publicRaw === 'false' || $publicRaw === 'off');

if ($public && $name === '') {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'message' => 'A name (or first name / alias) is required for the public list.']);
    exit;
}

$roles = [];
$roleKeys = ['crew' => 'Crew', 'skipper' => 'Skipper', 'radio' => 'Radio', 'admin' => 'Admin', 'general' => 'General',
    'Crew' => 'Crew', 'Skipper' => 'Skipper', 'Radio' => 'Radio', 'Admin' => 'Admin', 'General' => 'General'];
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

$record = [
    'id'          => bin2hex(random_bytes(8)),
    'received_at' => gmdate('c'),
    'name'        => $name,
    'email'       => $email,
    'intent'      => $intent,
    'public'      => $public,
    'roles'       => $roles,
    'other'       => $other,
    'comments'    => $comments,
    'ip'          => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent'  => s($_SERVER['HTTP_USER_AGENT'] ?? '', 300),
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

// ─── Append JSON (file lock) ──────────────────────────────
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
    'support'    => 'Support local management',
    'volunteer'  => 'Offer to help (volunteer)',
    'informed'   => 'Stay informed',
    'status_quo' => 'Fine with how it is run now',
][$intent] ?? $intent;

$rolesText = $roles ? implode(', ', $roles) : '—';
$subject = sprintf('[%s] New %s — %s', SITE_NAME, $intent, $name !== '' ? $name : $email);

$body = "New MMSAR website submission\n";
$body .= "============================\n\n";
$body .= "When:    " . $record['received_at'] . " (UTC)\n";
$body .= "Intent:  " . $intentLabel . "\n";
$body .= "Public:  " . ($public ? 'Yes — on public list' : 'No — private only') . "\n";
$body .= "Name:    " . ($name !== '' ? $name : '(not given)') . "\n";
$body .= "Email:   " . $email . "\n";
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
