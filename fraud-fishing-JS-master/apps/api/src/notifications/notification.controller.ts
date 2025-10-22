// Importaciones y controlador
import { Controller, Get, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiResponse, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationDto, UnreadCountDto } from './dto/notification.dto';
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';

@ApiTags("Endpoints de Notificaciones")
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    // Helper de autorización por propiedad
    private assertAccessToUser(req: AuthenticatedRequest, targetUserId: number): void {
        const requesterId = Number(req.user.profile.id);
        const isAdmin = !!req.user.profile.is_admin;
        if (requesterId !== targetUserId && !isAdmin) {
            throw new ForbiddenException('Acceso denegado - Solo puedes acceder a tus notificaciones');
        }
    }

    // ===== GET: Todas las notificaciones de un usuario =====
    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todas las notificaciones de un usuario' })
    @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number', example: 42 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados', example: 50 })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Desplazamiento', example: 0 })
    @ApiResponse({ status: 200, description: 'Lista de notificaciones', type: [NotificationDto] })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    async getNotificationsByUser(
        @Req() req: AuthenticatedRequest,
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string
    ): Promise<NotificationDto[]> {
        const uid = Number(userId);
        this.assertAccessToUser(req, uid);
        const l = limit ? Number(limit) : 50;
        const o = offset ? Number(offset) : 0;
        return this.notificationService.getNotificationsByUserId(uid, l, o);
    }

    // ===== GET: Conteo de no leídas =====
    @Get('user/:userId/unread-count')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas de un usuario' })
    @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number', example: 42 })
    @ApiResponse({ status: 200, description: 'Conteo de no leídas', type: UnreadCountDto })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    async getUnreadCount(
        @Req() req: AuthenticatedRequest,
        @Param('userId') userId: string
    ): Promise<UnreadCountDto> {
        const uid = Number(userId);
        this.assertAccessToUser(req, uid);
        const count = await this.notificationService.getUnreadCountByUserId(uid);
        return { count };
    }

    // ===== GET: No leídas =====
    @Get('user/:userId/unread')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar notificaciones no leídas de un usuario' })
    @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number', example: 42 })
    @ApiResponse({ status: 200, description: 'Lista de no leídas', type: [NotificationDto] })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    async getUnread(
        @Req() req: AuthenticatedRequest,
        @Param('userId') userId: string
    ): Promise<NotificationDto[]> {
        const uid = Number(userId);
        this.assertAccessToUser(req, uid);
        return this.notificationService.getUnreadNotificationsByUserId(uid);
    }

    // ===== GET: Detalle por ID =====
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener detalle de una notificación por su ID' })
    @ApiParam({ name: 'id', description: 'ID de la notificación', type: 'number', example: 1001 })
    @ApiResponse({ status: 200, description: 'Notificación encontrada', type: NotificationDto })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    async getById(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string
    ): Promise<NotificationDto> {
        const n = await this.notificationService.getNotificationById(Number(id));
        const requesterId = Number(req.user.profile.id);
        const isAdmin = !!req.user.profile.is_admin;
        if (n.userId !== requesterId && !isAdmin) {
            throw new ForbiddenException('Acceso denegado - Esta notificación no es tuya');
        }
        return n;
    }
}