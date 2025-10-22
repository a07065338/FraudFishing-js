import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        // Verificar si es admin
        if (!user.profile.is_admin) {
            throw new ForbiddenException('Acceso denegado - Se requieren permisos de administrador');
        }

        return true;
    }
}