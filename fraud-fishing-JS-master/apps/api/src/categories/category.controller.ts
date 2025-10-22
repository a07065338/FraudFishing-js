import { Body, Controller, Post, Get, Delete, Param, Put, UseGuards } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { ApiResponse, ApiTags, ApiBody, ApiOperation, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { AdminGuard } from "src/common/guards/admin.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";

@ApiTags("Endpoints de Categorías")
@Controller("categories")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    // ===== POSTS =====

    // Crear categoría
    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard) 
    @ApiOperation({ summary: 'Crear una nueva categoría' })
    @ApiBearerAuth()
    @ApiBody({ type: CreateCategoryDto })
    @ApiResponse({ status: 201, description: "Categoría creada exitosamente", type: CategoryDto })
    @ApiResponse({ status: 400, description: "Datos inválidos o categoría ya existe" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.createCategory(createCategoryDto);
    }

    // ===== GETS =====

    // Obtener todas las categorías
    @Get()
    @ApiOperation({ summary: 'Obtener todas las categorías' })
    @ApiResponse({ status: 200, description: "Lista de categorías obtenida exitosamente", type: [CategoryDto] })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async getAllCategories(): Promise<CategoryDto[]> {
        return this.categoryService.findAllCategories();
    }

    // Obtener categorías más usadas (Dashboard del admin)
    @Get('top/:limit')
    @ApiOperation({ summary: 'Obtener las categorías más usadas' })
    @ApiParam({ name: 'limit', description: 'Número máximo de categorías a retornar', type: 'number' })
    @ApiResponse({ status: 200, description: "Lista de categorías obtenida exitosamente", type: [CategoryDto] })
    async getTopCategories(@Param('limit') limit: string): Promise<{ name: string; usage_count: number }[]> {
        return this.categoryService.findTopCategories(Number(limit));
    }

    // Obtener categoría por ID
    @Get(':id')
    @ApiOperation({ summary: 'Obtener una categoría por ID' })
    @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
    @ApiResponse({ status: 200, description: "Categoría obtenida exitosamente", type: CategoryDto })
    @ApiResponse({ status: 400, description: "ID inválido" })
    @ApiResponse({ status: 404, description: "Categoría no encontrada" })
    async getCategoryById(@Param('id') id: string): Promise<CategoryDto> {
        return this.categoryService.findById(Number(id));
    }

    // ===== PUTS =====

    // Actualizar categoría
    @Put(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar una categoría existente' })
    @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiResponse({ status: 200, description: "Categoría actualizada exitosamente", type: CategoryDto })
    @ApiResponse({ status: 400, description: "ID inválido o datos inválidos" })
    @ApiResponse({ status: 404, description: "Categoría no encontrada" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.updateCategory(Number(id), updateCategoryDto);
    }

    // ===== DELETES =====

    // Eliminar categoría
    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar una categoría' })
    @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
    @ApiResponse({ status: 200, description: "Categoría eliminada exitosamente" })
    @ApiResponse({ status: 400, description: "ID inválido" })
    @ApiResponse({ status: 404, description: "Categoría no encontrada" })
    @ApiResponse({ status: 500, description: "Error interno del servidor" })
    async deleteCategory(@Param('id') id: string): Promise<void> {
        await this.categoryService.deleteCategory(Number(id));
    }
}