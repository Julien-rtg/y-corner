<?php

namespace App\Service;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use App\Service\MongoDBService;

class WebsocketService implements MessageComponentInterface
{

    protected $clients;
    protected $userConnections = [];
    protected $mongoDBService;

    public function __construct(MongoDBService $mongoDBService) {
        $this->clients = new \SplObjectStorage;
        $this->mongoDBService = $mongoDBService;
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
        $queryString = parse_url($conn->httpRequest->getUri(), PHP_URL_QUERY);
        parse_str($queryString, $queryParams);
        
        $userId = isset($queryParams['userId']) ? $queryParams['userId'] : throw new \Exception('User ID is required');
        
        $conn->userId = $userId;
        
        $this->setUserConnection($userId, $conn);
        echo "New connection! (User ID: {$userId})\n";
    }

    public function setUserConnection($userId, ConnectionInterface $conn) {
        $this->userConnections[$userId] = $conn;
        echo "Connection set for user $userId\n";
    }

    public function sendToUser($userId, $message) {
        if (isset($this->userConnections[$userId])) {
            $this->userConnections[$userId]->send($message);
            return true;
        } else {
            return false;
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (isset($data['to']) && isset($data['message']) && isset($data['from'])) {
            $fromUserId = $data['from'];
            $toUserId = $data['to'];
            $message = $data['message'];
            
            try {
                $chatMessage = $this->mongoDBService->saveMessage($fromUserId, $toUserId, $message);
                echo "Message saved to database\n";
                
                $this->sendToUser($toUserId, json_encode([
                    'type' => 'new_message',
                    'from' => $fromUserId,
                    'message' => $message,
                    'id' => $chatMessage->getId(),
                    'createdAt' => $chatMessage->getCreatedAt()->format('c')
                ]));
            } catch (\Exception $e) {
                echo "Error saving message to database: {$e->getMessage()}\n";
            }
        } 
        else if (isset($data['type']) && $data['type'] === 'mark_seen' && isset($data['from']) && isset($data['to'])) {
            $fromUserId = $data['from'];
            $toUserId = $data['to'];
            
            try {
                $this->mongoDBService->markMessagesAsSeen($fromUserId, $toUserId);
                echo "Messages marked as seen\n";
                
                if (isset($this->userConnections[$toUserId])) {
                    $this->sendToUser($toUserId, json_encode([
                        'type' => 'messages_seen',
                        'by' => $fromUserId
                    ]));
                }
            } catch (\Exception $e) {
                echo "Error marking messages as seen: {$e->getMessage()}\n";
            }
        }
        else {
            echo "Invalid message format\n";
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        unset($this->userConnections[$conn->userId]);
        echo "Connection for user {$conn->userId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Une erreur est survenue : {$e->getMessage()}\n";

        $conn->close();
    }
}