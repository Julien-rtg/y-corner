<?php

declare(strict_types=1);

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: "messages")]
class ChatMessage
{
    #[ODM\Id]
    protected $id;

    #[ODM\Field(type: "string")]
    protected $fromUserId;

    #[ODM\Field(type: "string")]
    protected $toUserId;

    #[ODM\Field(type: "string")]
    protected $message;

    #[ODM\Field(type: "date")]
    protected $createdAt;
    
    #[ODM\Field(type: "bool")]
    protected $seen = false;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId()
    {
        return $this->id;
    }

    public function setId($id)
    {
        $this->id = $id;
        return $this;
    }

    public function getFromUserId(): ?string
    {
        return $this->fromUserId;
    }

    public function setFromUserId(string $fromUserId): self
    {
        $this->fromUserId = $fromUserId;
        return $this;
    }

    public function getToUserId(): ?string
    {
        return $this->toUserId;
    }

    public function setToUserId(string $toUserId): self
    {
        $this->toUserId = $toUserId;
        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTime $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    
    public function isSeen(): bool
    {
        return $this->seen ?? false;
    }
    
    public function setSeen(bool $seen): self
    {
        $this->seen = $seen;
        return $this;
    }
}
