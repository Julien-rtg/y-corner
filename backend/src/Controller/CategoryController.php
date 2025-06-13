<?php

namespace App\Controller;

use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;

class CategoryController extends AbstractController
{
    private SerializerInterface $serializer;

    public function __construct(SerializerInterface $serializer)
    {
        $this->serializer = $serializer;
    }

    #[Route('/api/categories', name: 'app_categories', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        $data = $entityManager->getRepository(Category::class)->findAll();
        $categories = $this->serializer->serialize($data, 'json', [
            'groups' => 'show-equipment',
            AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object) {
                return $object->getId();
            }
        ]);
        return new JsonResponse($categories, Response::HTTP_OK, [], true);
    }
}
