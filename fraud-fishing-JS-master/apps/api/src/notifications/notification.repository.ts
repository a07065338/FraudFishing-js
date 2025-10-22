import { Injectable } from "@nestjs/common";
import { DbService } from "../db/db.service";

export type Notification = {
    id: number;
    user_id: number;
    title: string;
    message: string;
    related_id?: number;
    is_read: boolean;
    created_at: Date;
    updated_at: Date;
}

@Injectable()
export class NotificationRepository {
    constructor(private readonly dbService: DbService) {}

    // --- POSTs ---

    // Crear notificaciones adaptado a la nueva estructura
    async createNotification(userId: number, title: string, message: string, relatedId?: number): Promise<void> {
        const sql = `
            INSERT INTO notification (user_id, title, message, related_id, is_read) 
            VALUES (?, ?, ?, ?, false)
        `;
        await this.dbService.getPool().query(sql, [userId, title, message, relatedId || null]);
    }

    // --- GETs ---

    // Otros métodos necesarios para el funcionamiento básico
    async findNotificationsByUserId(userId: number, limit: number = 50, offset: number = 0): Promise<Notification[]> {
        const sql = `
            SELECT n.*
            FROM notification n
            WHERE n.user_id = ? 
            ORDER BY n.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await this.dbService.getPool().query(sql, [userId, limit, offset]);
        return rows as Notification[];
    }

    // Obtener notificaciones no leídas de un usuario
    async findUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
        const sql = `
            SELECT n.*
            FROM notification n
            WHERE n.user_id = ? AND n.is_read = false 
            ORDER BY n.created_at DESC
        `;
        const [rows] = await this.dbService.getPool().query(sql, [userId]);
        return rows as Notification[];
    }

    // Contar notificaciones no leídas de un usuario
    async getUnreadCountByUserId(userId: number): Promise<number> {
        const sql = `
            SELECT COUNT(*) as count 
            FROM notification 
            WHERE user_id = ? AND is_read = false
        `;
        const [rows] = await this.dbService.getPool().query(sql, [userId]);
        const result = rows as Array<{ count: number }>;
        return result[0]?.count || 0;
    }

    // Obtener notificación por ID
    async findById(id: number): Promise<Notification> {
        const sql = `
            SELECT n.*
            FROM notification n
            WHERE n.id = ? 
            LIMIT 1
        `;
        const [rows] = await this.dbService.getPool().query(sql, [id]);
        const result = rows as Notification[];
        return result[0];
    }
}