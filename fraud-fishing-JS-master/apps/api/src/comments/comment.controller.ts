import { Body, Controller, Post, Get, Delete, Param, UseGuards, Req } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { ApiResponse, ApiTags, ApiBody, ApiOperation, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { CommentDto, CreateCommentDto } from "./dto/comment.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import * as authenticatedRequest from "src/common/interfaces/authenticated-request";

@ApiTags("Endpoints de Comentarios")
@Controller("comments")
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    // ===== POSTS =====

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear un nuevo comentario' })
    @ApiBody({ type: CreateCommentDto })
    @ApiResponse({ status: 201, description: "Comentario creado exitosamente", type: CommentDto })
    @ApiResponse({ status: 400, description: "Datos inválidos" })
    @ApiResponse({ status: 404, description: "Reporte no encontrado" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async createComment(@Body() createCommentDto: CreateCommentDto, @Req() req: authenticatedRequest.AuthenticatedRequest): Promise<CommentDto> {
        return this.commentService.createComment(createCommentDto, Number(req.user.profile.id));
    }

    // ===== GETS =====

    @Get('report/:reportId')
    @ApiOperation({ summary: 'Obtener todos los comentarios de un reporte' })
    @ApiParam({ name: 'reportId', description: 'ID del reporte', type: 'number' })
    @ApiResponse({ status: 200, description: "Comentarios obtenidos exitosamente", type: [CommentDto] })
    @ApiResponse({ status: 400, description: "ID de reporte inválido" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async getCommentsByReportId(@Param('reportId') reportId: string): Promise<CommentDto[]> {
        return this.commentService.findCommentsByReportId(Number(reportId));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un comentario por ID' })
    @ApiParam({ name: 'id', description: 'ID del comentario', type: 'number' })
    @ApiResponse({ status: 200, description: "Comentario obtenido exitosamente", type: CommentDto })
    @ApiResponse({ status: 400, description: "ID inválido" })
    @ApiResponse({ status: 404, description: "Comentario no encontrado" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async getCommentById(@Param('id') id: string): Promise<CommentDto> {
        return this.commentService.findById(Number(id));
    }

    // ===== DELETES =====

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar un comentario' })
    @ApiParam({ name: 'id', description: 'ID del comentario', type: 'number' })
    @ApiResponse({ status: 200, description: "Comentario eliminado exitosamente" })
    @ApiResponse({ status: 400, description: "ID inválido" })
    @ApiResponse({ status: 404, description: "Comentario no encontrado" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async deleteComment(@Param('id') id: string, @Req() req: authenticatedRequest.AuthenticatedRequest): Promise<void> {
        const commentId = Number(id);
        const requesterId = req.user.profile.id;
        const isAdmin = req.user.profile.is_admin;
        await this.commentService.deleteComment(commentId, Number(requesterId), isAdmin);
    }
}