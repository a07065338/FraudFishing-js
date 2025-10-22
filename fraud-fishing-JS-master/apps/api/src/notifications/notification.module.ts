import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationController } from './notification.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [
    NotificationController,
  ],
  providers: [
    NotificationService,
    NotificationRepository,
  ],
  exports: [
    NotificationService, // Exportar para que otros módulos puedan inyectarlo
    NotificationRepository, // Por si algún módulo necesita acceso directo
  ],
  imports: [AuthModule],
})
export class NotificationModule {}