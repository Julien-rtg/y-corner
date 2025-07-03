<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\File;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api', name: 'api_')]
class ContactController extends AbstractController
{
    #[Route('/contact', name: 'contact', methods: ['POST'])]
    public function contact(Request $request, MailerInterface $mailer, SluggerInterface $slugger): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return $this->json(['message' => 'Données invalides'], 400);
            }
            
            $subject = $data['subject'] ?? 'Nouveau message de contact';
            $message = $data['message'] ?? '';
            $senderEmail = $data['email'] ?? 'no-reply@y-corner.fr';
            $senderName = $data['name'] ?? 'Contact Y-Corner';
            
            if (empty($message)) {
                return $this->json(['message' => 'Le message ne peut pas être vide'], 400);
            }

            $email = (new Email())
                ->from($senderEmail)
                ->to('mailer.ycorner@gmail.com')
                ->subject('Y-Corner Contact: ' . $subject)
                ->text("De: $senderName <$senderEmail>\n\n$message")
                ->html("<p><strong>De:</strong> $senderName &lt;$senderEmail&gt;</p><p><strong>Sujet:</strong> $subject</p><p><strong>Message:</strong></p><p>" . nl2br(htmlspecialchars($message)) . "</p>");
            
            $files = $request->files->all();
            foreach ($files as $fileKey => $uploadedFile) {
                if ($uploadedFile instanceof UploadedFile) {
                    $originalFilename = pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
                    $safeFilename = $slugger->slug($originalFilename);
                    $newFilename = $safeFilename.'-'.uniqid().'.'.$uploadedFile->guessExtension();
                    
                    try {
                        $uploadedFile->move(
                            $this->getParameter('kernel.project_dir') . '/var/uploads/contact',
                            $newFilename
                        );
                        
                        $email->addPart(new DataPart(
                            new File($this->getParameter('kernel.project_dir') . '/var/uploads/contact/' . $newFilename),
                            $uploadedFile->getClientOriginalName(),
                            $uploadedFile->getMimeType()
                        ));
                    } catch (FileException $e) {
                        return $this->json(['message' => 'Erreur lors du téléchargement du fichier'], 500);
                    }
                }
            }
            
            $mailer->send($email);
            
            return $this->json(['message' => 'Message envoyé avec succès']);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Une erreur est survenue: ' . $e->getMessage()], 500);
        }
    }
}
