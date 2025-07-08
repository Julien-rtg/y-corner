<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Equipment;
use App\Entity\Category;
use App\Repository\UserRepository;
use App\Repository\EquipmentRepository;
use App\Repository\CategoryRepository;
use App\Service\SentryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[Route('/api/users')]
final class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private SerializerInterface $serializer,
        private UserPasswordHasherInterface $passwordHasher,
        private EquipmentRepository $equipmentRepository,
        private CategoryRepository $categoryRepository,
        private SentryService $sentryService
    ) {}
    
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
            } elseif ($exception instanceof AccessDeniedException) {
                return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_FORBIDDEN);
            }
            
            return new JsonResponse(['message' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'app_user_get', methods: ['GET'])]
    public function getUserDetails(int $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($id) {
            $user = $this->userRepository->find($id);
            if (!$user) {
                return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $currentUser = $this->getUser();
            if (!$currentUser || ($currentUser->getId() !== $user->getId() && !$this->isGranted('ROLE_ADMIN'))) {
                throw new AccessDeniedException('Vous n\'avez pas les droits pour accéder à ces informations');
            }

            $userData = $this->serializer->serialize($user, 'json', ['groups' => 'user_details']);
            
            return new JsonResponse($userData, Response::HTTP_OK, [], true);
        }, ['user_id' => $id]);
    }

    #[Route('/{id}', name: 'app_user_update', methods: ['PUT', 'PATCH'])]
    public function updateUser(Request $request, int $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($request, $id) {
            $user = $this->userRepository->find($id);
            if (!$user) {
                return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $currentUser = $this->getUser();
            if (!$currentUser || ($currentUser->getId() !== $user->getId() && !$this->isGranted('ROLE_ADMIN'))) {
                throw new AccessDeniedException('Vous n\'avez pas les droits pour modifier ces informations');
            }

            $data = json_decode($request->getContent(), true);
            if (!$data) {
                throw new \InvalidArgumentException('Données invalides');
            }
            
            if (isset($data['firstName'])) {
                $user->setFirstName($data['firstName']);
            }
            
            if (isset($data['lastName'])) {
                $user->setLastName($data['lastName']);
            }
            
            if (isset($data['address'])) {
                $user->setAddress($data['address']);
            }
            
            if (isset($data['city'])) {
                $user->setCity($data['city']);
            }
            
            if (isset($data['country'])) {
                $user->setCountry($data['country']);
            }
            
            if (isset($data['postalCode'])) {
                $user->setPostalCode((int) $data['postalCode']);
            }
            
            if (isset($data['birthDate'])) {
                try {
                    $birthDate = new \DateTime($data['birthDate']);
                    $user->setBirthDate($birthDate);
                } catch (\Exception $e) {
                    throw new \InvalidArgumentException('Format de date invalide');
                }
            }
            
            if (isset($data['roles']) && $this->isGranted('ROLE_ADMIN')) {
                $user->setRoles($data['roles']);
            }
            
            $this->entityManager->flush();
            
            $userData = $this->serializer->serialize($user, 'json', ['groups' => 'user_details']);
            
            return new JsonResponse($userData, Response::HTTP_OK, [], true);
        }, ['user_id' => $id, 'request_data' => json_decode($request->getContent(), true)]);
    }

    #[Route('/{id}', name: 'app_user_delete', methods: ['DELETE'])]
    public function deleteUser(int $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($id) {
            $user = $this->userRepository->find($id);
            if (!$user) {
                return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $currentUser = $this->getUser();
            if (!$currentUser || ($currentUser->getId() !== $user->getId() && !$this->isGranted('ROLE_ADMIN'))) {
                throw new AccessDeniedException('Vous n\'avez pas les droits pour supprimer cet utilisateur');
            }

            $this->entityManager->remove($user);
            $this->entityManager->flush();
            
            return $this->json(['message' => 'Utilisateur supprimé avec succès'], Response::HTTP_OK);
        }, ['user_id' => $id]);
    }

    #[Route('/{id}/favorites', name: 'app_user_favorites', methods: ['GET'])]
    public function getFavorites(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $favorites = $user->getFavorites();
        $serializedFavorites = $this->serializer->serialize($favorites, 'json', [
            'groups' => ['show-equipment']
        ]);

        return new JsonResponse($serializedFavorites, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}/favorites/{equipmentId}', name: 'app_user_add_favorite', methods: ['POST'])]
    public function addFavorite(int $id, int $equipmentId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $equipment = $this->equipmentRepository->find($equipmentId);
        if (!$equipment) {
            return $this->json(['message' => 'Equipement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user->addFavorite($equipment);
        $this->entityManager->flush();
        
        return $this->json(['message' => 'Equipement ajouté aux favoris'], Response::HTTP_OK);
    }

    #[Route('/{id}/favorites/{equipmentId}', name: 'app_user_remove_favorite', methods: ['DELETE'])]
    public function removeFavorite(int $id, int $equipmentId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $equipment = $this->equipmentRepository->find($equipmentId);
        if (!$equipment) {
            return $this->json(['message' => 'Equipement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user->removeFavorite($equipment);
        $this->entityManager->flush();
        
        return $this->json(['message' => 'Equipement supprimé des favoris'], Response::HTTP_OK);
    }

    #[Route('/{id}/favorite-categories/{categoryId}', name: 'app_user_add_favorite_category', methods: ['POST'])]
    public function addFavoriteCategory(int $id, int $categoryId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $category = $this->categoryRepository->find($categoryId);
        if (!$category) {
            return $this->json(['message' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $user->addFavoriteCategory($category);
        $this->entityManager->flush();
        
        return $this->json(['message' => 'Catégorie ajoutée aux favoris'], Response::HTTP_OK);
    }

    #[Route('/{id}/favorite-categories/{categoryId}', name: 'app_user_remove_favorite_category', methods: ['DELETE'])]
    public function removeFavoriteCategory(int $id, int $categoryId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $category = $this->categoryRepository->find($categoryId);
        if (!$category) {
            return $this->json(['message' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $user->removeFavoriteCategory($category);
        $this->entityManager->flush();
        
        return $this->json(['message' => 'Catégorie supprimée des favoris'], Response::HTTP_OK);
    }

    #[Route('/{id}/favorite-categories', name: 'app_user_favorites_categories', methods: ['GET'])]
    public function getUserFavoriteCategories(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $favoriteCategories = $user->getFavoriteCategories();
        $serializedFavoriteCategories = $this->serializer->serialize($favoriteCategories, 'json', [
            'groups' => ['show-category']
        ]);

        return new JsonResponse($serializedFavoriteCategories, Response::HTTP_OK, [], true);
    }
    
    #[Route('/{id}/basic-info', name: 'app_user_basic_info', methods: ['GET'])]
    public function getUserBasicInfo(int $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($id) {
            $user = $this->userRepository->find($id);
            if (!$user) {
                return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }
            
            // Return only basic information (first name and last name)
            $basicInfo = [
                'id' => $user->getId(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName()
            ];
            
            return $this->json($basicInfo, Response::HTTP_OK);
        }, ['user_id' => $id]);
    }
}
