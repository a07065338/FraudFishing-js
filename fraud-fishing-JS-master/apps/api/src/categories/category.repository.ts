import { Injectable } from "@nestjs/common";
import { DbService } from "../db/db.service"; // Corregir ruta relativa

export type Category = {
    id: number;
    name: string;
    description: string; 
}

@Injectable()
export class CategoryRepository {
    constructor(private readonly dbService: DbService) {}

    // --- POSTS ---

    // Crear categoría
    async createCategory(name: string, description: string): Promise<void> {
        const sql = `INSERT INTO category (name, description) VALUES (?, ?)`;
        await this.dbService.getPool().query(sql, [name, description]);
    }

    // --- GETS ---

    // Obtener todas las categorías (para listados)
    async findAllCategories(): Promise<Category[]> {
        const sql = `SELECT * FROM category`;
        const [rows] = await this.dbService.getPool().query(sql);
        return rows as Category[];
    }

    // Obtener categoría por ID (detalldada para admin)
    async findById(id: number): Promise<Category> {
        const sql = `SELECT * FROM category WHERE id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [id]);
        const result = rows as Category[];
        return result[0];
    }

    // Obtener categoría por nombre (Sirve para checar si ya existe una)
    async findByName(name: string): Promise<Category> {
        const sql = `SELECT * FROM category WHERE name = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [name]);
        const result = rows as Category[];
        return result[0];
    }

    // Obtener categorías más usadas (Dashboard del admin)
    async findTopCategories(limit: number): Promise<{ name: string; usage_count: number }[]> {
        const sql = `
            SELECT c.name, COUNT(r.id) AS usage_count
            FROM category c
            LEFT JOIN report r ON c.id = r.category_id
            GROUP BY c.id
            ORDER BY usage_count DESC
            LIMIT ?
        `;
        const [rows] = await this.dbService.getPool().query(sql, [limit]);
        return rows as { name: string; usage_count: number }[];
    }

    // --- PUTS ---

    // Actualizar categoría
    async updateCategory(id: number, name: string, description: string): Promise<void> {
        const sql = `UPDATE category SET name = ?, description = ? WHERE id = ?`;
        await this.dbService.getPool().query(sql, [name, description, id]);
    }

    // --- DELETES ---

    // Eliminar categoría
    async deleteCategory(id: number): Promise<void> {
        const sql = `DELETE FROM category WHERE id = ?`;
        await this.dbService.getPool().query(sql, [id]);
    }
}