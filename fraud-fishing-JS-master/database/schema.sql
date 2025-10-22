-- Limpiar tablas existentes con problemas
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `user_notification_preference`;
DROP TABLE IF EXISTS `report_status_history`;
DROP TABLE IF EXISTS `comment`;
DROP TABLE IF EXISTS `report_vote`;
DROP TABLE IF EXISTS `report`;

-- ---------------------------------
-- 1. Tablas Fundamentales
-- ---------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `salt` VARCHAR(255) NOT NULL,
  `is_admin` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_super_admin` BOOLEAN NOT NULL DEFAULT FALSE,
  `notifications_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_status` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tag` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `status_id` INT UNSIGNED NOT NULL DEFAULT 1, 
  `image_url` VARCHAR(255) NULL,
  `vote_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_report_user` (`user_id`),
  KEY `fk_report_category` (`category_id`),
  KEY `fk_report_status` (`status_id`),
  KEY `idx_popularity` (`vote_count` DESC, `created_at` DESC),
  KEY `idx_url` (`url`),
  CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_report_status` FOREIGN KEY (`status_id`) REFERENCES `report_status` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia para tags
CREATE TABLE IF NOT EXISTS `report_tag` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_tag` (`report_id`, `tag_id`),
  KEY `fk_rt_report` (`report_id`),
  KEY `fk_rt_tag` (`tag_id`),
  CONSTRAINT `fk_rt_report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------
-- 2. Tablas de Interacción
-- ---------------------------------
CREATE TABLE IF NOT EXISTS `report_vote` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `report_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_report` (`user_id`, `report_id`),
  KEY `fk_vote_user` (`user_id`),
  KEY `fk_vote_report` (`report_id`),
  CONSTRAINT `fk_vote_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vote_report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comment_report` (`report_id`),
  KEY `fk_comment_user` (`user_id`),
  CONSTRAINT `fk_comment_report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------
-- 3. Sistema de Notificaciones Simplificado
-- ---------------------------------

CREATE TABLE IF NOT EXISTS `notification` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `related_id` BIGINT UNSIGNED NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notification_user` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------
-- 4. Historial de Estados
-- ---------------------------------
CREATE TABLE IF NOT EXISTS `report_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` BIGINT UNSIGNED NOT NULL,
  `from_status_id` INT UNSIGNED NULL,
  `to_status_id` INT UNSIGNED NOT NULL,
  `note` VARCHAR(255),
  `change_reason` TEXT,
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by_user_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_history_report` (`report_id`),
  KEY `fk_history_user` (`changed_by_user_id`),
  KEY `fk_history_from_status` (`from_status_id`),
  KEY `fk_history_to_status` (`to_status_id`),
  CONSTRAINT `fk_history_report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_from_status` FOREIGN KEY (`from_status_id`) REFERENCES `report_status` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_history_to_status` FOREIGN KEY (`to_status_id`) REFERENCES `report_status` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_report_status_change;
DELIMITER $$
CREATE TRIGGER trg_report_status_change
AFTER UPDATE ON report
FOR EACH ROW
BEGIN
    IF NEW.status_id <> OLD.status_id THEN
        DECLARE new_status_name VARCHAR(50);
        SELECT rs.name INTO new_status_name FROM report_status rs WHERE rs.id = NEW.status_id LIMIT 1;

        INSERT INTO notification (user_id, title, message, related_id, is_read)
        VALUES (
            NEW.user_id,
            'Estado de reporte actualizado',
            CONCAT('Tu reporte "', COALESCE(NEW.title, NEW.url), '" ahora está: ', new_status_name),
            NEW.id,
            FALSE
        );
    END IF;
END$$
DELIMITER ;
