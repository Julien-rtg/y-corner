<?php

namespace App\Controller;

use App\Service\MongoDBService;
use App\Service\SentryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/chat')]
class ChatController extends AbstractController
{
    private MongoDBService $mongoDBService;
    private SentryService $sentryService;

    public function __construct(MongoDBService $mongoDBService, SentryService $sentryService)
    {
        $this->mongoDBService = $mongoDBService;
        $this->sentryService = $sentryService;
    }
    
    private function executeWithErrorHandling(callable $callback, array $context = []): JsonResponse
    {
        try {
            return $callback();
        } catch (\Throwable $exception) {
            $context['controller'] = static::class;
            $context['method'] = debug_backtrace()[1]['function'] ?? 'unknown';
            
            $this->sentryService->captureException($exception, $context);
            
            if ($exception instanceof \InvalidArgumentException) {
                return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
            }
            
            return new JsonResponse(['message' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/messages', name: 'app_chat_messages', methods: ['GET'])]
    public function getMessages(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($request) {
            $user1Id = $request->query->get('user1Id');
            $user2Id = $request->query->get('user2Id');

            if (!$user1Id || !$user2Id) {
                throw new \InvalidArgumentException('Paramètres requis manquants');
            }

            $messages = $this->mongoDBService->getMessagesBetweenUsers($user1Id, $user2Id);
            return $this->json($messages);
        }, ['user1Id' => $request->query->get('user1Id'), 'user2Id' => $request->query->get('user2Id')]);
    }

    #[Route('/conversations', name: 'app_chat_conversations', methods: ['GET'])]
    public function getConversations(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($request) {
            $userId = $request->query->get('userId');

            if (!$userId) {
                throw new \InvalidArgumentException('Paramètre requis manquant: userId');
            }

            $conversations = $this->mongoDBService->getConversations($userId);
            return $this->json($conversations);
        }, ['userId' => $request->query->get('userId')]);
    }
    
    #[Route('/unread-count', name: 'app_chat_unread_count', methods: ['GET'])]
    public function getUnreadCount(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($request) {
            $userId = $request->query->get('userId');

            if (!$userId) {
                throw new \InvalidArgumentException('Paramètre requis manquant: userId');
            }

            $unreadCounts = $this->mongoDBService->getUnreadMessageCount($userId);
            $totalUnread = array_sum($unreadCounts);
            return $this->json(['unreadCounts' => $unreadCounts, 'totalUnread' => $totalUnread]);
        }, ['userId' => $request->query->get('userId')]);
    }
}
