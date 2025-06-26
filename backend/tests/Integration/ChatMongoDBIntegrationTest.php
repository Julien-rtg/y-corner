<?php

namespace App\Tests\Integration;

use App\Document\ChatMessage;
use App\Service\MongoDBService;
use App\Service\WebsocketService;
use App\Tests\TestConnection;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Ratchet\ConnectionInterface;

class ChatMongoDBIntegrationTest extends KernelTestCase
{
    private MongoDBService $mongoDBService;
    private WebsocketService $websocketService;
    private DocumentManager $documentManager;
    private TestConnection $connection;
    private string $testUserId1 = 'test-user-1';
    private string $testUserId2 = 'test-user-2';
    
    protected function setUp(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        
        $this->mongoDBService = $container->get(MongoDBService::class);
        $this->documentManager = $container->get(DocumentManager::class);
        
        $this->websocketService = new WebsocketService($this->mongoDBService);
        
        $this->connection = new TestConnection();
        
        $this->cleanupTestMessages();
    }
    
    protected function tearDown(): void
    {
        $this->cleanupTestMessages();
        
        parent::tearDown();
    }
    
    private function cleanupTestMessages(): void
    {
        $qb = $this->documentManager->createQueryBuilder(ChatMessage::class);
        $qb->remove()
            ->addOr(
                $qb->expr()->field('fromUserId')->in([$this->testUserId1, $this->testUserId2]),
                $qb->expr()->field('toUserId')->in([$this->testUserId1, $this->testUserId2])
            )
            ->getQuery()
            ->execute();
        
        $this->documentManager->flush();
    }
    
    public function testSaveAndRetrieveMessage(): void
    {
        $from = new TestConnection();
        $from->userId = $this->testUserId1;
        
        $messageText = 'Hello, this is an integration test message!';
        $msg = json_encode([
            'from' => $this->testUserId1,
            'to' => $this->testUserId2,
            'message' => $messageText
        ]);
        
        $this->connection->userId = $this->testUserId2;
        $userConnections = new \ReflectionProperty($this->websocketService, 'userConnections');
        $userConnections->setAccessible(true);
        $userConnections->setValue($this->websocketService, [$this->testUserId2 => $this->connection]);
        
        $messageReceived = false;
        $this->connection->setSendCallback(function($data) use (&$messageReceived) {
            $messageData = json_decode($data, true);
            if ($messageData['type'] === 'new_message') {
                $messageReceived = true;
            }
        });
        
        $this->websocketService->onMessage($from, $msg);
        
        $this->assertTrue($messageReceived, 'Message was not sent to recipient');
        
        $savedMessage = $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->field('fromUserId')->equals($this->testUserId1)
            ->field('toUserId')->equals($this->testUserId2)
            ->field('message')->equals($messageText)
            ->getQuery()
            ->getSingleResult();
        
        $this->assertNotNull($savedMessage, 'Message was not saved to MongoDB');
        $this->assertEquals($this->testUserId1, $savedMessage->getFromUserId());
        $this->assertEquals($this->testUserId2, $savedMessage->getToUserId());
        $this->assertEquals($messageText, $savedMessage->getMessage());
        $this->assertFalse($savedMessage->isSeen());
    }
    
    public function testMarkMessagesAsSeen(): void
    {
        $chatMessage = new ChatMessage();
        $chatMessage->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Test message for marking as seen')
            ->setSeen(false);
            
        $this->documentManager->persist($chatMessage);
        $this->documentManager->flush();
        
        $from = new TestConnection();
        $from->userId = $this->testUserId2; 
        
        $this->connection->userId = $this->testUserId1; 
        $userConnections = new \ReflectionProperty($this->websocketService, 'userConnections');
        $userConnections->setAccessible(true);
        $userConnections->setValue($this->websocketService, [$this->testUserId1 => $this->connection]);
        
        $seenNotificationReceived = false;
        $this->connection->setSendCallback(function($data) use (&$seenNotificationReceived) {
            $messageData = json_decode($data, true);
            if ($messageData['type'] === 'messages_seen' && $messageData['by'] === $this->testUserId2) {
                $seenNotificationReceived = true;
            }
        });
        
        $msg = json_encode([
            'type' => 'mark_seen',
            'from' => $this->testUserId2,
            'to' => $this->testUserId1
        ]);
        
        $this->websocketService->onMessage($from, $msg);
        
        $this->assertTrue($seenNotificationReceived, 'Seen notification was not sent');
        
        $this->documentManager->clear();
        
        $updatedMessage = $this->documentManager->createQueryBuilder(ChatMessage::class)
            ->field('fromUserId')->equals($this->testUserId1)
            ->field('toUserId')->equals($this->testUserId2)
            ->getQuery()
            ->getSingleResult();
        
        $this->assertNotNull($updatedMessage, 'Message not found in database');
        $this->assertTrue($updatedMessage->isSeen(), 'Message was not marked as seen in the database');
    }
}
