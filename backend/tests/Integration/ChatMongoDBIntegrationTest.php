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
    private string $testUserId3 = 'test-user-3';
    
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
    
    public function testGetMessagesBetweenUsers(): void
    {
        $message1 = new ChatMessage();
        $message1->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Message 1 from user1 to user2')
            ->setSeen(false);
        
        $message2 = new ChatMessage();
        $message2->setFromUserId($this->testUserId2)
            ->setToUserId($this->testUserId1)
            ->setMessage('Message 2 from user2 to user1')
            ->setSeen(false);
            
        $message3 = new ChatMessage();
        $message3->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId3)
            ->setMessage('Message 3 from user1 to user3')
            ->setSeen(false);
        
        $this->documentManager->persist($message1);
        $this->documentManager->persist($message2);
        $this->documentManager->persist($message3);
        $this->documentManager->flush();
        
        $messages = $this->mongoDBService->getMessagesBetweenUsers($this->testUserId1, $this->testUserId2);
        
        $this->assertCount(2, $messages, 'Should retrieve exactly 2 messages between the users');
        
        $foundMessages = [
            'Message 1 from user1 to user2' => false,
            'Message 2 from user2 to user1' => false
        ];
        
        foreach ($messages as $message) {
            $this->assertContains($message->getMessage(), array_keys($foundMessages), 'Retrieved unexpected message');
            $foundMessages[$message->getMessage()] = true;
        }
        
        foreach ($foundMessages as $messageText => $found) {
            $this->assertTrue($found, "Message '$messageText' was not retrieved");
        }
    }
    
    public function testGetUnreadMessageCount(): void
    {
        $message1 = new ChatMessage();
        $message1->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Unread message 1')
            ->setSeen(false);
        
        $message2 = new ChatMessage();
        $message2->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Unread message 2')
            ->setSeen(false);
            
        $message3 = new ChatMessage();
        $message3->setFromUserId($this->testUserId3)
            ->setToUserId($this->testUserId2)
            ->setMessage('Unread message from user3')
            ->setSeen(false);
            
        $message4 = new ChatMessage();
        $message4->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Read message')
            ->setSeen(true);
        
        $this->documentManager->persist($message1);
        $this->documentManager->persist($message2);
        $this->documentManager->persist($message3);
        $this->documentManager->persist($message4);
        $this->documentManager->flush();
        
        $unreadCounts = $this->mongoDBService->getUnreadMessageCount($this->testUserId2);
        
        $this->assertArrayHasKey($this->testUserId1, $unreadCounts, 'Should have unread messages from user1');
        $this->assertArrayHasKey($this->testUserId3, $unreadCounts, 'Should have unread messages from user3');
        
        $this->assertEquals(2, $unreadCounts[$this->testUserId1], 'Should have 2 unread messages from user1');
        $this->assertEquals(1, $unreadCounts[$this->testUserId3], 'Should have 1 unread message from user3');
    }
    
    public function testGetConversations(): void
    {
        $now = new \DateTime();
        
        $message1 = new ChatMessage();
        $message1->setFromUserId($this->testUserId1)
            ->setToUserId($this->testUserId2)
            ->setMessage('Message to user2')
            ->setSeen(false)
            ->setCreatedAt(clone $now);
        
        $message2 = new ChatMessage();
        $message2->setFromUserId($this->testUserId3)
            ->setToUserId($this->testUserId1)
            ->setMessage('Message from user3')
            ->setSeen(false)
            ->setCreatedAt((clone $now)->modify('+1 minute'));
            
        $message3 = new ChatMessage();
        $message3->setFromUserId($this->testUserId2)
            ->setToUserId($this->testUserId1)
            ->setMessage('Reply from user2')
            ->setSeen(true)
            ->setCreatedAt((clone $now)->modify('-1 minute'));
        
        $this->documentManager->persist($message1);
        $this->documentManager->persist($message2);
        $this->documentManager->persist($message3);
        $this->documentManager->flush();
        
        $conversations = $this->mongoDBService->getConversations($this->testUserId1);
        
        $this->assertCount(2, $conversations, 'Should have 2 conversations');
        
        $this->assertEquals($this->testUserId3, $conversations[0]['recipientId'], 'First conversation should be with user3 (most recent)');
        $this->assertEquals($this->testUserId2, $conversations[1]['recipientId'], 'Second conversation should be with user2');
        
        $this->assertCount(1, $conversations[0]['messages'], 'Conversation with user3 should have 1 message');
        $this->assertCount(2, $conversations[1]['messages'], 'Conversation with user2 should have 2 messages');
    }
}
