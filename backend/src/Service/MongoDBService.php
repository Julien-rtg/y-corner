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
            ->setMessage($message);

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
}
