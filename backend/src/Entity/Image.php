<?php

namespace App\Entity;

use App\Repository\ImageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ImageRepository::class)]
class Image
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['show-equipment'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['show-equipment'])]
    private ?string $content = null;

    #[ORM\ManyToOne(inversedBy: 'images')]
    #[ORM\JoinColumn(nullable: false)]
    private ?equipment $equipment = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getEquipment(): ?equipment
    {
        return $this->equipment;
    }

    public function setEquipment(?equipment $equipment): static
    {
        $this->equipment = $equipment;

        return $this;
    }
}
