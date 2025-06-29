<?php

namespace App\Controller;

use App\Service\SentryService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class RegistrationController extends AbstractController
{
    private SentryService $sentryService;
    
    public function __construct(SentryService $sentryService)
    {
        $this->sentryService = $sentryService;
    }
    
    private function executeWithErrorHandling(callable $callback, array $context = []): JsonResponse
    {
        try {
            return $callback();
        } catch (\Throwable $exception) {
            $context['controller'] = static::class;
            $context['method'] = debug_backtrace()[1]['function'] ?? 'unknown';
            
            $this->sentryService->captureException($exception, $context);
            
            if ($exception instanceof \InvalidArgumentException) {
                return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
            }
            
            return new JsonResponse(['message' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/register', name: 'app_register', methods: ['POST'])]
    public function index(UserPasswordHasherInterface $passwordHasher, Request $request, EntityManagerInterface $entityManager): Response
    {
        return $this->executeWithErrorHandling(function() use ($passwordHasher, $request, $entityManager) {
            $datas = json_decode($request->getContent(), true);
            
            if (!$datas) {
                throw new \InvalidArgumentException('Données invalides');
            }
            
            // Validate required fields
            $requiredFields = ['email', 'firstName', 'lastName', 'birthDate', 'address', 'country', 'city', 'password'];
            foreach ($requiredFields as $field) {
                if (!isset($datas[$field]) || empty($datas[$field])) {
                    throw new \InvalidArgumentException("Le champ {$field} est requis");
                }
            }

            $user = new User();
            $user->setEmail($datas['email']);
            $user->setRoles(['ROLE_USER']);
            $user->setFirstName($datas['firstName']);
            $user->setLastName($datas['lastName']);
            
            try {
                $user->setBirthDate(new \DateTime($datas['birthDate']));
            } catch (\Exception $e) {
                throw new \InvalidArgumentException('Format de date de naissance invalide');
            }
            
            $user->setAddress($datas['address']);
            $user->setCountry($datas['country']);
            $user->setCity($datas['city']);
            $plaintextPassword = $datas['password'];

            // hash the password (based on the security.yaml config for the $user class)
            $hashedPassword = $passwordHasher->hashPassword(
                $user,
                $plaintextPassword
            );
            $user->setPassword($hashedPassword);
            $entityManager->persist($user);
            $entityManager->flush();
            
            return $this->json(['message' => 'Utilisateur enregistré avec succès'], Response::HTTP_CREATED);
        }, ['request_data' => json_decode($request->getContent(), true)]);
    }
}