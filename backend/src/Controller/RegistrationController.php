<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

class RegistrationController extends AbstractController
{

    #[Route('/api/register', name: 'app_register', methods: ['POST'])]
    public function index(UserPasswordHasherInterface $passwordHasher, Request $request, EntityManagerInterface $entityManager): Response
    {
        $datas = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($datas['email']);
        $user->setRoles(['ROLE_USER']);
        $user->setFirstName($datas['firstName']);
        $user->setLastName($datas['lastName']);
        $user->setBirthDate(new \DateTime($datas['birthDate']));
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
        
        return $this->json(['message' => 'User registered successfully'], Response::HTTP_CREATED);
    }
}