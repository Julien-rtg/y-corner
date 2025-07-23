<?php

namespace App\Tests\Integration;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class JwtRefreshIntegrationTest extends WebTestCase
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
            'refreshtest@example.com',
            'tokentest@example.com'
        ];

        foreach ($testEmails as $email) {
            $user = $this->getEntityManager()->getRepository(User::class)->findOneBy(['email' => $email]);
            if ($user) {
                $this->getEntityManager()->remove($user);
            }
        }
        $this->getEntityManager()->flush();
    }

    private function createAndLoginUser(string $email, string $password): array
    {
        $userData = [
            'email' => $email,
            'firstName' => 'Test',
            'lastName' => 'User',
            'birthDate' => '1990-01-01',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'France',
            'password' => $password
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
            'email' => $email,
            'password' => $password
        ];

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($loginData)
        );

        return json_decode($this->client->getResponse()->getContent(), true);
    }

    /**
     * Test successful token refresh
     */
    public function testSuccessfulTokenRefresh(): void
    {
        $tokens = $this->createAndLoginUser('refreshtest@example.com', 'RefreshPassword123!');
        
        $this->assertArrayHasKey('token', $tokens);
        $this->assertArrayHasKey('refresh_token', $tokens);

        sleep(1);

        $refreshData = [
            'refresh_token' => $tokens['refresh_token']
        ];

        $this->client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($refreshData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $refreshResponse = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('token', $refreshResponse);
        $this->assertArrayHasKey('refresh_token', $refreshResponse);

        $tokenParts = explode('.', $refreshResponse['token']);
        $this->assertCount(3, $tokenParts);
        
        $originalPayload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], explode('.', $tokens['token'])[1])), true);
        $refreshedPayload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], explode('.', $refreshResponse['token'])[1])), true);
        
        $this->assertNotEquals($originalPayload['iat'], $refreshedPayload['iat']);
        $this->assertGreaterThan($originalPayload['iat'], $refreshedPayload['iat']);
        
        $this->assertEquals($originalPayload['username'], $refreshedPayload['username']);
        $this->assertEquals($originalPayload['roles'], $refreshedPayload['roles']);
        
        $this->assertNotEquals($tokens['token'], $refreshResponse['token']);
        
        $this->assertEquals($tokens['refresh_token'], $refreshResponse['refresh_token']);
    }

    /**
     * Test refresh with invalid refresh token
     */
    public function testRefreshWithInvalidToken(): void
    {
        $refreshData = [
            'refresh_token' => 'invalid-refresh-token'
        ];

        $this->client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($refreshData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }

    /**
     * Test refresh without refresh token
     */
    public function testRefreshWithoutToken(): void
    {
        $this->client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([])
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }

    /**
     * Test using old access token after refresh
     */
    public function testOldTokenAfterRefresh(): void
    {
        $tokens = $this->createAndLoginUser('tokentest@example.com', 'TokenPassword123!');
        
        $refreshData = [
            'refresh_token' => $tokens['refresh_token']
        ];

        $this->client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($refreshData)
        );

        $refreshResponse = json_decode($this->client->getResponse()->getContent(), true);

        $this->client->request(
            'GET',
            '/api/users/me',
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $refreshResponse['token'],
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $this->assertNotEquals(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    /**
     * Test multiple consecutive token refreshes
     */
    public function testMultipleTokenRefreshes(): void
    {
        $tokens = $this->createAndLoginUser('multirefresh@example.com', 'MultiRefreshPassword123!');
        
        $currentRefreshToken = $tokens['refresh_token'];
        $previousTokens = [];

        for ($i = 0; $i < 3; $i++) {
            if ($i > 0) {
                sleep(1);
            }
            
            $refreshData = [
                'refresh_token' => $currentRefreshToken
            ];

            $this->client->request(
                'POST',
                '/api/token/refresh',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode($refreshData)
            );

            $response = $this->client->getResponse();
            $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());

            $refreshResponse = json_decode($response->getContent(), true);
            $this->assertArrayHasKey('token', $refreshResponse);
            $this->assertArrayHasKey('refresh_token', $refreshResponse);

            $this->assertNotContains($refreshResponse['token'], $previousTokens);
            $previousTokens[] = $refreshResponse['token'];

            $currentRefreshToken = $refreshResponse['refresh_token'];
        }

        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'multirefresh@example.com']);
        if ($user) {
            $this->entityManager->remove($user);
            $this->entityManager->flush();
        }
    }
}
