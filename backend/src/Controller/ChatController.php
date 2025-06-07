<?php

namespace App\Controller;

use App\Service\MongoDBService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/chat')]
class ChatController extends AbstractController
{
    private MongoDBService $mongoDBService;

    public function __construct(MongoDBService $mongoDBService)
    {
        $this->mongoDBService = $mongoDBService;
    }

    #[Route('/messages', name: 'app_chat_messages', methods: ['GET'])]
    public function getMessages(Request $request): JsonResponse
    {
        $user1Id = $request->query->get('user1Id');
        $user2Id = $request->query->get('user2Id');

        if (!$user1Id || !$user2Id) {
            return $this->json(['error' => 'Missing required parameters'], 400);
        }

        try {
            $messages = $this->mongoDBService->getMessagesBetweenUsers($user1Id, $user2Id);
            return $this->json($messages);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/conversations', name: 'app_chat_conversations', methods: ['GET'])]
    public function getConversations(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');

        if (!$userId) {
            return $this->json(['error' => 'Missing required parameter: userId'], 400);
        }

        try {
            $conversations = $this->mongoDBService->getConversations($userId);
            return $this->json($conversations);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
    
    #[Route('/unread-count', name: 'app_chat_unread_count', methods: ['GET'])]
    public function getUnreadCount(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');

        if (!$userId) {
            return $this->json(['error' => 'Missing required parameter: userId'], 400);
        }

        try {
            $unreadCounts = $this->mongoDBService->getUnreadMessageCount($userId);
            $totalUnread = array_sum($unreadCounts);
            return $this->json(['unreadCounts' => $unreadCounts, 'totalUnread' => $totalUnread]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
