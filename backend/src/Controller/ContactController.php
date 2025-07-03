<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api', name: 'api_')]
class ContactController extends AbstractController
{
    #[Route('/contact', name: 'contact', methods: ['POST'])]
    public function contact(Request $request, MailerInterface $mailer, SluggerInterface $slugger): Response
    {
        try {
            $contentType = $request->headers->get('Content-Type');
            
            if (str_contains($contentType ?? '', 'multipart/form-data')) {
                $subject = $request->request->get('subject', 'Nouveau message de contact');
                $message = $request->request->get('message', '');
                $senderEmail = $request->request->get('email', 'no-reply@y-corner.fr');
                $senderName = $request->request->get('name', 'Contact Y-Corner');
            } else {
                $data = json_decode($request->getContent(), true);
                
                if (!$data) {
                    return $this->json(['message' => 'Données invalides'], 400);
                }
                
                $subject = $data['subject'] ?? 'Nouveau message de contact';
                $message = $data['message'] ?? '';
                $senderEmail = $data['email'] ?? 'no-reply@y-corner.fr';
                $senderName = $data['name'] ?? 'Contact Y-Corner';
            }
            
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
            
            if (!empty($files)) {
                $uploadDir = $this->getParameter('kernel.project_dir') . '/var/uploads/contact';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                foreach ($files as $fileData) {
                    $filesToProcess = is_array($fileData) ? $fileData : [$fileData];
                    
                    foreach ($filesToProcess as $uploadedFile) {
                        if (!$uploadedFile instanceof UploadedFile || !$uploadedFile->isValid()) {
                            continue;
                        }
                        
                        $originalFilename = $uploadedFile->getClientOriginalName();
                        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
                        $safeFilename = $slugger->slug(pathinfo($originalFilename, PATHINFO_FILENAME));
                        $newFilename = $safeFilename . '-' . uniqid() . '.' . $extension;
                        
                        try {
                            $uploadedFile->move($uploadDir, $newFilename);
                            $filePath = $uploadDir . '/' . $newFilename;
                            
                            $mimeType = 'application/octet-stream';
                            switch (strtolower($extension)) {
                                case 'pdf': $mimeType = 'application/pdf'; break;
                                case 'jpg': case 'jpeg': $mimeType = 'image/jpeg'; break;
                                case 'png': $mimeType = 'image/png'; break;
                                case 'gif': $mimeType = 'image/gif'; break;
                                case 'doc': $mimeType = 'application/msword'; break;
                                case 'docx': $mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
                            }
                            
                            $email->attachFromPath($filePath, $originalFilename, $mimeType);
                        } catch (\Exception $e) {
                            return $this->json(['message' => 'Erreur lors du traitement du fichier: ' . $e->getMessage()], 500);
                        }
                    }
                }
            }
            
            $mailer->send($email);
            $attachmentCount = count($email->getAttachments());
            
            return $this->json([
                'message' => 'Message envoyé avec succès',
                'debug' => [
                    'attachments_count' => $attachmentCount
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Erreur lors de l\'envoi du message: ' . $e->getMessage()], 500);
        }
    }
}
