<?php
declare(strict_types=1);

// CONFIG SMTP HOSTINGER
$smtpHost = 'smtp.hostinger.com';
$smtpPort = 465;
$smtpUser = 'contato@emassets.com.br';
$smtpPass = 'em@061721';

$fromEmail = 'contato@emassets.com.br';
$fromName = 'E&M ASSETS - Site';
$toEmail = 'contato@emassets.com.br';
$subject = 'Novo lead - Site E&M ASSETS';

function redirectWithStatus(string $status): void {
    header('Location: /?enviado=' . rawurlencode($status) . '#contato');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirectWithStatus('erro');
}

// Honeypot anti-spam
$honeypot = trim((string)($_POST['website'] ?? ''));
if ($honeypot !== '') {
    redirectWithStatus('ok');
}

$nome = trim((string)($_POST['nome'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$telefone = trim((string)($_POST['telefone'] ?? ''));
$objetivo = trim((string)($_POST['objetivo'] ?? ''));
$mensagem = trim((string)($_POST['mensagem'] ?? ''));

if ($nome === '' || $email === '' || $telefone === '' || $objetivo === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirectWithStatus('erro');
}

$safe = static function (string $text): string {
    $text = str_replace(["\r", "\n"], ' ', $text);
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$htmlBody = <<<HTML
<html>
  <body style="font-family:Arial,sans-serif;color:#1a243b;">
    <h2>Novo lead pelo site da E&amp;M ASSETS</h2>
    <p><strong>Nome:</strong> {$safe($nome)}</p>
    <p><strong>E-mail:</strong> {$safe($email)}</p>
    <p><strong>Telefone:</strong> {$safe($telefone)}</p>
    <p><strong>Objetivo:</strong> {$safe($objetivo)}</p>
    <p><strong>Mensagem:</strong><br />{$safe($mensagem)}</p>
  </body>
</html>
HTML;

function smtpSendMail(
    string $host,
    int $port,
    string $username,
    string $password,
    string $fromEmail,
    string $fromName,
    string $toEmail,
    string $replyTo,
    string $subject,
    string $htmlBody
): bool {
    $socket = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT
    );

    if (!$socket) {
        return false;
    }

    stream_set_timeout($socket, 20);

    $read = static function ($conn): string {
        $response = '';
        while (($line = fgets($conn, 515)) !== false) {
            $response .= $line;
            if (preg_match('/^\d{3}\s/', $line)) {
                break;
            }
        }
        return $response;
    };

    $write = static function ($conn, string $data): void {
        fwrite($conn, $data . "\r\n");
    };

    $ok = static function (string $response, array $validCodes): bool {
        foreach ($validCodes as $code) {
            if (str_starts_with($response, (string)$code)) {
                return true;
            }
        }
        return false;
    };

    $greet = $read($socket);
    if (!$ok($greet, [220])) {
        fclose($socket);
        return false;
    }

    $write($socket, 'EHLO emassets.com.br');
    $ehlo = $read($socket);
    if (!$ok($ehlo, [250])) {
        fclose($socket);
        return false;
    }

    $write($socket, 'AUTH LOGIN');
    $authLogin = $read($socket);
    if (!$ok($authLogin, [334])) {
        fclose($socket);
        return false;
    }

    $write($socket, base64_encode($username));
    $authUser = $read($socket);
    if (!$ok($authUser, [334])) {
        fclose($socket);
        return false;
    }

    $write($socket, base64_encode($password));
    $authPass = $read($socket);
    if (!$ok($authPass, [235])) {
        fclose($socket);
        return false;
    }

    $write($socket, "MAIL FROM:<{$fromEmail}>");
    $mailFrom = $read($socket);
    if (!$ok($mailFrom, [250])) {
        fclose($socket);
        return false;
    }

    $write($socket, "RCPT TO:<{$toEmail}>");
    $rcpt = $read($socket);
    if (!$ok($rcpt, [250, 251])) {
        fclose($socket);
        return false;
    }

    $write($socket, 'DATA');
    $dataReady = $read($socket);
    if (!$ok($dataReady, [354])) {
        fclose($socket);
        return false;
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "To: <{$toEmail}>";
    $headers[] = "Reply-To: <{$replyTo}>";
    $headers[] = "Subject: {$encodedSubject}";
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: 8bit';

    $messageData = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody;
    // Dot-stuffing
    $messageData = preg_replace('/^\./m', '..', $messageData);
    fwrite($socket, $messageData . "\r\n.\r\n");

    $dataSent = $read($socket);
    if (!$ok($dataSent, [250])) {
        fclose($socket);
        return false;
    }

    $write($socket, 'QUIT');
    fclose($socket);
    return true;
}

$sent = smtpSendMail(
    $smtpHost,
    $smtpPort,
    $smtpUser,
    $smtpPass,
    $fromEmail,
    $fromName,
    $toEmail,
    $email,
    $subject,
    $htmlBody
);

redirectWithStatus($sent ? 'true' : 'erro');
