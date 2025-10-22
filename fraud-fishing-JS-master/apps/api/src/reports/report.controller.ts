import { Body, Controller, Post, Req, UseGuards, Get, Put, Param, Delete, Query, BadRequestException} from "@nestjs/common";
import { ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "../common/interfaces/authenticated-request";
import { ReportDto, CreateReportDto, UpdateReportDto, UpdateReportStatusDto, TagDto, VoteResponseDto} from "./dto/report.dto";
import { CommentDto } from "../comments/dto/comment.dto";
import { ReportService } from "./report.service";
import { NotificationService } from "../notifications/notification.service";

@ApiTags("Endpoints de Reportes")
@Controller("reports")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ====== POST ======
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear un nuevo reporte" })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({ status: 201, description: "Reporte creado exitosamente", type: ReportDto })
  async createReport(
    @Req() req: AuthenticatedRequest,
    @Body() createReportDto: CreateReportDto
  ): Promise<ReportDto | CommentDto> {
    const reportData = {
      ...createReportDto,
      userId: Number(req.user.profile.id),
    };
    return this.reportService.createReport(reportData);
  }

  // ====== GET UNIFICADO ======
  @Get()
  @ApiOperation({ summary: "Buscar reportes (endpoint unificado con filtros o por ID)" })
  @ApiQuery({ name: "id", required: false, type: Number, description: "ID del reporte (si se incluye, ignora los demás filtros)" })
  @ApiQuery({ name: "status", required: false, description: 'Puede ser "Pendiente", "En revisión", "Aprobado", "Rechazado" o un ID numérico' })
  @ApiQuery({ name: "userId", required: false, type: Number })
  @ApiQuery({ name: "categoryId", required: false, type: Number })
  @ApiQuery({ name: "url", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, enum: ["popular", "recent"] })
  @ApiQuery({
    name: "include",
    required: false,
    isArray: true,
    enum: ["status", "category", "user", "tags"],
  })
  @ApiQuery({ name: "siblings", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async searchReports(
    @Query("id") idRaw?: string,
    @Query("status") status?: string,
    @Query("userId") userIdRaw?: string,
    @Query("categoryId") categoryIdRaw?: string,
    @Query("url") url?: string,
    @Query("sort") sort?: "popular" | "recent",
    @Query("include") include?: string[], // ← NUEVO: leer include de la query
    @Query("page") pageRaw?: string,
    @Query("limit") limitRaw?: string
  ): Promise<ReportDto[] | ReportDto> {
    const id = idRaw ? Number(idRaw) : undefined;
    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
    const page = pageRaw ? Number(pageRaw) : undefined;
    const limit = limitRaw ? Number(limitRaw) : undefined;

    // 🟩 1. Buscar por ID (prioritario)
    if (id) {
      const report = await this.reportService.findById(id);
      if (!report) throw new BadRequestException(`No se encontró el reporte con id=${id}`);

      return report;
    }

    // 🟪 4. Búsqueda general con filtros
    return this.reportService.searchReports({
      status,
      userId,
      categoryId,
      url,
      sort,
      include, // ← NUEVO: pasar include al servicio
      page,
      limit,
    });
  }

  @Get(":id/tags")
  @ApiOperation({ summary: "Obtener tags asociados a un reporte" })
  async getTagsByReportId(@Param("id") id: string): Promise<TagDto[]> {
    return this.reportService.findTagsByReportId(Number(id));
  }

  @Get(":id/category")
  @ApiOperation({ summary: "Obtener categoría de un reporte" })
  async getCategoryByReportId(
    @Param("id") id: string
  ): Promise<{ categoryName: string }> {
    return this.reportService.findCategoryByReportId(Number(id));
  }

  // ====== PUT ======
  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Actualizar un reporte" })
  async updateReport(
    @Param("id") id: string,
    @Body() updateReportDto: UpdateReportDto
  ): Promise<ReportDto> {
    return this.reportService.updateReportById(Number(id), updateReportDto);
  }


  @Put(":id/vote")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Votar en un reporte" })
  @ApiResponse({ status: 200, description: "Voto procesado exitosamente", type: VoteResponseDto })
  async voteReport(@Param("id") id: string, @Req() req: AuthenticatedRequest): Promise<VoteResponseDto> {
    const userId = Number(req.user.profile.id);
    return this.reportService.voteReport(Number(id), userId);
  }

  @Put(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Actualizar el status de un reporte" })
  async updateReportStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateReportStatusDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ReportDto> {
    const moderatorId = Number(req.user.profile.id);
    return this.reportService.updateReportStatusWithModeration(
      Number(id),
      updateStatusDto.statusId,
      moderatorId,
      updateStatusDto.moderationNote
    );
  }

  @Put(":id/tags/from-text")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Agregar tags a un reporte por nombre" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        tagNames: {
          type: "array",
          items: { type: "string" },
          example: ["phishing", "banco", "nuevo-tag"],
        },
      },
    },
  })
  async addTagsToReport(
    @Param("id") id: string,
    @Body() body: { tagNames: string[] }
  ): Promise<TagDto[]> {
    return this.reportService.addTagsFromText(Number(id), body.tagNames);
  }

  // ====== DELETE ======
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Eliminar un reporte (solo propietario o admin)" })
  async deleteReport(@Param("id") id: string): Promise<void> {
    await this.reportService.deleteReport(Number(id));
  }
}
