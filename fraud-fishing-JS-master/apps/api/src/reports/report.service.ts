// ReportService (dynamic search)
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Report, ReportRepository, ReportWithStatus } from "./report.repository";
import { ReportDto, CreateReportDto, UpdateReportDto, ReportStatusDto, TagDto, VoteResponseDto } from "./dto/report.dto";
import { CommentService } from "src/comments/comment.service";
import { NotificationService } from '../notifications/notification.service'; // ← Agregar

@Injectable()
export class ReportService {
    constructor(
        private readonly reportRepository: ReportRepository,
        private readonly commentService: CommentService,
        private readonly notificationService: NotificationService 
    ) {}

    // --- GETS ---

    async findAllReports(): Promise<ReportDto[]> {
        const reports = await this.reportRepository.findAllReports();
        return reports.map(report => this.mapReportToDto(report));
    }
    
    async findAllReportsWithStatus(): Promise<ReportDto[]> {
        const reports = await this.reportRepository.findAllReportsWithStatus();
        return reports.map(report => this.mapReportWithStatusToDto(report));
    }
    
    async findById(id: number): Promise<ReportDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }

        const report = await this.reportRepository.findById(id);
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }

        return this.mapReportToDto(report);
    }

    async findByIdWithStatus(id: number): Promise<ReportDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }

        const report = await this.reportRepository.findByIdWithStatus(id);
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }

        return this.mapReportWithStatusToDto(report);
    }

    async findReportByUrl(url: string): Promise<ReportDto> {
        if (!url || url.trim() === "") {
            throw new BadRequestException("URL es requerida");
        }

        const report = await this.reportRepository.findReportByUrl(url.trim());
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }

        return this.mapReportToDto(report);
    }
    
    async findPopularReports(limit: number = 10): Promise<ReportDto[]> {
        if (limit <= 0 || limit > 100) {
            throw new BadRequestException("Límite debe estar entre 1 y 100");
        }

        const reports = await this.reportRepository.findPopularReports(limit);
        return reports.map(report => this.mapReportToDto(report));
    }

    async findActiveReportsByUserId(userId: number): Promise<ReportDto[]> {
        if (!userId || userId <= 0) {
            throw new BadRequestException("ID de usuario inválido");
        }

        const reports = await this.reportRepository.findActiveReportsByUserId(userId);
        return reports.map(report => this.mapReportToDto(report));
    }

    async findCompletedReportsByUserId(userId: number): Promise<ReportDto[]> {
        if (!userId || userId <= 0) {
            throw new BadRequestException("ID de usuario inválido");
        }

        const reports = await this.reportRepository.findCompletedReportsByUserId(userId);
        return reports.map(report => this.mapReportToDto(report));
    }

    async findCategoryByReportId(reportId: number): Promise<{ categoryName: string }> {
        const categoryName = await this.reportRepository.findCategoryByReportId(reportId);
        if (!categoryName) {
            throw new NotFoundException(`Categoría para el reporte con ID ${reportId} no encontrada`);
        }
        return { categoryName };  // ← Devolver objeto en lugar de string simple
    }

    async findTagsByReportId(reportId: number): Promise<TagDto[]> {  // ← Cambiar de string[] a TagDto[]
        const tags = await this.reportRepository.findTagsByReportId(reportId);
        
        // Mapear correctamente a TagDto
        return tags.map(tag => ({
            id: tag.id,
            name: tag.name,
        }));
    }


    // --- POSTS ---

    async createReport(createReportDto: CreateReportDto): Promise<ReportDto> {
        const { userId, categoryId, title, description, url, imageUrl, tagNames } = createReportDto;

        if (typeof userId !== 'number' || typeof categoryId !== 'number') {
            throw new BadRequestException("userId y categoryId son requeridos y deben ser números");
        }

        // 1) Crear el reporte
        await this.reportRepository.createReport(
            userId, categoryId, title.trim(), description.trim(), url.trim(), imageUrl
        );

        // 2) Obtener el nuevo reporte
        const newReport = await this.reportRepository.findLatestReportByUserAndUrl(userId, url.trim());
        if (!newReport) throw new Error("Error al crear el reporte");

        // 3) Asociar tags (solo por nombres)
        if (tagNames?.length) {
            const tagIds = await this.reportRepository.findOrCreateTagsByNames(tagNames);
            if (tagIds.length) {
                await this.reportRepository.addTagsToReport(newReport.id, tagIds);
            }
        }

        return this.mapReportToDto(newReport);
    }

    // Simplificar métodos de tags
    async addTagsFromText(reportId: number, tagNames: string[]): Promise<TagDto[]> {
        const ids = await this.reportRepository.findOrCreateTagsByNames(tagNames);
        await this.reportRepository.addTagsToReport(reportId, ids);
        const tags = await this.reportRepository.findTagsByReportId(reportId);
        return tags.map(t => ({ id: t.id, name: t.name }));
    }

    // --- PUTS ---

    async updateReportById(id: number, updateReportDto: UpdateReportDto): Promise<ReportDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }

        const existingReport = await this.reportRepository.findById(id);
        if (!existingReport) {
            throw new NotFoundException("Reporte no encontrado");
        }

        const { title, description, url, categoryId, imageUrl } = updateReportDto;

        const finalTitle = title || existingReport.title;
        const finalDescription = description || existingReport.description;
        const finalUrl = url || existingReport.url;
        const finalCategoryId = categoryId || existingReport.category_id;
        const finalImageUrl = imageUrl ?? existingReport.image_url;
        await this.reportRepository.updateReport(id, finalTitle, finalDescription, finalUrl, finalCategoryId, finalImageUrl);

        const updatedReport = await this.reportRepository.findById(id);
        return this.mapReportToDto(updatedReport);
    }

    

    // --- VOTING ---

    async voteReport(reportId: number, userId: number): Promise<VoteResponseDto> {
        if (!reportId || reportId <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }
        if (!userId || userId <= 0) {
            throw new BadRequestException("Usuario inválido");
        }
        const report = await this.reportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }

        const existingVote = await this.reportRepository.findUserVoteOnReport(reportId, userId);

        if (existingVote) {
            await this.reportRepository.removeUserVoteOnReport(reportId, userId);
        } else {
            await this.reportRepository.addUserVoteOnReport(reportId, userId);
        }        
        
        const updatedReport = await this.reportRepository.findById(reportId);
        const hasVoted = !existingVote; // Si existía el voto, ahora no lo tiene; si no existía, ahora lo tiene
        
        return {
            voteCount: updatedReport.vote_count,
            hasVoted: hasVoted
        };
    }

    // --- DELETES ---

    async deleteReport(id: number): Promise<void> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }

        const report = await this.reportRepository.findById(id);
        if (!report) {
            throw new NotFoundException("Reporte no encontrado");
        }

        await this.reportRepository.deleteReport(id);
    }

    // --- STATUS MANAGEMENT ---

    async getAllReportStatuses(): Promise<ReportStatusDto[]> {
        const statuses = await this.reportRepository.getAllReportStatuses();
        return statuses.map(status => ({
            id: status.id,
            name: status.name,
            description: status.description
        }));
    }

    // ===== NUEVO MÉTODO PARA ACTUALIZAR STATUS =====

    async updateReportStatusWithModeration(
        reportId: number, 
        newStatusId: number, 
        moderatorId: number,
        moderationNote?: string
    ): Promise<ReportDto> {
        // 1. Validaciones básicas
        if (!reportId || reportId <= 0) {
            throw new BadRequestException("ID de reporte inválido");
        }

        if (!newStatusId || newStatusId <= 0) {
            throw new BadRequestException("ID de status inválido");
        }

        // 2. Obtener el reporte actual
        const currentReport = await this.reportRepository.findByIdWithStatus(reportId);
        if (!currentReport) {
            throw new NotFoundException("Reporte no encontrado");
        }

        // 3. Verificar que el status existe
        const newStatus = await this.reportRepository.findStatusById(newStatusId);
        if (!newStatus) {
            throw new BadRequestException("Status inválido");
        }

        // 4. No actualizar si ya tiene el mismo status
        if (currentReport.status_id === newStatusId) {
            throw new BadRequestException("El reporte ya tiene ese status");
        }

        // 5. Obtener el status anterior
        const previousStatus = await this.reportRepository.findStatusById(currentReport.status_id);

        // 6. Actualizar el status en la base de datos
        await this.reportRepository.updateReportStatusWithModeration(
            reportId, 
            newStatusId, 
            moderatorId, 
            moderationNote
        );

        // 7. Registrar en historial
        await this.reportRepository.addStatusHistoryEntry(
            reportId,
            currentReport.status_id,
            newStatusId,
            moderationNote || `Status cambiado de ${previousStatus?.name} a ${newStatus.name}`,
            `Status actualizado por moderador`,
            moderatorId
        );

        // 9. Obtener el reporte actualizado (el trigger ya creó la notificación)
        const updatedReport = await this.reportRepository.findByIdWithStatus(reportId);
        return this.mapReportWithStatusToDto(updatedReport);
    }

    // ===== MÉTODOS HELPER =====

    // --- HELPER METHODS ---

    private mapReportToDto(report: Report): ReportDto {
        return {
            id: report.id,
            userId: report.user_id,
            categoryId: report.category_id,
            title: report.title,
            description: report.description,
            url: report.url,
            statusId: report.status_id,
            imageUrl: report.image_url,
            voteCount: report.vote_count,
            commentCount: report.comment_count,
            createdAt: report.created_at,
            updatedAt: report.updated_at
        };
    }

    private mapReportWithStatusToDto(report: ReportWithStatus): ReportDto {
        return {
            id: report.id,
            userId: report.user_id,
            categoryId: report.category_id,
            title: report.title,
            description: report.description,
            url: report.url,
            statusId: report.status_id,
            statusName: report.status_name,
            statusDescription: report.status_description,
            imageUrl: report.image_url,
            voteCount: report.vote_count,
            commentCount: report.comment_count,
            createdAt: report.created_at,
            updatedAt: report.updated_at
        };
    }

    async searchReports(options: {
        status?: string;
        userId?: number;
        categoryId?: number;
        url?: string;
        sort?: "popular" | "recent";
        include?: string[];
        page?: number;
        limit?: number;
    }): Promise<ReportDto[]> {
        const include = options.include || [];
        const includeStatus = include.includes("status");
        const includeCategory = include.includes("category");
        const includeUser = include.includes("user");
        const includeTags = include.includes("tags");

        // status mapping
        let statusIds: number[] | undefined;
        const s = (options.status || "").trim();
        if (s) {
            if (s === "active") statusIds = [1, 2];
            else if (s === "completed") statusIds = [3, 4];
            else if (s === "primary") statusIds = undefined; // handled at controller
            else if (!Number.isNaN(Number(s))) statusIds = [Number(s)];
        }

        const page = options.page && options.page > 0 ? options.page : 1;
        const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
        const offset = (page - 1) * limit;

        const rows = await this.reportRepository.searchReports({
            userId: options.userId,
            categoryId: options.categoryId,
            url: options.url?.trim(),
            statusIds,
            sort: options.sort,
            includeStatus,
            includeCategory,
            includeUser,
            includeTags, // ← NUEVO
            limit,
            offset,
        });

        const dtos = rows.map(r => this.mapDynamicRowToDto(r, { includeStatus, includeCategory, includeUser }));

        // ← Ajuste: filtrar nulos al mapear tags
        if (includeTags) {
            for (let i = 0; i < rows.length; i++) {
                const raw = rows[i] as any;
                const dto = dtos[i];
                const rawTags = raw?.tags_json;

                let tagsArray: Array<{ id: number; name: string } | null> = [];
                if (rawTags) {
                    if (typeof rawTags === "string") {
                        try { tagsArray = JSON.parse(rawTags); } catch { tagsArray = []; }
                    } else if (Array.isArray(rawTags)) {
                        tagsArray = rawTags;
                    }
                }
                // Si el error persiste, la forma más limpia y estricta es:
                const validTags = (tagsArray ?? [])
                    .filter((t): t is { id: any; name: any } => t != null) // Garantiza que t no es null/undefined
                    .filter((t) => t.id != null && t.name != null); // Verifica las propiedades.


                // La asignación final (se mantiene igual):
                dto.tags = validTags.map(t => ({ id: Number(t.id), name: String(t.name) }));
            }
        }

        return dtos;
    }

    private mapDynamicRowToDto(row: any, opts: { includeStatus: boolean; includeCategory: boolean; includeUser: boolean; }): ReportDto {
        const base: ReportDto = {
            id: row.id,
            userId: row.user_id,
            categoryId: row.category_id,
            title: row.title,
            description: row.description,
            url: row.url,
            statusId: row.status_id,
            imageUrl: row.image_url,
            voteCount: row.vote_count,
            commentCount: row.comment_count,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        } as ReportDto;
    
        if (opts.includeStatus) {
            base.statusName = row.status_name;
            base.statusDescription = row.status_description;
        }
        // ← Nuevo: mapear nombre de categoría cuando se pidió include=category
        if (opts.includeCategory) {
            base.categoryName = row.category_name;
        }
        // category/user names can be extended here if you add columns
        return base;
    }
}



