<?php

namespace App\Tests\Integration;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AuthenticationIntegrationTest extends WebTestCase
{
    private ?EntityManagerInterface $entityManager = null;
    private $client;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        
        $this->cleanupTestUsers();
    }

    protected function tearDown(): void
    {
        $this->cleanupTestUsers();
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

    private function cleanupTestUsers(): void
    {
        $testEmails = [
            'test@example.com',
            'testuser@example.com',
            'newuser@test.com',
            'invalid@test.com',
            'protectedtest@example.com',
            'validuser@example.com',
            'refreshtest@example.com',
            'tokentest@example.com',
            'flowtest@example.com',
            'incomplete@example.com',
            'unique_' . uniqid() . '@example.com',
            'validuser@example.com'
        ];

        try {
            $entityManager = $this->getEntityManager();
            
            $query = $entityManager->createQuery(
                'DELETE FROM App\\Entity\\User u WHERE u.email IN (:emails)'
            );
            $query->setParameter('emails', $testEmails);
            $query->execute();
            
            $entityManager->clear();
        } catch (\Exception $e) {
            error_log('Error cleaning up test users: ' . $e->getMessage());
        }
    }

    public function testSuccessfulRegistration(): void
    {
        $userData = [
            'email' => 'test@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'birthDate' => '1990-01-01',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'France',
            'postalCode' => 75001,
            'password' => 'SecurePassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Utilisateur enregistré avec succès', $responseData['message']);

        $user = $this->getEntityManager()->getRepository(User::class)->findOneBy(['email' => 'test@example.com']);
        $this->assertNotNull($user);
        $this->assertEquals('John', $user->getFirstName());
        $this->assertEquals('Doe', $user->getLastName());
        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals(['ROLE_USER'], $user->getRoles());
        $this->assertNotNull($user->getCreatedAt());
        
            $this->assertNotEquals('SecurePassword123!', $user->getPassword());
        $this->assertTrue(strlen($user->getPassword()) > 50);
    }

    public function testRegistrationWithMissingFields(): void
    {
        $incompleteData = [
            'email' => 'incomplete@example.com',
            'firstName' => 'John',
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($incompleteData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertStringContainsString('requis', $responseData['message']);

        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'incomplete@example.com']);
        $this->assertNull($user);
    }

    public function testRegistrationWithInvalidBirthDate(): void
    {
        $userData = [
            'email' => 'invalid@test.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'birthDate' => 'invalid-date-format',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'France',
            'password' => 'SecurePassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertStringContainsString('Format de date de naissance invalide', $responseData['message']);
    }

    public function testRegistrationWithDuplicateEmail(): void
    {
        $userData = [
            'email' => 'unique_' . uniqid() . '@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'birthDate' => '1990-01-01',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'France',
            'password' => 'SecurePassword123!'
        ];
    
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );
    
        $status1 = $this->client->getResponse()->getStatusCode();
        $content1 = $this->client->getResponse()->getContent();
    
        $this->assertEquals(Response::HTTP_CREATED, $status1);
    
        $this->ensureKernelShutdown();
        $this->client = static::createClient();
    
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );
    
        $status2 = $this->client->getResponse()->getStatusCode();
        $content2 = $this->client->getResponse()->getContent();
    
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $status2);
        $responseData = json_decode($content2, true);
        $this->assertEquals('Un utilisateur avec cet email existe déjà', $responseData['message']);
    }
      
    /**
     * Test registration with invalid JSON
     */
    public function testRegistrationWithInvalidJson(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            'invalid-json-data'
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Données invalides', $responseData['message']);
    }

    /**
     * Test successful login after registration
     */
    public function testSuccessfulLogin(): void
    {
        $userData = [
            'email' => 'test@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'birthDate' => '1990-01-01',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'France',
            'password' => 'SecurePassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $this->assertEquals(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        
        // Ensure kernel is reset between requests
        $this->ensureKernelShutdown();
        $this->client = static::createClient();
        
        // Now try to login
        $credentials = [
            'email' => 'test@example.com',
            'password' => 'SecurePassword123!'
        ];
    
        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($credentials)
        );
    
        $status = $this->client->getResponse()->getStatusCode();
        $content = $this->client->getResponse()->getContent();
        
        $this->assertEquals(Response::HTTP_OK, $status);
        
        // Verify response contains token and refresh_token
        $responseData = json_decode($content, true);
        $this->assertArrayHasKey('token', $responseData);
        $this->assertArrayHasKey('refresh_token', $responseData);
    }
    

    /**
     * Test login with invalid credentials
     */
    public function testLoginWithInvalidCredentials(): void
    {
        $userData = [
            'email' => 'validuser@example.com',
            'firstName' => 'Valid',
            'lastName' => 'User',
            'birthDate' => '1990-01-01',
            'address' => '123 Valid Street',
            'city' => 'Valid City',
            'country' => 'France',
            'password' => 'ValidPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $this->assertEquals(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());

        $loginData = [
            'email' => 'validuser@example.com',
            'password' => 'WrongPassword123!'
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
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $responseData);
        $this->assertStringContainsString('Invalid credentials', $responseData['message']);
    }

    /**
     * Test login with non-existent user
     */
    public function testLoginWithNonExistentUser(): void
    {
        $loginData = [
            'email' => 'nonexistent@example.com',
            'password' => 'SomePassword123!'
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
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $responseData);
        $this->assertStringContainsString('Invalid credentials', $responseData['message']);
    }

    /**
     * Test accessing protected endpoint with valid JWT token
     */
    public function testProtectedEndpointWithValidToken(): void
    {
        $userData = [
            'email' => 'protectedtest@example.com',
            'firstName' => 'Protected',
            'lastName' => 'Test',
            'birthDate' => '1990-01-01',
            'address' => '123 Protected Street',
            'city' => 'Protected City',
            'country' => 'France',
            'password' => 'ProtectedPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $loginData = [
            'email' => 'protectedtest@example.com',
            'password' => 'ProtectedPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($loginData)
        );

        $loginResponse = json_decode($this->client->getResponse()->getContent(), true);
        $token = $loginResponse['token'];

        $this->client->request(
            'GET',
            '/api/users/me',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $this->assertNotEquals(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    /**
     * Test accessing protected endpoint without token
     */
    public function testProtectedEndpointWithoutToken(): void
    {
        $this->client->request(
            'GET',
            '/api/users/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json']
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }

    /**
     * Test complete registration and login flow
     */
    public function testCompleteRegistrationAndLoginFlow(): void
    {
        $userData = [
            'email' => 'flowtest@example.com',
            'firstName' => 'Flow',
            'lastName' => 'Test',
            'birthDate' => '1992-12-25',
            'address' => '789 Flow Avenue',
            'city' => 'Flow City',
            'country' => 'France',
            'postalCode' => 69000,
            'password' => 'FlowPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($userData)
        );

        $this->assertEquals(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());

            $loginData = [
            'email' => 'flowtest@example.com',
            'password' => 'FlowPassword123!'
        ];

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($loginData)
        );

        $this->assertEquals(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $loginResponse = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $loginResponse);
        $this->assertArrayHasKey('refresh_token', $loginResponse);

        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'flowtest@example.com']);
        $this->assertNotNull($user);
        $this->assertEquals('Flow', $user->getFirstName());
        $this->assertEquals('Test', $user->getLastName());
        $this->assertEquals('1992-12-25', $user->getBirthDate()->format('Y-m-d'));
        $this->assertEquals('789 Flow Avenue', $user->getAddress());
        $this->assertEquals('Flow City', $user->getCity());
        $this->assertEquals('France', $user->getCountry());
        $this->assertEquals(69000, $user->getPostalCode());
    }
}
