import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { CategoryRepository } from "./category.repository";
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoryService {
    constructor(private readonly categoryRepository: CategoryRepository) {}

    // --- POSTS ---

    // Crear categoría
    async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const { name, description } = createCategoryDto;
                const existingCategory = await this.categoryRepository.findByName(name);
        if (existingCategory) {
            throw new BadRequestException("Ya existe una categoría con ese nombre");
        }
        await this.categoryRepository.createCategory(name, description);
        const newCategory = await this.categoryRepository.findByName(name);
        return {
            id: newCategory.id,
            name: newCategory.name,
            description: newCategory.description
        };
    }

    // --- GETS ---

    // Obtener todas las categorías (para listados)
    async findAllCategories(): Promise<CategoryDto[]> {
        const categories = await this.categoryRepository.findAllCategories();
        return categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description
        }));
    }

    // Obtener categoría por ID (detallada para admin)
    async findById(id: number): Promise<CategoryDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de categoría inválido");
        }
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new NotFoundException("Categoría no encontrada");
        }
        return {
            id: category.id,
            name: category.name,
            description: category.description
        };
    }

    // Obtener categorías más usadas (Dashboard del admin)
    async findTopCategories(limit: number): Promise<{ name: string; usage_count: number }[]> {
        if (!limit || limit <= 0) {
            throw new BadRequestException("Límite inválido");
        }
        const categories = await this.categoryRepository.findTopCategories(limit);
        return categories.map(category => ({
            name: category.name,
            usage_count: category.usage_count
        }));
    }

    // --- PUTS ---

    // Actualizar categoría
    async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de categoría inválido");
        }

        const existingCategory = await this.categoryRepository.findById(id);
        if (!existingCategory) {
            throw new NotFoundException("Categoría no encontrada");
        }
        const { name, description } = updateCategoryDto;

        if (name && name !== existingCategory.name) {
            const categoryWithSameName = await this.categoryRepository.findByName(name);
            if (categoryWithSameName) {
                throw new BadRequestException("Ya existe una categoría con ese nombre");
            }
        }

        const finalName = name || existingCategory.name;
        const finalDescription = description || existingCategory.description;
        await this.categoryRepository.updateCategory(id, finalName, finalDescription);
        return {
            id: existingCategory.id,
            name: finalName,
            description: finalDescription
        };
    }

    // --- DELETES ---

    // Eliminar categoría
    async deleteCategory(id: number): Promise<void> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de categoría inválido");
        }
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new NotFoundException("Categoría no encontrada");
        }
        await this.categoryRepository.deleteCategory(id);
    }
}