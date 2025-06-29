<?php

namespace App\Service;

use Sentry\ClientBuilder;
use Sentry\State\Scope;

class SentryService
{
    private string $dsn;
    private string $environment;
    private string $release;
    
    public function __construct()
    {
        $this->dsn = $_ENV['SENTRY_DSN'] ?? '';
        $this->environment = $_ENV['APP_ENV'] ?? 'dev';
        $this->release = '1.0.0';
    }
    /**
     * Log an exception to Sentry
     *
     * @param \Throwable $exception The exception to log
     * @param array $context Additional context data to include
     * @return string|null The event ID if successful, null otherwise
     */
    public function captureException(\Throwable $exception, array $context = []): ?string
    {
        try {
            $options = [
                'dsn' => $this->dsn,
                'environment' => $this->environment,
                'release' => $this->release,
                'http_timeout' => (float)($_ENV['SENTRY_OPTIONS__http_timeout'] ?? 10),
                'http_connect_timeout' => (float)($_ENV['SENTRY_OPTIONS__http_connect_timeout'] ?? 10),
                'http_ssl_verify_peer' => false,
            ];
            
            $client = ClientBuilder::create($options)->getClient();
            
            $eventId = $client->captureException($exception);
            
            $client->flush(10);
            
            return $eventId;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Log a message to Sentry
     *
     * @param string $message The message to log
     * @param array $context Additional context data to include
     * @param string $level The log level (error, warning, info, etc.)
     * @return string|null The event ID if successful, null otherwise
     */
    public function captureMessage(string $message, array $context = [], string $level = 'error'): ?string
    {
        try {
            $options = [
                'dsn' => $this->dsn,
                'environment' => $this->environment,
                'release' => $this->release,
                'http_timeout' => (float)($_ENV['SENTRY_OPTIONS__http_timeout'] ?? 10),
                'http_connect_timeout' => (float)($_ENV['SENTRY_OPTIONS__http_connect_timeout'] ?? 10),
                'http_ssl_verify_peer' => false,
            ];
            
            $client = ClientBuilder::create($options)->getClient();
            
            $eventId = $client->captureMessage($message, $level);
            
            $client->flush(10);
            
            return $eventId;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
