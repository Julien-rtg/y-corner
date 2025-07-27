# CHANGELOG – YCorner

Toutes les modifications apportées au projet YCorner sont consignées dans ce fichier.

## [v1.0.0] – 2025-01-15
### Ajouté
- Création de compte utilisateur via email/mot de passe
- Connexion sécurisée avec JWT

### Corrigé

### Sécurité

## [v1.1.0] – 2025-02-10
### Ajouté
- Modification des informations personnelles
- Suppression de compte utilisateur

### Corrigé
- Correction du bug d'affichage des messages d'erreur sur le formulaire de profil
- Résolution du problème de redirection après modification du profil

### Modifié
- Amélioration de l'interface utilisateur du formulaire de profil

### Sécurité

## [v1.2.0] – 2025-03-20
### Ajouté
- Création d'un équipement avec photo et description

### Corrigé
- Correction du problème d'upload des images de grande taille
- Résolution du bug de validation des champs obligatoires

### Modifié
- Amélioration de l'interface de création d'équipement

### Sécurité
- Validation stricte des types de fichiers uploadés
- Limitation de la taille des fichiers à 5MB

## [v1.3.0] – 2025-04-15
### Ajouté
- Modification des équipements créés
- Suppression d'un équipement

### Corrigé
- Correction du bug empêchant la modification des équipements sans photo
- Résolution du problème de suppression des images associées

### Modifié
- Refactorisation du code de gestion des équipements

### Sécurité
- Vérification des droits de propriété avant modification/suppression

## [v1.4.0] – 2025-05-12
### Ajouté
- Système de chat en temps réel (WebSocket) entre utilisateurs

### Corrigé
- Correction des déconnexions intempestives WebSocket
- Résolution du problème d'affichage des messages en double

### Modifié
- Optimisation de la gestion des connexions WebSocket
- Amélioration de l'interface de chat avec indicateurs de statut

### Sécurité

## [v1.5.0] – 2025-06-08
### Ajouté
- Filtrage des équipements par type

### Corrigé
- Résolution du problème de filtres qui ne se réinitialisent pas

### Modifié
- Amélioration de l'interface de recherche et filtrage

### Sécurité

## [v1.6.0] – 2025-07-05
### Ajouté
- Ajout en favoris d'un équipement
- Suppression d'un équipement des favoris

### Corrigé
- Correction du bug d'affichage des favoris en double
- Résolution du problème de synchronisation des favoris entre onglets

### Modifié
- Amélioration de l'interface de gestion des favoris
- Optimisation du stockage des préférences utilisateur

### Sécurité
- Limitation du nombre de favoris par utilisateur (max 100)

## [v1.7.0] – 2025-08-15
### Corrigé
- Correction de bugs mineurs d'affichage sur différents navigateurs
- Résolution des problèmes de performance sur les listes longues

### Modifié
- Amélioration générale de l'expérience utilisateur
- Optimisation des temps de chargement de l'application

### Sécurité
- Mise à jour des dépendances critiques
