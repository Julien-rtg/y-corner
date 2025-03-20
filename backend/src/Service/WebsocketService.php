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
        $this->setUserConnection($conn->resourceId, $conn);
        echo "New connection! ({$conn->resourceId})\n";
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
            echo "There is no user with ID {$userId}\n";
            return false;
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (isset($data['to']) && isset($data['message']) && isset($data['from'])) {
            // Store message in MongoDB
            $fromUserId = $data['from'];
            $toUserId = $data['to'];
            $message = $data['message'];
            
            try {
                // Save message to MongoDB
                $this->mongoDBService->saveMessage($fromUserId, $toUserId, $message);
                echo "Message saved to database\n";
            } catch (\Exception $e) {
                echo "Error saving message to database: {$e->getMessage()}\n";
            }
            
            // Send message to recipient
            $this->sendToUser($toUserId, json_encode([
                'from' => $fromUserId,
                'message' => $message
            ]));
        } else {
            echo "Need 'to', 'message' and 'from' keys\n";
        }
    }

    public function onClose(ConnectionInterface $conn) {
        //  La connexion est fermée, retirez-la, car nous ne pouvons plus lui envoyer de messages.
        $this->clients->detach($conn);
        unset($this->userConnections[$conn->resourceId]);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Une erreur est survenue : {$e->getMessage()}\n";

        $conn->close();
    }
}