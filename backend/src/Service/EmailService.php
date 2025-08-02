<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class EmailService
{
    private MailerInterface $mailer;
    private string $senderEmail;

    public function __construct(
        MailerInterface $mailer,
        ParameterBagInterface $params
    ) {
        $this->mailer = $mailer;
        $this->senderEmail = $params->has('app.sender_email') 
            ? $params->get('app.sender_email') 
            : 'noreply@y-corner.com';
    }

    public function sendEmail(
        string $to,
        string $subject,
        string $htmlContent,
        string $textContent = null
    ): void {
        $email = (new Email())
            ->from($this->senderEmail)
            ->to($to)
            ->subject($subject)
            ->html($htmlContent);

        if ($textContent) {
            $email->text($textContent);
        }

        $this->mailer->send($email);
    }

    public function sendNewEquipmentNotification(
        string $userEmail,
        string $userName,
        string $equipmentName,
        string $categoryName,
        int $equipmentId
    ): void {
        $subject = "Nouveau produit dans votre catégorie favorite sur Y-Corner";
        
        $htmlContent = "
            <h1>Bonjour $userName,</h1>
            <p>Un nouveau produit a été ajouté dans une catégorie que vous suivez :</p>
            <ul>
                <li><strong>Produit :</strong> $equipmentName</li>
                <li><strong>Catégorie :</strong> $categoryName</li>
            </ul>
            <p>
                <a href='http://localhost:5173/equipment/$equipmentId'>Voir le produit</a>
            </p>
            <p>Merci d'utiliser Y-Corner !</p>
        ";
        
        $textContent = "
            Bonjour $userName,
            
            Un nouveau produit a été ajouté dans une catégorie que vous suivez :
            - Produit : $equipmentName
            - Catégorie : $categoryName
            
            Pour voir le produit, visitez : http://localhost:5173/equipment/$equipmentId
            
            Merci d'utiliser Y-Corner !
        ";
        
        $this->sendEmail($userEmail, $subject, $htmlContent, $textContent);
    }
}
