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

    async searchReports(
    optionsOrStatus:
      | {
          status?: string;
          userId?: number;
          categoryId?: number;
          url?: string;
          sort?: 'popular' | 'recent';
          include?: string[];
          page?: number;
          limit?: number;
        }
      | string,
    userId?: number,
    categoryId?: number,
    url?: string,
    sort?: 'popular' | 'recent',
    include?: string[],
    page?: number,
    limit?: number,
  ): Promise<ReportDto[]> {
    // 👇 Normalizamos los parámetros a un solo objeto
    const options =
      typeof optionsOrStatus === 'string'
        ? { status: optionsOrStatus, userId, categoryId, url, sort, include, page, limit }
        : optionsOrStatus;

    // --- Preparar flags de inclusión ---
    const includeList = options.include || [];
    const includeStatus = includeList.includes('status');
    const includeCategory = includeList.includes('category');
    const includeUser = includeList.includes('user');
    const includeTags = includeList.includes('tags');

    // --- Resolver status y paginación ---
    const statusIds = this.resolveStatusIds(options.status);
    const { page: currentPage, limit: currentLimit, offset } = this.resolvePagination(
      options.page,
      options.limit,
    );

    // --- Ejecutar búsqueda ---
    const rows = await this.reportRepository.searchReports({
      userId: options.userId,
      categoryId: options.categoryId,
      url: options.url?.trim(),
      statusIds,
      sort: options.sort,
      includeStatus,
      includeCategory,
      includeUser,
      includeTags,
      limit: currentLimit,
      offset,
    });

    // --- Mapear a DTO ---
    const dtos = rows.map((r) =>
      this.mapDynamicRowToDto(r, { includeStatus, includeCategory, includeUser }),
    );

    // --- Agregar tags si aplica ---
    return includeTags ? this.attachTagsToDtos(rows, dtos) : dtos;
  }

  // 🔹 Resolver los IDs de estado
  private resolveStatusIds(status?: string): number[] | undefined {
    if (!status) return undefined;
    const s = status.trim();
    if (s === 'active') return [1, 2];
    if (s === 'completed') return [3, 4];
    if (s === 'primary') return undefined; // handled at controller
    if (!Number.isNaN(Number(s))) return [Number(s)];
    return undefined;
  }

  // 🔹 Calcular paginación segura
  private resolvePagination(page?: number, limit?: number) {
    const validPage = page && page > 0 ? page : 1;
    const validLimit = limit && limit > 0 ? Math.min(limit, 100) : 20;
    const offset = (validPage - 1) * validLimit;
    return { page: validPage, limit: validLimit, offset };
  }

  // 🔹 Adjuntar tags a los DTOs (si están incluidos)
  private attachTagsToDtos(rows: any[], dtos: ReportDto[]): ReportDto[] {
    return dtos.map((dto, i) => {
      const raw = rows[i];
      const tags = this.parseTags(raw?.tags_json);
      return { ...dto, tags };
    });
  }

  // 🔹 Parsear tags de JSON o arreglo
  private parseTags(rawTags: any): { id: number; name: string }[] {
    if (!rawTags) return [];
    if (typeof rawTags === 'string') {
      try {
        return JSON.parse(rawTags);
      } catch {
        return [];
      }
    }
    if (Array.isArray(rawTags)) return rawTags;
    return [];
  }

  // 🔹 Ejemplo placeholder: mapea fila a DTO dinámico
  private mapDynamicRowToDto(row: any, options: any): ReportDto {
    // Aquí iría tu lógica real de mapeo de columnas a propiedades del DTO
    return {
      id: row.id,
      url: row.url,
      description: row.description,
      createdAt: row.created_at,
      ...(options.includeStatus && { status: row.status_name }),
      ...(options.includeCategory && { category: row.category_name }),
      ...(options.includeUser && { user: row.user_name }),
    } as ReportDto;
  }
}


