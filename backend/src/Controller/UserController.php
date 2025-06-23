<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Equipment;
use App\Repository\UserRepository;
use App\Repository\EquipmentRepository;
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
        private EquipmentRepository $equipmentRepository
    ) {}

    #[Route('/{id}', name: 'app_user_get', methods: ['GET'])]
    public function getUserDetails(int $id): JsonResponse
    {
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
    }

    #[Route('/{id}', name: 'app_user_update', methods: ['PUT', 'PATCH'])]
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $currentUser = $this->getUser();
        if (!$currentUser || ($currentUser->getId() !== $user->getId() && !$this->isGranted('ROLE_ADMIN'))) {
            throw new AccessDeniedException('Vous n\'avez pas les droits pour modifier ces informations');
        }

        $data = json_decode($request->getContent(), true);
        
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
                return $this->json(['message' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        }
        
        if (isset($data['roles']) && $this->isGranted('ROLE_ADMIN')) {
            $user->setRoles($data['roles']);
        }
        
        $this->entityManager->flush();
        
        $userData = $this->serializer->serialize($user, 'json', ['groups' => 'user_details']);
        
        return new JsonResponse($userData, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'app_user_delete', methods: ['DELETE'])]
    public function deleteUser(int $id): JsonResponse
    {
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
    }

    #[Route('/{id}/favorites', name: 'app_user_favorites', methods: ['GET'])]
    public function getFavorites(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $favorites = $user->getFavorites();
        $favoriteIds = $favorites->map(function ($favorite) {
            return $favorite->getId();
        });

        return $this->json($favoriteIds, Response::HTTP_OK);
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
}
