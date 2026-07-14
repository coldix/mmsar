<?php
/**
 * Public community list (no emails, no IPs).
 * GET → { result, counts, entries: [{ name, intent, intent_label, roles, date }] }
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['result' => 'error', 'message' => 'GET only']);
    exit;
}

$dataFile = dirname(__DIR__) . '/data/submissions.json';

$labels = [
    'support'    => 'Supports local management',
    'volunteer'  => 'Supports local + offers to help',
    'informed'   => 'Stay informed',
    'status_quo' => 'Fine with how it is run now',
];

$list = [];
if (is_file($dataFile)) {
    $raw = file_get_contents($dataFile);
    $decoded = json_decode($raw ?: '[]', true);
    if (is_array($decoded)) {
        $list = $decoded;
    }
}

$counts = [
    'total'      => 0,
    'public'     => 0,
    'support'    => 0,
    'volunteer'  => 0,
    'informed'   => 0,
    'status_quo' => 0,
];

$entries = [];
foreach ($list as $row) {
    if (!is_array($row)) {
        continue;
    }
    $counts['total']++;
    $intent = (string) ($row['intent'] ?? 'support');
    if (isset($counts[$intent])) {
        $counts[$intent]++;
    }

    // Public by default for new form; respect explicit false
    $public = array_key_exists('public', $row) ? (bool) $row['public'] : true;
    if (!$public) {
        continue;
    }

    // Public display is Alias only (never email)
    $alias = trim((string) ($row['alias'] ?? $row['name'] ?? ''));
    if ($alias === '' || str_contains($alias, '@')) {
        $alias = 'Local resident';
    }

    $counts['public']++;
    $roles = $row['roles'] ?? [];
    if (!is_array($roles)) {
        $roles = [];
    }
    $roles = array_values(array_filter(array_map('strval', $roles)));

    $connLabels = $row['connection_labels'] ?? [];
    if (!is_array($connLabels) || count($connLabels) === 0) {
        // Rebuild short labels from keys if needed
        $map = [
            'live_here'       => 'Lives here',
            'boat_here'       => 'Boats here',
            'family_friends'  => 'Family/friends live or boat here',
            'interested'      => 'Following / interested',
            'msar_experience' => 'Marine rescue / emergency experience',
        ];
        $connLabels = [];
        $keys = $row['connection'] ?? [];
        if (is_array($keys)) {
            foreach ($keys as $k) {
                if (isset($map[$k])) {
                    $connLabels[] = $map[$k];
                }
            }
        }
    }
    $connLabels = array_values(array_filter(array_map('strval', $connLabels)));

    $date = (string) ($row['received_at'] ?? '');
    if ($date !== '') {
        try {
            $dt = new DateTimeImmutable($date);
            $date = $dt->setTimezone(new DateTimeZone('Australia/Melbourne'))->format('j M Y');
        } catch (Exception $e) {
            $date = substr($date, 0, 10);
        }
    }

    $entries[] = [
        'alias'              => $alias,
        'name'               => $alias, // backward compatible for front end
        'intent'             => $intent,
        'intent_label'       => $labels[$intent] ?? $intent,
        'connection'         => $row['connection'] ?? [],
        'connection_labels'  => $connLabels,
        'roles'              => $roles,
        'date'               => $date,
    ];
}

// Newest first
$entries = array_reverse($entries);

echo json_encode([
    'result'  => 'success',
    'counts'  => $counts,
    'entries' => $entries,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
