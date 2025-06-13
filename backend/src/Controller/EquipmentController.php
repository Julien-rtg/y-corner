<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Equipment;
use App\Entity\Image;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;

class EquipmentController extends AbstractController
{
    private SerializerInterface $serializer;

    public function __construct(SerializerInterface $serializer)
    {
        $this->serializer = $serializer;
    }

    #[Route('/api/equipments', name: 'app_equipment', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        $data = $entityManager->getRepository(Equipment::class)->findAll();
        $equipment = $this->serializer->serialize($data, 'json', [
            'groups' => 'show-equipment',
            AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object) {
                return $object->getId();
            }
        ]);
        return new JsonResponse($equipment, Response::HTTP_OK, [], true);
    }

    #[Route('/api/equipment/{id}', name: 'app_equipment_show', methods: ['GET'])]
    public function show(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = $entityManager->getRepository(Equipment::class)->find($id);
        $equipment = $this->serializer->serialize($data, 'json', [
            'groups' => 'show-equipment',
            AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object) {
                return $object->getId();
            }
        ]);
        return new JsonResponse($equipment, Response::HTTP_OK, [], true);
    }

    #[Route('/api/equipment', name: 'app_equipment_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $datas = json_decode($request->getContent(), true);
        $responseData = [];
        
        foreach ($datas as $data) {
            $imageData = $data['image'];
            $imagePath = $this->saveBase64Image($imageData);
            
            $category = $entityManager->getRepository(Category::class)->find($data['category_id']);
            if (!$category) {
                $category = new Category();
                $category->setName($data['category']);
                $entityManager->persist($category);
            }
            
            $equipment = new Equipment();
            $equipment->setName($data['name']);
            $equipment->setCity($data['city']);
            $equipment->setPrice($data['price']);
            $equipment->setDescription($data['description']);
            $equipment->addCategory($category);

            if (isset($data['user_id'])) {
                $user = $entityManager->getRepository(User::class)->find($data['user_id']);
                if ($user) {
                    $equipment->setUser($user);
                }
            }
            
            $entityManager->persist($equipment);
            
            $image = new Image();
            $image->setContent($imagePath);
            $image->setEquipment($equipment);
            $entityManager->persist($image);
            
            $responseData[] = [
                'id' => $equipment->getId(),
                'name' => $equipment->getName(),
                'image_path' => $imagePath
            ];
        }
        
        $entityManager->flush();

        return $this->json($responseData);
    }
    
    private function saveBase64Image(string $base64Image): string
    {
        if (preg_match('/^data:image\/([a-zA-Z]+);base64,(.+)$/', $base64Image, $matches)) {
            $imageType = $matches[1];
            $imageData = base64_decode($matches[2]);
            
            $uploadDir = __DIR__ . '/../../public/images/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $filename = uniqid() . '.' . $imageType;
            $filePath = $uploadDir . $filename;
            
            file_put_contents($filePath, $imageData);
            
            return '/images/' . $filename;
        }
        
        throw new \InvalidArgumentException('Format d\'image invalide');
    }

    #[Route('/api/equipment/{id}', name: 'app_equipment_update', methods: ['PUT'])]
    public function update(int $id): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'id' => $id
        ]);
    }

    #[Route('/api/equipment/{id}', name: 'app_equipment_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'id' => $id
        ]);
    }
    
    #[Route('/api/user/equipments', name: 'app_user_equipments', methods: ['GET'])]
    public function getUserEquipments(#[CurrentUser] ?User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        if (!$user) {
            return new JsonResponse(['message' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        
        $data = $entityManager->getRepository(Equipment::class)->findByUser($user);
        $equipments = $this->serializer->serialize($data, 'json', [
            'groups' => 'show-equipment',
            AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object) {
                return $object->getId();
            }
        ]);
        
        return new JsonResponse($equipments, Response::HTTP_OK, [], true);
    }
}
