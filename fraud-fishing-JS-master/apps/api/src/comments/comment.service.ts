import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Comment, CommentRepository } from "./comment.repository";
import { CommentDto, CreateCommentDto } from "./dto/comment.dto";
import { ReportRepository } from "src/reports/report.repository";

@Injectable()
export class CommentService {
    constructor(private readonly commentRepository: CommentRepository, private readonly reportRepository: ReportRepository) {}

    // --- POSTS ---

    async createComment(createCommentDto: CreateCommentDto, userId: number): Promise<CommentDto> {
        const { reportId, title, content } = createCommentDto;
        await this.commentRepository.createComment(reportId, userId, title, content);
        const report = await this.reportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }
        if (report.status_id !== 3) {
            throw new BadRequestException("No se pueden agregar comentarios a un reporte que no está en estado 'Aceptado'");
        }
        await this.reportRepository.incrementCommentCount(reportId);
        
        const newComment = await this.commentRepository.findLatestCommentByUserAndReport(userId, reportId);
        return this.mapCommentToDto(newComment);
    }

    // --- GETS ---

    async findCommentsByReportId(reportId: number): Promise<CommentDto[]> {
        if (!reportId || reportId <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }
        const comments = await this.commentRepository.findCommentsByReportId(reportId);
        return comments.map(comment => this.mapCommentToDto(comment));
    }

    async findById(id: number): Promise<CommentDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de comentario inválido");
        }
        const comment = await this.commentRepository.findById(id);
        if (!comment) {
            throw new NotFoundException("Comentario no encontrado");
        }
        return this.mapCommentToDto(comment);
    }

    // --- DELETES ---

    async deleteComment(id: number, requesterId: number, isAdmin: boolean): Promise<void> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de comentario inválido");
        }
        const comment = await this.commentRepository.findById(id);
        if (!comment) {
            throw new NotFoundException("Comentario no encontrado");
        }

        if (comment.user_id !== requesterId && !isAdmin) {
            throw new ForbiddenException("No tienes permiso para eliminar este comentario.");
        }

        const report = await this.reportRepository.findById(comment.report_id);
        await this.reportRepository.decrementCommentCount(report.id);

        await this.commentRepository.deleteComment(id);
    }

    // --- HELPER METHODS ---

    private mapCommentToDto(comment: Comment): CommentDto {
        return {
            id: comment.id,
            reportId: comment.report_id,
            userId: comment.user_id,
            title: comment.title,
            content: comment.content,
            createdAt: comment.created_at,
        };
    }
}