<?php

namespace App\Tests\Service;

use App\Entity\Category;
use App\Entity\Equipment;
use App\Entity\User;
use App\Service\EmailService;
use App\EventListener\EquipmentCreationSubscriber;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Mailer\MailerInterface;

class EmailNotificationTest extends TestCase
{
    private $mailerMock;
    private $emailService;
    private $entityManagerMock;
    private $subscriber;

    protected function setUp(): void
    {
        $this->mailerMock = $this->createMock(MailerInterface::class);
        
        $parameterBagMock = $this->createMock(\Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface::class);
        $parameterBagMock->method('has')->willReturn(true);
        $parameterBagMock->method('get')->willReturn('test@y-corner.com');
        
        $this->emailService = new EmailService($this->mailerMock, $parameterBagMock);
        
        $this->entityManagerMock = $this->createMock(EntityManagerInterface::class);
        
        $this->subscriber = new EquipmentCreationSubscriber($this->emailService, $this->entityManagerMock);
    }

    public function testSendNewEquipmentNotification(): void
    {
        $this->mailerMock->expects($this->once())
            ->method('send');

        $this->emailService->sendNewEquipmentNotification(
            'user@example.com',
            'John',
            'Basketball',
            'Sports',
            1
        );
    }

    public function testNotificationFlow(): void
    {
        $category = new Category();
        $category->setName('Sports');
        
        $equipment = new Equipment();
        $equipment->setName('Basketball');
        $equipment->setPrice(29.99);
        $equipment->setCity('Paris');
        $equipment->addCategory($category);
        
        $reflectionEquipment = new \ReflectionClass(Equipment::class);
        $idProperty = $reflectionEquipment->getProperty('id');
        $idProperty->setAccessible(true);
        $idProperty->setValue($equipment, 123);
        
        $owner = new User();
        $owner->setEmail('owner@example.com');
        $owner->setFirstName('Owner');
        $owner->setLastName('User');
        $equipment->setUser($owner);
        
        $wishlistUser = new User();
        $wishlistUser->setEmail('wishlist@example.com');
        $wishlistUser->setFirstName('Wishlist');
        $wishlistUser->setLastName('User');
        $wishlistUser->addFavoriteCategory($category);
        
        $favoritedByMock = $this->createMock(\Doctrine\Common\Collections\Collection::class);
        $favoritedByMock->method('getIterator')->willReturn(new \ArrayIterator([$wishlistUser]));
        
        $reflectionCategory = new \ReflectionClass(Category::class);
        $favoritedByProperty = $reflectionCategory->getProperty('favoritedBy');
        $favoritedByProperty->setAccessible(true);
        $favoritedByProperty->setValue($category, $favoritedByMock);
        
        $this->mailerMock->expects($this->once())
            ->method('send');
        
        $eventArgs = $this->createMock(\Doctrine\Persistence\Event\LifecycleEventArgs::class);
        $eventArgs->method('getObject')->willReturn($equipment);
        
        $this->subscriber->postPersist($eventArgs);
    }
}
