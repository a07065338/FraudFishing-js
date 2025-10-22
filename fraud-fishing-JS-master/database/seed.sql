use fraudfishing;

INSERT INTO `user`
(`name`, `email`, `password_hash`, `salt`, `is_admin`, `is_super_admin`, `notifications_enabled`, `created_at`)
VALUES
('Carlos Mendoza', 'carlos@example.com', 'hash123', 'salt123', FALSE, FALSE, TRUE, NOW()),
('María López', 'maria@example.com', 'hash456', 'salt456', TRUE, FALSE, TRUE, NOW()),
('Javier Torres', 'javier@example.com', 'hash789', 'salt789', FALSE, FALSE, TRUE, NOW()),
('Laura Ramírez', 'laura@example.com', 'hashabc', 'saltabc', FALSE, FALSE, TRUE, NOW()),
('Administrador General', 'admin@example.com', 'hashroot', 'saltroot', TRUE, TRUE, TRUE, NOW());


INSERT INTO `notification`
(`user_id`, `title`, `message`, `related_id`, `is_read`, `created_at`, `updated_at`)
VALUES
(6, 'Nuevo mensaje', 'Tienes un nuevo mensaje en tu bandeja.', NULL, FALSE, NOW(), NOW()),

(6, 'Actualización de reporte', 'El reporte #102 ha cambiado su estado a "Aprobado".', 102, TRUE, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),

(6, 'Nueva asignación', 'Se te ha asignado una nueva tarea: revisión de contenido.', NULL, FALSE, NOW(), NOW()),

(6, 'Cambio de contraseña exitoso', 'Tu contraseña fue actualizada correctamente.', NULL, TRUE, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),

(6, 'Recordatorio de seguridad', 'Por favor, activa la autenticación de dos factores.', NULL, FALSE, NOW(), NOW()),

(6, 'Reporte rechazado', 'El reporte #89 fue rechazado por el administrador.', 89, FALSE, NOW(), NOW()),

(6, 'Reporte aprobado', 'El reporte #90 fue aprobado exitosamente.', 90, TRUE, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY);

INSERT INTO report_status (name, description) VALUES
('Pendiente', 'El reporte fue recibido y está pendiente de revisión'),
('En revisión', 'El reporte está siendo analizado por el equipo'),
('Aprobado', 'El reporte fue aprobado'),
('Rechazado', 'El reporte fue rechazado');

INSERT INTO category (name, description) VALUES
('Phishing', 'Reportes relacionados con intentos de suplantación'),
('Malware', 'Reportes sobre archivos o sitios maliciosos');

INSERT INTO report (user_id, category_id, title, description, url, status_id)
VALUES
(6, 1, 'Correo sospechoso de banco', 'Recibí un correo que parece falso.', 'https://phishing-example.com', 1),
(6, 2, 'Sitio infectado con malware', 'Descargué un archivo desde este sitio y resultó ser malware.', 'https://malware-test.com', 1);

UPDATE report
SET status_id = 2
WHERE id = 1;



