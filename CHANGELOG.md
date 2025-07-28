# CHANGELOG – YCorner

Toutes les modifications apportées au projet YCorner sont consignées dans ce fichier.

## [v1.0.0] – 2025-01-15
### Ajouté
- Création de compte utilisateur via email/mot de passe
- Connexion sécurisée avec JWT

### Corrigé

### Sécurité

## [v1.1.2] – 2025-02-18
### Corrigé
- Résolution du bug de validation des mots de passe complexes

### Modifié
- Amélioration de la vitesse de chargement du profil
- Optimisation des animations de transition

## [v1.1.1] – 2025-02-14
### Corrigé
- Correction du bug de déconnexion automatique prématurée
- Résolution du problème d'encodage des caractères accentués
- Correction de l'alignement des éléments dans le menu utilisateur

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

## [v1.3.2] – 2025-04-22
### Corrigé
- Correction du problème de synchronisation des données après modification
- Résolution du bug d'affichage des miniatures d'images
- Correction de la validation des prix avec virgules

### Modifié
- Amélioration de l'interface de confirmation de suppression

## [v1.3.1] – 2025-04-18
### Corrigé
- Correction du bug de duplication des équipements lors de la modification
- Résolution du problème de perte de données en cas d'interruption
- Correction de l'ordre d'affichage des équipements modifiés

### Modifié
- Amélioration des messages de confirmation
- Optimisation de la gestion des états de chargement

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

## [v1.5.1] – 2025-06-12
### Corrigé
- Correction du problème de filtres multiples qui se chevauchent
- Résolution du bug de recherche avec des termes contenant des apostrophes
- Correction de l'affichage des résultats vides

### Modifié
- Amélioration de la performance des filtres sur de grandes listes

## [v1.5.0] – 2025-06-08
### Ajouté
- Filtrage des équipements par type

### Corrigé
- Résolution du problème de filtres qui ne se réinitialisent pas

### Modifié
- Amélioration de l'interface de recherche et filtrage

### Sécurité

## [v1.6.2] – 2025-07-12
### Corrigé
- Correction du problème de suppression accidentelle de favoris
- Correction de l'ordre de tri des favoris par date d'ajout

### Modifié
- Amélioration de l'interface de gestion en lot des favoris

## [v1.6.1] – 2025-07-08
### Corrigé
- Correction du bug de notification lors de l'ajout aux favoris
- Correction de l'affichage des icônes de favoris sur différents thèmes

### Modifié
- Amélioration de l'animation d'ajout/suppression des favoris

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

## [v1.7.3] – 2025-08-28
### Corrigé
- Correction du problème de défilement sur mobile dans la liste des équipements
- Résolution du bug d'affichage des caractères spéciaux dans les descriptions
- Correction de l'alignement des boutons sur les écrans de petite taille

### Modifié
- Amélioration de la responsivité sur tablettes

## [v1.7.2] – 2025-08-22
### Corrigé
- Résolution du bug de rechargement automatique des favoris
- Correction de l'affichage des dates en format français

### Modifié
- Amélioration des messages d'erreur pour être plus explicites

## [v1.7.1] – 2025-08-18
### Corrigé
- Correction du problème de focus sur les champs de formulaire après validation
- Résolution du bug de tri par prix avec des valeurs décimales
- Correction de l'espacement des éléments dans la barre de navigation

### Modifié
- Amélioration de l'accessibilité avec de meilleurs contrastes

## [v1.7.0] – 2025-08-15
### Corrigé
- Correction de bugs mineurs d'affichage sur différents navigateurs
- Résolution des problèmes de performance sur les listes longues

### Modifié
- Amélioration générale de l'expérience utilisateur
- Optimisation des temps de chargement de l'application

### Sécurité
- Mise à jour des dépendances critiques
