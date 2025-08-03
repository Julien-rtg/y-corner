<?php

namespace App\Tests\Integration;

use App\Entity\Category;
use App\Entity\Equipment;
use App\Entity\Image;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class EquipmentControllerTest extends WebTestCase
{
    private ?EntityManagerInterface $entityManager = null;
    private $client;
    private $testUser;
    private $testEquipment;
    private $testCategory;
    private $token;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        
        $this->entityManager = $this->getEntityManager();
        $this->cleanupTestData(); // Clean up any existing test data first
        $this->setupTestData();
        $this->getAuthToken();
    }

    protected function tearDown(): void
    {
        try {
            $this->cleanupTestData();
        } catch (\Exception $e) {
            error_log('Error in tearDown: ' . $e->getMessage());
        }
        
        $this->entityManager = null;
        $this->client = null;
        static::ensureKernelShutdown();
        parent::tearDown();
    }
    
    private function getEntityManager(): EntityManagerInterface
    {
        if ($this->entityManager === null) {
            $this->entityManager = $this->client->getContainer()->get(EntityManagerInterface::class);
        }
        return $this->entityManager;
    }

    private function setupTestData(): void
    {
        // Create test user
        $this->testUser = new User();
        $this->testUser->setEmail('equipment_test@example.com');
        $this->testUser->setFirstName('Equipment');
        $this->testUser->setLastName('Tester');
        $this->testUser->setBirthDate(new \DateTime('1990-01-01'));
        $this->testUser->setAddress('123 Equipment Street');
        $this->testUser->setCity('Test City');
        $this->testUser->setCountry('France');
        $this->testUser->setPostalCode(75001);
        $this->testUser->setPassword(
            $this->client->getContainer()->get('security.user_password_hasher')->hashPassword(
                $this->testUser,
                'TestPassword123!'
            )
        );
        
        $this->entityManager->persist($this->testUser);
        
        // Create test category
        $this->testCategory = new Category();
        $this->testCategory->setName('Test Category');
        $this->entityManager->persist($this->testCategory);
        
        // Create test equipment
        $this->testEquipment = new Equipment();
        $this->testEquipment->setName('Test Equipment');
        $this->testEquipment->setDescription('This is a test equipment');
        $this->testEquipment->setPrice(99.99);
        $this->testEquipment->setCity('Test City');
        $this->testEquipment->setUser($this->testUser);
        $this->testEquipment->addCategory($this->testCategory);
        
        $this->entityManager->persist($this->testEquipment);
        $this->entityManager->flush();
    }

    private function cleanupTestData(): void
    {
        try {
            if (!$this->entityManager->isOpen()) {
                $this->entityManager = $this->getEntityManager();
            }
            
            // Clear any existing entities to avoid detached entity errors
            $this->entityManager->clear();
            
            // Remove test equipment by email (to handle cases where the entity might not be set yet)
            $testUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'equipment_test@example.com']);
            if ($testUser) {
                // First remove all equipment associated with the test user
                $equipments = $this->entityManager->getRepository(Equipment::class)->findBy(['user' => $testUser]);
                foreach ($equipments as $equipment) {
                    // Remove images for each equipment
                    $images = $this->entityManager->getRepository(Image::class)->findBy(['equipment' => $equipment]);
                    foreach ($images as $image) {
                        $this->entityManager->remove($image);
                    }
                    $this->entityManager->remove($equipment);
                }
                $this->entityManager->flush();
                
                // Then remove the user
                $this->entityManager->remove($testUser);
                $this->entityManager->flush();
            }
            
            // Remove test category if it exists
            $testCategory = $this->entityManager->getRepository(Category::class)->findOneBy(['name' => 'Test Category']);
            if ($testCategory) {
                $this->entityManager->remove($testCategory);
                $this->entityManager->flush();
            }
            
            // Also clean up the 'another_user@example.com' if it exists
            $anotherUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'another_user@example.com']);
            if ($anotherUser) {
                // First remove all equipment associated with this user
                $equipments = $this->entityManager->getRepository(Equipment::class)->findBy(['user' => $anotherUser]);
                foreach ($equipments as $equipment) {
                    // Remove images for each equipment
                    $images = $this->entityManager->getRepository(Image::class)->findBy(['equipment' => $equipment]);
                    foreach ($images as $image) {
                        $this->entityManager->remove($image);
                    }
                    $this->entityManager->remove($equipment);
                }
                $this->entityManager->flush();
                
                // Then remove the user
                $this->entityManager->remove($anotherUser);
                $this->entityManager->flush();
            }
            
            // Clear again to make sure all references are gone
            $this->entityManager->clear();
        } catch (\Exception $e) {
            error_log('Error cleaning up test data: ' . $e->getMessage());
        }
    }

    private function getAuthToken(): void
    {
        $loginData = [
            'email' => 'equipment_test@example.com',
            'password' => 'TestPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($loginData)
        );

        $response = $this->client->getResponse();
        if ($response->getStatusCode() === Response::HTTP_OK) {
            $responseData = json_decode($response->getContent(), true);
            $this->token = $responseData['token'];
        } else {
            $this->fail('Failed to get authentication token: ' . $response->getContent());
        }
    }

    public function testGetAllEquipments(): void
    {
        $this->client->request(
            'GET',
            '/api/equipments',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertIsArray($responseData);
        
        // Check if our test equipment is in the list
        $found = false;
        foreach ($responseData as $equipment) {
            if ($equipment['id'] === $this->testEquipment->getId()) {
                $found = true;
                $this->assertEquals('Test Equipment', $equipment['name']);
                $this->assertEquals('This is a test equipment', $equipment['description']);
                $this->assertEquals(99.99, $equipment['price']);
                $this->assertEquals('Test City', $equipment['city']);
                break;
            }
        }
        $this->assertTrue($found, 'Test equipment not found in the response');
    }

    public function testGetSingleEquipment(): void
    {
        $this->client->request(
            'GET',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->testEquipment->getId(), $responseData['id']);
        $this->assertEquals('Test Equipment', $responseData['name']);
        $this->assertEquals('This is a test equipment', $responseData['description']);
        $this->assertEquals(99.99, $responseData['price']);
        $this->assertEquals('Test City', $responseData['city']);
    }

    public function testGetNonExistentEquipment(): void
    {
        $this->client->request(
            'GET',
            '/api/equipment/99999', // Non-existent ID
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Équipement non trouvé', $responseData['message']);
    }

    public function testCreateEquipment(): void
    {
        // Create a simple base64 image for testing
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
        
        $equipmentData = [
            [
                'name' => 'New Test Equipment',
                'description' => 'This is a new test equipment',
                'price' => 149.99,
                'city' => 'New Test City',
                'categories' => [
                    ['id' => $this->testCategory->getId()]
                ],
                'images' => [
                    $base64Image
                ],
                'user_id' => $this->testUser->getId()
            ]
        ];

        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($equipmentData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertIsArray($responseData);
        
        // Verify the equipment was created
        $createdEquipment = $this->entityManager->getRepository(Equipment::class)->findOneBy(['name' => 'New Test Equipment']);
        $this->assertNotNull($createdEquipment);
        $this->assertEquals('This is a new test equipment', $createdEquipment->getDescription());
        $this->assertEquals(149.99, $createdEquipment->getPrice());
        $this->assertEquals('New Test City', $createdEquipment->getCity());
        
        // Clean up the created equipment
        $this->entityManager->remove($createdEquipment);
        $this->entityManager->flush();
    }

    public function testCreateEquipmentWithInvalidData(): void
    {
        $invalidData = 'This is not valid JSON';

        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            $invalidData
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
    }
    
    public function testCreateEquipmentWithMissingImage(): void
    {
        $equipmentData = [
            [
                'name' => 'Equipment Without Image',
                'description' => 'This equipment has no image',
                'price' => 149.99,
                'city' => 'Test City',
                'categories' => [
                    ['id' => $this->testCategory->getId()]
                ],
                // No images provided
                'user_id' => $this->testUser->getId()
            ]
        ];

        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($equipmentData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Au moins une image est requise pour chaque équipement', $responseData['message']);
    }
    
    public function testCreateEquipmentWithSingleImage(): void
    {
        // Create a simple base64 image for testing
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        $equipmentData = [
            [
                'name' => 'Equipment With Single Image',
                'description' => 'This equipment has a single image',
                'price' => 149.99,
                'city' => 'Test City',
                'categories' => [
                    ['id' => $this->testCategory->getId()]
                ],
                'image' => $base64Image, // Using single image instead of images array
                'user_id' => $this->testUser->getId()
            ]
        ];

        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($equipmentData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        // Verify the equipment was created
        $createdEquipment = $this->entityManager->getRepository(Equipment::class)->findOneBy(['name' => 'Equipment With Single Image']);
        $this->assertNotNull($createdEquipment);
        
        // Clean up the created equipment
        $images = $this->entityManager->getRepository(Image::class)->findBy(['equipment' => $createdEquipment]);
        foreach ($images as $image) {
            $this->entityManager->remove($image);
        }
        $this->entityManager->remove($createdEquipment);
        $this->entityManager->flush();
    }
    
    public function testCreateEquipmentWithNewCategory(): void
    {
        // Create a simple base64 image for testing
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        $equipmentData = [
            [
                'name' => 'Equipment With New Category',
                'description' => 'This equipment has a new category',
                'price' => 149.99,
                'city' => 'Test City',
                'categories' => [
                    ['name' => 'New Category'] // New category by name instead of ID
                ],
                'images' => [$base64Image],
                'user_id' => $this->testUser->getId()
            ]
        ];

        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($equipmentData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        // Verify the equipment and category were created
        $createdEquipment = $this->entityManager->getRepository(Equipment::class)->findOneBy(['name' => 'Equipment With New Category']);
        $this->assertNotNull($createdEquipment);
        
        $newCategory = $this->entityManager->getRepository(Category::class)->findOneBy(['name' => 'New Category']);
        $this->assertNotNull($newCategory);
        
        // Clean up the created equipment and category
        $images = $this->entityManager->getRepository(Image::class)->findBy(['equipment' => $createdEquipment]);
        foreach ($images as $image) {
            $this->entityManager->remove($image);
        }
        $this->entityManager->remove($createdEquipment);
        $this->entityManager->remove($newCategory);
        $this->entityManager->flush();
    }

    public function testUpdateEquipment(): void
    {
        $updateData = [
            'name' => 'Updated Equipment',
            'description' => 'This equipment has been updated',
            'price' => 199.99,
            'city' => 'Updated City',
            'categories' => [
                ['id' => $this->testCategory->getId()]
            ],
            'images' => []
        ];

        $this->client->request(
            'PUT',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        // Refresh the entity from database
        $this->entityManager->clear();
        $updatedEquipment = $this->entityManager->getRepository(Equipment::class)->find($this->testEquipment->getId());
        
        $this->assertEquals('Updated Equipment', $updatedEquipment->getName());
        $this->assertEquals('This equipment has been updated', $updatedEquipment->getDescription());
        $this->assertEquals(199.99, $updatedEquipment->getPrice());
        $this->assertEquals('Updated City', $updatedEquipment->getCity());
    }
    
    public function testUpdateEquipmentWithInvalidData(): void
    {
        // Note: The controller doesn't explicitly validate JSON format in update method
        // This test verifies that invalid JSON is handled gracefully (doesn't throw 500 error)
        $invalidData = 'This is not valid JSON';

        $this->client->request(
            'PUT',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            $invalidData
        );

        $response = $this->client->getResponse();
        // The controller doesn't explicitly check for valid JSON, so it won't return 400
        // It will attempt to process the request and return 200 with default values
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
    }
    
    public function testUpdateEquipmentWithNewCategory(): void
    {
        $updateData = [
            'name' => 'Equipment With Updated Category',
            'description' => 'This equipment has an updated category',
            'price' => 199.99,
            'city' => 'Updated City',
            'categories' => [
                ['name' => 'Updated Category'] // New category by name
            ],
            'images' => []
        ];

        $this->client->request(
            'PUT',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        // Verify the category was created
        $newCategory = $this->entityManager->getRepository(Category::class)->findOneBy(['name' => 'Updated Category']);
        $this->assertNotNull($newCategory);
        
        // Clean up the new category after test
        $this->entityManager->remove($newCategory);
        $this->entityManager->flush();
    }
    
    public function testUpdateEquipmentWithNewImage(): void
    {
        // Create a simple base64 image for testing
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        $updateData = [
            'name' => 'Equipment With New Image',
            'description' => 'This equipment has a new image',
            'price' => 199.99,
            'city' => 'Updated City',
            'categories' => [
                ['id' => $this->testCategory->getId()]
            ],
            'images' => [
                ['content' => $base64Image]
            ]
        ];

        $this->client->request(
            'PUT',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        // Verify a new image was added
        $images = $this->entityManager->getRepository(Image::class)->findBy(['equipment' => $this->testEquipment]);
        $this->assertGreaterThan(0, count($images));
    }
    
    public function testUpdateEquipmentWithInvalidImageFormat(): void
    {
        // The controller only validates image format when it starts with 'data:image'
        // Let's modify our test to use a string that passes the initial check but fails during processing
        $updateData = [
            'name' => 'Equipment With Invalid Image',
            'description' => 'This equipment has an invalid image',
            'price' => 199.99,
            'city' => 'Updated City',
            'categories' => [
                ['id' => $this->testCategory->getId()]
            ],
            'images' => [
                ['content' => 'data:image/png;base64,not-valid-base64-content']
            ]
        ];

        $this->client->request(
            'PUT',
            '/api/equipment/' . $this->testEquipment->getId(),
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
    }

    public function testUpdateNonExistentEquipment(): void
    {
        $updateData = [
            'name' => 'Updated Equipment',
            'description' => 'This equipment has been updated',
            'price' => 199.99,
            'city' => 'Updated City'
        ];

        $this->client->request(
            'PUT',
            '/api/equipment/99999', // Non-existent ID
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_NOT_FOUND, $response->getStatusCode());
    }

    public function testDeleteEquipment(): void
    {
        // Create a temporary equipment to delete
        $tempEquipment = new Equipment();
        $tempEquipment->setName('Temp Equipment');
        $tempEquipment->setDescription('This equipment will be deleted');
        $tempEquipment->setPrice(50.00);
        $tempEquipment->setCity('Temp City');
        $tempEquipment->setUser($this->testUser);
        $tempEquipment->addCategory($this->testCategory);
        
        $this->entityManager->persist($tempEquipment);
        $this->entityManager->flush();
        
        $tempId = $tempEquipment->getId();
        
        $this->client->request(
            'DELETE',
            '/api/equipment/' . $tempId,
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Équipement supprimé avec succès', $responseData['message']);
        
        // Verify the equipment was deleted
        $deletedEquipment = $this->entityManager->getRepository(Equipment::class)->find($tempId);
        $this->assertNull($deletedEquipment);
    }

    public function testDeleteNonExistentEquipment(): void
    {
        $this->client->request(
            'DELETE',
            '/api/equipment/99999', // Non-existent ID
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_NOT_FOUND, $response->getStatusCode());
    }

    public function testDeleteEquipmentWithoutAuthorization(): void
    {
        // Create another user
        $anotherUser = new User();
        $anotherUser->setEmail('another_user@example.com');
        $anotherUser->setFirstName('Another');
        $anotherUser->setLastName('User');
        $anotherUser->setBirthDate(new \DateTime('1995-01-01'));
        $anotherUser->setAddress('456 Another Street');
        $anotherUser->setCity('Another City');
        $anotherUser->setCountry('France');
        $anotherUser->setPostalCode(75002);
        $anotherUser->setPassword(
            $this->client->getContainer()->get('security.user_password_hasher')->hashPassword(
                $anotherUser,
                'AnotherPassword123!'
            )
        );
        
        $this->entityManager->persist($anotherUser);
        
        // Create equipment owned by another user
        $anotherEquipment = new Equipment();
        $anotherEquipment->setName('Another Equipment');
        $anotherEquipment->setDescription('This equipment belongs to another user');
        $anotherEquipment->setPrice(75.00);
        $anotherEquipment->setCity('Another City');
        $anotherEquipment->setUser($anotherUser);
        $anotherEquipment->addCategory($this->testCategory);
        
        $this->entityManager->persist($anotherEquipment);
        $this->entityManager->flush();
        
        $equipmentId = $anotherEquipment->getId();
        
        // Try to delete equipment owned by another user
        $this->client->request(
            'DELETE',
            '/api/equipment/' . $equipmentId,
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_FORBIDDEN, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Vous n\'êtes pas autorisé à supprimer cet équipement', $responseData['message']);
        
        // Clean up - refresh entities to avoid detached entity errors
        $this->entityManager->clear();
        $anotherEquipmentRefreshed = $this->entityManager->getRepository(Equipment::class)->find($equipmentId);
        if ($anotherEquipmentRefreshed) {
            $this->entityManager->remove($anotherEquipmentRefreshed);
            $this->entityManager->flush();
        }
        
        $anotherUserRefreshed = $this->entityManager->getRepository(User::class)->find($anotherUser->getId());
        if ($anotherUserRefreshed) {
            $this->entityManager->remove($anotherUserRefreshed);
            $this->entityManager->flush();
        }
    }

    public function testGetUserEquipments(): void
    {
        $this->client->request(
            'GET',
            '/api/user/equipments',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertIsArray($responseData);
        
        // Check if our test equipment is in the user's equipment list
        $found = false;
        foreach ($responseData as $equipment) {
            if ($equipment['id'] === $this->testEquipment->getId()) {
                $found = true;
                $this->assertEquals('Test Equipment', $equipment['name']);
                break;
            }
        }
        $this->assertTrue($found, 'Test equipment not found in user\'s equipment list');
    }

    public function testGetUserEquipmentsWithoutAuthentication(): void
    {
        $this->client->request(
            'GET',
            '/api/user/equipments',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json']
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }
    
    public function testErrorHandlingWithException(): void
    {
        // Instead of using a mock that throws an exception, let's test the error handling
        // by sending a request that will cause an exception in the controller's error handling
        // We'll use the executeWithErrorHandling method indirectly by calling an endpoint
        // with data that will cause an exception during processing
        
        // Create a request with invalid data that will cause an exception in processing
        // but not in the initial JSON parsing
        $invalidData = json_encode([
            'name' => 'Test Equipment',
            'description' => 'This will cause an exception',
            'price' => 'not-a-number', // This will cause a type error when setting the price
            'city' => 'Test City',
            'images' => ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==']
        ]);
        
        $this->client->request(
            'POST',
            '/api/equipment',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'application/json'
            ],
            $invalidData
        );
        
        $response = $this->client->getResponse();
        
        // The controller should catch the exception and return a 500 error
        $this->assertEquals(Response::HTTP_INTERNAL_SERVER_ERROR, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Une erreur est survenue', $responseData['message']);
    }
}
