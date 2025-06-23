<?php

namespace App\Security;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Response\JWTAuthenticationSuccessResponse;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;

class JwtAuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    private $jwtManager;
    private $serializer;
    private $refreshTokenGenerator;
    private $refreshTokenManager;
    private $ttl;

    public function __construct(
        JWTTokenManagerInterface $jwtManager, 
        SerializerInterface $serializer,
        RefreshTokenGeneratorInterface $refreshTokenGenerator = null,
        RefreshTokenManagerInterface $refreshTokenManager = null,
        int $ttl = 2592000
    ) {
        $this->jwtManager = $jwtManager;
        $this->serializer = $serializer;
        $this->refreshTokenGenerator = $refreshTokenGenerator;
        $this->refreshTokenManager = $refreshTokenManager;
        $this->ttl = $ttl;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): Response
    {
        $user = $token->getUser();

        $jwt = $this->jwtManager->create($user);

        // Serialize the user to get their data
        $userData = json_decode($this->serializer->serialize($user, 'json', ['groups' => 'user_details']), true);

        // Create response data with token and user information
        $data = [
            'token' => $jwt,
            'user' => $userData
        ];

        // Add refresh token if the refresh token bundle is available
        if (null !== $this->refreshTokenGenerator && null !== $this->refreshTokenManager) {
            $refreshToken = $this->refreshTokenGenerator->createForUserWithTtl($user, $this->ttl);
            $this->refreshTokenManager->save($refreshToken);
            $data['refresh_token'] = $refreshToken->getRefreshToken();
        }

        return new JsonResponse($data);
    }
}
