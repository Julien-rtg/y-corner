<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Equipment;
use App\Entity\Image;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        // Create users
        $users = $this->loadUsers($manager);
        
        // Create categories
        $categories = $this->loadCategories($manager);
        
        // Create equipment
        $this->loadEquipment($manager, $users, $categories);
        
        $manager->flush();
    }
    
    private function loadUsers(ObjectManager $manager): array
    {
        $users = [];
        
        $adminUser = new User();
        $adminUser->setEmail('admin@ycorner.fr');
        $adminUser->setFirstName('Admin');
        $adminUser->setLastName('Y-Corner');
        $adminUser->setBirthDate(new \DateTime('1990-01-01'));
        $adminUser->setRoles(['ROLE_ADMIN']);
        $adminUser->setAddress('123 Rue de l\'Administration');
        $adminUser->setCity('Paris');
        $adminUser->setCountry('France');
        $adminUser->setPostalCode(75001);
        $hashedPassword = $this->passwordHasher->hashPassword($adminUser, 'admin123');
        $adminUser->setPassword($hashedPassword);
        $manager->persist($adminUser);
        $users[] = $adminUser;
        
        $userNames = [
            ['Pierre', 'Dupont', 'Lyon'],
            ['Marie', 'Laurent', 'Marseille'],
            ['Jean', 'Martin', 'Bordeaux'],
            ['Sophie', 'Bernard', 'Lille'],
            ['Thomas', 'Petit', 'Toulouse']
        ];
        
        foreach ($userNames as $i => $userData) {
            $user = new User();
            $user->setEmail(strtolower($userData[0]) . '.' . strtolower($userData[1]) . '@example.com');
            $user->setFirstName($userData[0]);
            $user->setLastName($userData[1]);
            $user->setBirthDate(new \DateTime('199' . $i . '-05-10'));
            $user->setRoles(['ROLE_USER']);
            $user->setCity($userData[2]);
            $user->setCountry('France');
            $user->setPostalCode(33000 + $i * 1000);
            
            $hashedPassword = $this->passwordHasher->hashPassword($user, 'password123');
            $user->setPassword($hashedPassword);
            
            $manager->persist($user);
            $users[] = $user;
        }
        
        return $users;
    }
    
    private function loadCategories(ObjectManager $manager): array
    {
        $categoryNames = [
            'Football', 
            'Basketball', 
            'Tennis', 
            'Natation', 
            'Cyclisme', 
            'Running', 
            'Musculation', 
            'Sports d\'hiver', 
            'Sports nautiques', 
            'Randonnée'
        ];
        
        $categories = [];
        
        foreach ($categoryNames as $name) {
            $category = new Category();
            $category->setName($name);
            
            $manager->persist($category);
            $categories[] = $category;
        }
        
        return $categories;
    }
    
    private function loadEquipment(ObjectManager $manager, array $users, array $categories): void
    {
        $equipmentData = [
            [
                'name' => 'Ballon de football Adidas',
                'price' => 29.99,
                'description' => 'Ballon de football officiel, taille 5, parfait pour les matchs et l\'entraînement.',
                'city' => 'Lyon',
                'categoryIndexes' => [0],
                'userIndex' => 1,
                'images' => ['/images/ballon-volleyball.jpg']
            ],
            [
                'name' => 'Raquette de tennis Wilson',
                'price' => 89.99,
                'description' => 'Raquette de tennis professionnelle, idéale pour les joueurs de niveau intermédiaire.',
                'city' => 'Marseille',
                'categoryIndexes' => [2],
                'userIndex' => 2,
                'images' => ['/images/raquette-tennis.jpg']
            ],
            [
                'name' => 'Vélo de route Decathlon',
                'price' => 499.99,
                'description' => 'Vélo de route léger et rapide, parfait pour les longues distances.',
                'city' => 'Paris',
                'categoryIndexes' => [4],
                'userIndex' => 0,
                'images' => ['/images/velo-course.jpg', '/images/velo.jpg']
            ],
            [
                'name' => 'Ballon de basketball Spalding',
                'price' => 34.99,
                'description' => 'Ballon de basketball officiel NBA, taille 7, excellent grip.',
                'city' => 'Bordeaux',
                'categoryIndexes' => [1],
                'userIndex' => 3,
                'images' => ['/images/ballon-basket.jpg']
            ],
            [
                'name' => 'Chaussures de running Nike',
                'price' => 119.99,
                'description' => 'Chaussures de running légères et confortables, parfaites pour les courses longue distance.',
                'city' => 'Lille',
                'categoryIndexes' => [5],
                'userIndex' => 4,
                'images' => ['/images/chaussures-running.jpg']
            ],
            [
                'name' => 'Tapis de yoga',
                'price' => 24.99,
                'description' => 'Tapis de yoga antidérapant, épais et confortable pour tous types d\'exercices.',
                'city' => 'Toulouse',
                'categoryIndexes' => [6],
                'userIndex' => 5,
                'images' => ['/images/tapis-yoga.jpg']
            ],
            [
                'name' => 'Skis Rossignol',
                'price' => 349.99,
                'description' => 'Skis tout-terrain pour skieur de niveau intermédiaire à avancé.',
                'city' => 'Lyon',
                'categoryIndexes' => [7],
                'userIndex' => 1,
                'images' => ['/images/skis.jpg']
            ],
            [
                'name' => 'Planche de surf',
                'price' => 299.99,
                'description' => 'Planche de surf 6\'2", idéale pour les surfeurs intermédiaires.',
                'city' => 'Marseille',
                'categoryIndexes' => [8],
                'userIndex' => 2,
                'images' => ['/images/planche-surf.jpg']
            ],
            [
                'name' => 'Sac à dos de randonnée',
                'price' => 79.99,
                'description' => 'Sac à dos de randonnée 40L, confortable et résistant pour vos aventures en plein air.',
                'city' => 'Bordeaux',
                'categoryIndexes' => [9],
                'userIndex' => 3,
                'images' => ['/images/sac-sport.jpg']
            ],
            [
                'name' => 'Haltères 10kg (paire)',
                'price' => 49.99,
                'description' => 'Paire d\'haltères de 10kg chacun, parfaits pour la musculation à domicile.',
                'city' => 'Paris',
                'categoryIndexes' => [6],
                'userIndex' => 0,
                'images' => ['/images/halteres.jpg']
            ]
        ];
        
        foreach ($equipmentData as $i => $data) {
            $equipment = new Equipment();
            $equipment->setName($data['name']);
            $equipment->setPrice($data['price']);
            $equipment->setDescription($data['description']);
            $equipment->setCity($data['city']);
            $equipment->setUser($users[$data['userIndex']]);
            
            foreach ($data['categoryIndexes'] as $categoryIndex) {
                $equipment->addCategory($categories[$categoryIndex]);
            }
            
            $manager->persist($equipment);
            
            // Add images for each equipment
            $this->createImagesFromFiles($manager, $equipment, $data['images']);
            
            // Add some favorites
            if ($i % 3 === 0) {
                $randomUserIndex = ($data['userIndex'] + 1) % count($users);
                $users[$randomUserIndex]->addFavorite($equipment);
            }
        }
        
        // Add some favorite categories to users
        foreach ($users as $i => $user) {
            $user->addFavoriteCategory($categories[$i % count($categories)]);
            $user->addFavoriteCategory($categories[($i + 3) % count($categories)]);
        }
    }
    
    private function createImagesFromFiles(ObjectManager $manager, Equipment $equipment, array $imageFiles): void
    {
        foreach ($imageFiles as $imageFile) {
            $image = new Image();
            $image->setContent($imageFile); // Store the image filename in the content field
            $image->setEquipment($equipment);
            $manager->persist($image);
        }
    }
}
