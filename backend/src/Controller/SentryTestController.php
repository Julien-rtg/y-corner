<?php

  namespace App\Controller;

  use App\Service\SentryService;
  use Psr\Log\LoggerInterface;
  use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
  use Symfony\Component\HttpFoundation\Response;
  use Symfony\Component\Routing\Attribute\Route;

  class SentryTestController extends AbstractController {
    private $logger;
    private $sentryService;

    public function __construct(LoggerInterface $logger, SentryService $sentryService)
    {
      $this->logger = $logger;
      $this->sentryService = $sentryService;
    }

    #[Route('/sentry-test', name: 'sentry_test')]
    public function testLog(): Response
    {
      try {
        $this->logger->error('My custom logged error.');
        
        try {
            throw new \Exception('Example exception from Test Controller 4.');
        } catch (\Exception $e) {
            $this->sentryService->captureException($e, [
                'controller' => 'SentryTestController',
                'method' => 'testLog'
            ]);
        }
        
        return new Response(
            '<html><body>
                <h1>Sentry Test</h1>
                <p>Sentry test message sent with event ID: ' . ($eventId ?? 'null') . '</p>
                <p>Exception was captured and sent to Sentry.</p>
            </body></html>'
        );
      } catch (\Throwable $e) {
        // Even if something fails, try to send the error to Sentry
        $this->sentryService->captureException($e);
        
        return new Response(
            '<html><body>Error: ' . $e->getMessage() . '</body></html>'
        );
      }
    }
  }