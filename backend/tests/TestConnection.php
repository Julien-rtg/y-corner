<?php

namespace App\Tests;

use Ratchet\ConnectionInterface;

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
