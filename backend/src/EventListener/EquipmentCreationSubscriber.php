<?php

namespace App\EventListener;

use App\Entity\Equipment;
use App\Entity\Category;
use App\Entity\User;
use App\Service\EmailService;
use Doctrine\Bundle\DoctrineBundle\EventSubscriber\EventSubscriberInterface;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Doctrine\ORM\EntityManagerInterface;

class EquipmentCreationSubscriber implements EventSubscriberInterface
{
    private EmailService $emailService;
    private EntityManagerInterface $entityManager;

    public function __construct(
        EmailService $emailService,
        EntityManagerInterface $entityManager
    ) {
        $this->emailService = $emailService;
        $this->entityManager = $entityManager;
    }

    public function getSubscribedEvents(): array
    {
        return [
            Events::postPersist,
        ];
    }

    public function postPersist(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Equipment) {
            return;
        }

        try {
            $categories = $entity->getCategories();
            
            if ($categories === null || !is_iterable($categories) || 
                (method_exists($categories, 'isEmpty') && $categories->isEmpty())) {
                return;
            }

            foreach ($categories as $category) {
                if ($category instanceof Category) {
                    $this->notifyUsersWithCategoryInWishlist($category, $entity);
                }
            }
        } catch (\Exception $e) {
            error_log('Exception in EquipmentCreationSubscriber::postPersist: ' . $e->getMessage());
        }
    }

    private function notifyUsersWithCategoryInWishlist(Category $category, Equipment $equipment): void
    {
        try {
            $users = $category->getFavoritedBy();
            
            if ($users === null || 
                (method_exists($users, 'isEmpty') && $users->isEmpty()) || 
                !is_iterable($users)) {
                return;
            }

            $equipmentOwner = $equipment->getUser();
            $equipmentOwnerId = $equipmentOwner ? $equipmentOwner->getId() : null;

            foreach ($users as $user) {
                if (!$user instanceof User) {
                    continue;
                }
                
                if ($equipmentOwnerId && $user->getId() === $equipmentOwnerId) {
                    continue;
                }

                try {
                    $this->emailService->sendNewEquipmentNotification(
                        $user->getEmail(),
                        $user->getFirstName(),
                        $equipment->getName(),
                        $category->getName(),
                        $equipment->getId()
                    );
                } catch (\Exception $emailException) {
                    error_log('Exception in EquipmentCreationSubscriber::notifyUsersWithCategoryInWishlist: ' . $emailException->getMessage());
                }
            }
        } catch (\Exception $e) {
            error_log('Exception in EquipmentCreationSubscriber::notifyUsersWithCategoryInWishlist: ' . $e->getMessage());
        }
    }
}
