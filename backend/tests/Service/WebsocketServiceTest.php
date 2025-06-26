<?php

namespace App\Tests\Service;

use App\Document\ChatMessage;
use App\Service\MongoDBService;
use App\Service\WebsocketService;
use PHPUnit\Framework\TestCase;
use Ratchet\ConnectionInterface;
use Psr\Http\Message\RequestInterface;

/**
 * Custom test connection class that implements ConnectionInterface
 * and allows setting properties without deprecation warnings
 */
class TestConnection implements ConnectionInterface
{
    public $userId;
    public $httpRequest;
    private $sendCallback;
    
    public function __construct($userId = null, $httpRequest = null)
    {   
        $this->userId = $userId;
        $this->httpRequest = $httpRequest;
    }
    
    public function setSendCallback(callable $callback)
    {   
        $this->sendCallback = $callback;
    }
    
    public function send($data)
    {
        if ($this->sendCallback) {
            call_user_func($this->sendCallback, $data);
        }
        return $this;
    }
    
    public function close() {}
    
    public function getRemoteAddress() { return '127.0.0.1'; }
}

class WebsocketServiceTest extends TestCase
{
    private $mongoDBService;
    private $websocketService;
    private $connection;

    protected function setUp(): void
    {
        $this->mongoDBService = $this->createMock(MongoDBService::class);
        
        $this->websocketService = new WebsocketService($this->mongoDBService);
        
        $this->connection = new TestConnection();
    }

    protected function webSocketConnection($userId): void
    {
        $reflectionClass = new \ReflectionClass(WebsocketService::class);
        $reflectionProperty = $reflectionClass->getProperty('userConnections');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->websocketService, [$userId => $this->connection]);
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
        
        $messageReceived = false;
        $this->connection->setSendCallback(function($data) use ($message, &$messageReceived) {
            if ($data === $message) {
                $messageReceived = true;
            }
        });

        $this->webSocketConnection($userId);

        $result = $this->websocketService->sendToUser($userId, $message);
        $this->assertTrue($result);
        $this->assertTrue($messageReceived, 'Message was not sent with the correct content');
    }

    public function testSendToUserFailed(): void
    {
        $nonExistentUserId = '999';
        $message = 'Test message';

        $result = $this->websocketService->sendToUser($nonExistentUserId, $message);
        $this->assertFalse($result);
    }

    public function testOnMessageProcessesNewMessageCorrectly(): void
    {
        $from = new TestConnection();
        
        $chatMessage = new ChatMessage();
        $chatMessage->setFromUserId('456')
            ->setToUserId('123')
            ->setMessage('Test message')
            ->setId('789');
        
        $this->mongoDBService->expects($this->once())
            ->method('saveMessage')
            ->with('456', '123', 'Test message')
            ->willReturn($chatMessage);
        
        $this->webSocketConnection('123');
        
        $messageVerified = false;
        $this->connection->setSendCallback(function($arg) use (&$messageVerified) {
            $data = json_decode($arg, true);
            if ($data['type'] === 'new_message' && 
                $data['from'] === '456' &&
                $data['message'] === 'Test message') {
                $messageVerified = true;
            }
        });
        
        $msg = json_encode([
            'from' => '456',
            'to' => '123',
            'message' => 'Test message'
        ]);
        
        $this->websocketService->onMessage($from, $msg);
    }

    public function testMarkMessagesAsSeenMessageProcessing(): void
    {
        $from = new TestConnection();
        
        $this->mongoDBService->expects($this->once())
            ->method('markMessagesAsSeen')
            ->with('456', '123');
        
        $this->webSocketConnection('123');
        
        $messageVerified = false;
        $this->connection->setSendCallback(function($arg) use (&$messageVerified) {
            $data = json_decode($arg, true);
            if ($data['type'] === 'messages_seen' && 
                $data['by'] === '456') {
                $messageVerified = true;
            }
        });
        
        $msg = json_encode([
            'type' => 'mark_seen',
            'from' => '456',
            'to' => '123'
        ]);
        
        $this->websocketService->onMessage($from, $msg);
    }

    public function testOnOpenSetsUserConnection(): void
    {
        $uri = $this->createMock(\Psr\Http\Message\UriInterface::class);
        $uri->method('__toString')
            ->willReturn('ws://localhost:8080?userId=123');
            
        $httpRequest = $this->createMock(RequestInterface::class);
        $httpRequest->method('getUri')
            ->willReturn($uri);
        
        $conn = new TestConnection(null, $httpRequest);
        
        $clients = new \SplObjectStorage();
        $reflectionClass = new \ReflectionClass(WebsocketService::class);
        $clientsProperty = $reflectionClass->getProperty('clients');
        $clientsProperty->setAccessible(true);
        $clientsProperty->setValue($this->websocketService, $clients);
        
        $this->websocketService->onOpen($conn);
        
        $this->assertEquals(1, $clients->count());
        
        $reflectionProperty = $reflectionClass->getProperty('userConnections');
        $reflectionProperty->setAccessible(true);
        $userConnections = $reflectionProperty->getValue($this->websocketService);
        
        $this->assertArrayHasKey('123', $userConnections);
        $this->assertSame($conn, $userConnections['123']);
    }

    public function testOnCloseRemovesConnection(): void
    {
        $conn = new TestConnection('123');
        
        $clients = new \SplObjectStorage();
        $clients->attach($conn);
        
        $reflectionClass = new \ReflectionClass(WebsocketService::class);
        $clientsProperty = $reflectionClass->getProperty('clients');
        $clientsProperty->setAccessible(true);
        $clientsProperty->setValue($this->websocketService, $clients);
        
        $connectionsProperty = $reflectionClass->getProperty('userConnections');
        $connectionsProperty->setAccessible(true);
        $connectionsProperty->setValue($this->websocketService, ['123' => $conn]);
        
        $this->websocketService->onClose($conn);
        
        $this->assertCount(0, $clients);
        $userConnections = $connectionsProperty->getValue($this->websocketService);
        $this->assertArrayNotHasKey('123', $userConnections);
    }

    public function testOnErrorClosesConnection(): void
    {
        $closeCalled = false;
        
        $conn = new class extends TestConnection {
            public $closeCalled = false;
            
            public function close() {
                $this->closeCalled = true;
            }
        };
        
        $exception = new \Exception('Test exception');
        
        $this->websocketService->onError($conn, $exception);
        
        $this->assertTrue($conn->closeCalled, 'Connection close method was not called');
    }
}
