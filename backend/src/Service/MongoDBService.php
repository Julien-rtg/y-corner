<?php

namespace App\Service;

use App\Document\ChatMessage;
use Doctrine\ODM\MongoDB\DocumentManager;

class MongoDBService
{
    private $documentManager;

    public function __construct(DocumentManager $documentManager)
    {
        $this->documentManager = $documentManager;
    }

    public function saveMessage(string $fromUserId, string $toUserId, string $message): ChatMessage
    {
        $chatMessage = new ChatMessage();
        $chatMessage->setFromUserId($fromUserId)
            ->setToUserId($toUserId)
            ->setMessage($message)
            ->setSeen(false);

        $this->documentManager->persist($chatMessage);
        $this->documentManager->flush();

        return $chatMessage;
    }

    public function getMessagesBetweenUsers(string $user1Id, string $user2Id): array
    {
        return $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->addOr(
                $this->documentManager->createQueryBuilder(ChatMessage::class)
                    ->field('fromUserId')->equals($user1Id)
                    ->field('toUserId')->equals($user2Id)
                    ->getQueryArray(),
                $this->documentManager->createQueryBuilder(ChatMessage::class)
                    ->field('fromUserId')->equals($user2Id)
                    ->field('toUserId')->equals($user1Id)
                    ->getQueryArray()
            )
            ->sort('createdAt', 'asc')
            ->getQuery()
            ->execute()
            ->toArray();
    }

    public function markMessagesAsSeen(string $toUserId, string $fromUserId): void
    {
        $qb = $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->field('fromUserId')->equals($fromUserId)
            ->field('toUserId')->equals($toUserId)
            ->field('seen')->equals(false)
            ->updateMany()
            ->field('seen')->set(true);
            
        $qb->getQuery()->execute();
        $this->documentManager->flush();
    }
    
    public function getUnreadMessageCount(string $userId): array
    {
        $result = [];
        
        $unreadMessages = $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->field('toUserId')->equals($userId)
            ->field('seen')->equals(false)
            ->getQuery()
            ->execute()
            ->toArray();
            
        foreach ($unreadMessages as $message) {
            $fromUserId = $message->getFromUserId();
            if (!isset($result[$fromUserId])) {
                $result[$fromUserId] = 0;
            }
            $result[$fromUserId]++;
        }
        
        return $result;
    }
    
    public function getConversations(string $userId): array
    {
        $messages = $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->addOr(
                $this->documentManager->createQueryBuilder(ChatMessage::class)
                    ->field('fromUserId')->equals($userId)
                    ->getQueryArray(),
                $this->documentManager->createQueryBuilder(ChatMessage::class)
                    ->field('toUserId')->equals($userId)
                    ->getQueryArray(),
            )
            ->sort('createdAt', 'asc')
            ->getQuery()
            ->execute()
            ->toArray();
            
        $conversations = [];
        foreach ($messages as $message) {
            $partnerId = ($message->getFromUserId() === $userId) 
                ? $message->getToUserId() 
                : $message->getFromUserId();
                
            if (!isset($conversations[$partnerId])) {
                $conversations[$partnerId] = [
                    'id' => $message->getId(),
                    'recipientId' => $partnerId,
                    'messages' => [],
                    'lastMessageDate' => $message->getCreatedAt(),
                ];
            }
            
            $conversations[$partnerId]['messages'][] = $message;
            
            if ($message->getCreatedAt() > $conversations[$partnerId]['lastMessageDate']) {
                $conversations[$partnerId]['lastMessageDate'] = $message->getCreatedAt();
            }
        }
        
        usort($conversations, function($a, $b) {
            return $b['lastMessageDate'] <=> $a['lastMessageDate'];
        });
        
        return array_values($conversations);
    }
}
