<?php

namespace App\Tests\Service;

use App\Document\ChatMessage;
use App\Service\MongoDBService;
use App\Service\WebsocketService;
use PHPUnit\Framework\TestCase;
use Ratchet\ConnectionInterface;

class WebsocketServiceTest extends TestCase
{
    private $mongoDBService;
    private $websocketService;
    private $connection;

    protected function setUp(): void
    {
        $this->mongoDBService = $this->createMock(MongoDBService::class);
        
        $this->websocketService = new WebsocketService($this->mongoDBService);
        
        $this->connection = $this->createMock(ConnectionInterface::class);
    }

    public function testSendToUserSuccessful(): void
    {
        $userId = '123';
        $message = json_encode([
            'type' => 'new_message',
            'from' => '456',
            'message' => 'Hello, this is a test message!',
            'id' => '789',
            'createdAt' => (new \DateTime())->format('c')
        ]);

        $reflectionClass = new \ReflectionClass(WebsocketService::class);
        $reflectionProperty = $reflectionClass->getProperty('userConnections');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->websocketService, [$userId => $this->connection]);

        $this->connection->expects($this->once())
            ->method('send')
            ->with($message);

        $result = $this->websocketService->sendToUser($userId, $message);
        $this->assertTrue($result);
    }

    public function testSendToUserFailed(): void
    {
        $nonExistentUserId = '999';
        $message = 'Test message';

        $result = $this->websocketService->sendToUser($nonExistentUserId, $message);
        $this->assertFalse($result);
    }
}
