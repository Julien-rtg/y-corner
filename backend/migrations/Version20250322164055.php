<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250322164055 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE equipment ADD user_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipment ADD CONSTRAINT FK_D338D583A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_D338D583A76ED395 ON equipment (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE equipment DROP FOREIGN KEY FK_D338D583A76ED395');
        $this->addSql('DROP INDEX IDX_D338D583A76ED395 ON equipment');
        $this->addSql('ALTER TABLE equipment DROP user_id');
    }
}
