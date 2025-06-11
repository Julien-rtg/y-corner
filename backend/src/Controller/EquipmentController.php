<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Equipment;
use App\Entity\Image;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
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
        foreach ($datas as $data) {
            $image = new Image();
            $image->setContent($data['image']);

            $category = new Category();
            $category->setName($data['category']);

            $equipment = new Equipment();
            $equipment->setName($data['name']);
            $equipment->setCity($data['city']);
            $equipment->setPrice($data['price']);
            $equipment->setDescription($data['description']);
            $equipment->addImage($image);
            $equipment->addCategory($category);

            $entityManager->persist($image);
            $entityManager->persist($category);
            $entityManager->persist($equipment);
        }
        $entityManager->flush();

        return $this->json($datas);
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
}
