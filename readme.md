# Ycorner

### Installation

#### Prérequis et versions

- PHP 8.3
- Composer
- Node.js 20.x
- npm 10.x ou yarn
- MySQL ≥ 8 / MongoDB ≥ 5
- Git
- Symfony CLI (optionnel)
- Docker (si utilisé)

Pour utiliser le monitoring avec Sentry, créez un compte sur la plateforme et suivez les étapes pour les projets React et Symfony:

- Sentry: https://sentry.io/

#### MongoDB (extension PHP)

1. Installer l’extension MongoDB pour PHP depuis: https://pecl.php.net/package/mongodb
   - Sélectionner la version 1.21.1
   - Choisir la build NTS ou TS selon votre configuration de PHP 8.3
2. Ajouter la ligne suivante dans votre `php.ini`:
   - `extension=mongodb`
3. Décommenter également la ligne suivante pour MySQL:
   - `extension=pdo_mysql`

#### xDebug

1. Installer xDebug et le placer dans le dossier `ext` de votre installation PHP
2. Ajouter la configuration suivante dans le `php.ini` (adapter le chemin si nécessaire):

```
zend_extension="C:\\Program Files\\PHP-8.3\\ext\\php_xdebug.dll"
xdebug.mode=coverage
xdebug.start_with_request=yes
```

### Cloner le projet

Cloner le projet dans le répertoire voulu:

```
git clone git@github.com:Julien-rtg/y-corner.git
```

### JWT (Backend)

Créer le dossier `backend/config/jwt`, puis générer les clés:

1. Générer la clé privée:

```
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
```

2. Générer la clé publique:

```
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

3. Renseigner la variable `JWT_PASSPHRASE` dans le fichier `.env.local`

### Paramétrer le backend

Dupliquer le `.env` pour créer `.env.local` et `.env.test.local` (tests), puis renseigner les variables d’environnement suivantes:

- `DB_USER` = Utilisateur de la base
- `DB_PASSWORD` = Mot de passe de la base
- `SYMFONY_APP_SECRET` = Clé privée de l’app
- `JWT_PASSPHRASE` = Passphrase de JWT
- `DATABASE_URL` = URL de la base
- `MAILER_EMAIL` = Email utilisé pour l’envoi
- `MAILER_PASSWORD` = Mot de passe utilisé par le mailer
- `MAILER_DSN` = DSN du mailer
- `MONGODB_URL` = URL de la base MongoDB
- `MONGODB_DB` = Nom de la base MongoDB
- `SENTRY_DSN` = DSN de Sentry

Positionnez-vous dans le dossier `${projet}/backend` puis lancez:

```
composer install
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load
symfony serve
php bin/console websocket:serveur
```

#### Avec Docker (optionnel)

Si vous utilisez Docker, exécutez:

```
docker-compose up -d --build
docker exec -it "nom_de_l_image" bash
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load
php bin/console websocket:serveur
```

### Paramétrer le frontend

Positionnez-vous dans le dossier `${projet}/frontend` puis lancez:

```
npm install
npm run dev
```

Adapter les variables d’environnement du frontend dans `.env` si nécessaire.
