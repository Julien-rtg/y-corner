<?php

namespace App\Entity;

use App\Repository\CategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: CategoryRepository::class)]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['show-equipment'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['show-equipment'])]
    private ?string $name = null;

    /**
     * @var Collection<int, equipment>
     */
    #[ORM\ManyToMany(targetEntity: equipment::class, inversedBy: 'categories')]
    private Collection $equipment;

    public function __construct()
    {
        $this->equipment = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    /**
     * @return Collection<int, equipment>
     */
    public function getEquipment(): Collection
    {
        return $this->equipment;
    }

    public function addEquipment(equipment $equipment): static
    {
        if (!$this->equipment->contains($equipment)) {
            $this->equipment->add($equipment);
        }

        return $this;
    }

    public function removeEquipment(equipment $equipment): static
    {
        $this->equipment->removeElement($equipment);

        return $this;
    }
}
