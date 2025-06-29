<?php

namespace App\Controller;

use App\Entity\Category;
use App\Service\SentryService;
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
    private SentryService $sentryService;

    public function __construct(SerializerInterface $serializer, SentryService $sentryService)
    {
        $this->serializer = $serializer;
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

    #[Route('/api/categories', name: 'app_categories', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        return $this->executeWithErrorHandling(function() use ($entityManager) {
            $data = $entityManager->getRepository(Category::class)->findAll();
            $categories = $this->serializer->serialize($data, 'json', [
                'groups' => 'show-equipment',
                AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object) {
                    return $object->getId();
                }
            ]);
            return new JsonResponse($categories, Response::HTTP_OK, [], true);
        });
    }
}
