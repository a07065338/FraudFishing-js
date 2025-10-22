// ReportRepository (dynamic SQL builder)
import { Injectable } from "@nestjs/common";
import { DbService } from "../db/db.service";

export type Report = {
    id: number;
    user_id: number;
    category_id: number;
    title: string;
    description: string;
    url: string;
    status_id: number; 
    image_url: string;
    vote_count: number;
    comment_count: number;
    created_at: Date;
    updated_at: Date;
}

export type ReportWithStatus = Report & {
    status_name: string;
    status_description?: string;
}

export type Tag = {
    id: number;
    name: string;
}

export type ReportWithTags = Report & {
    tags: Tag[];
}

export type ReportWithStatusAndTags = ReportWithStatus & {
    tags: Tag[];
}

@Injectable()
export class ReportRepository {
    constructor(private readonly dbService: DbService) {}

    // --- POSTS ---

    // Crear un nuevo reporte
    async createReport(userId: number, categoryId: number, title: string, description: string, url: string, imageUrl?: string): Promise<void> {
        const sql = `
            INSERT INTO report (user_id, category_id, title, description, url, image_url, status_id) 
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `; // status_id = 1 (default, probablemente 'pending')
        await this.dbService.getPool().query(sql, [userId, categoryId, title, description, url, imageUrl || null]);
    }

    // Si las tags no existen, créalas y devuelve sus IDs, si existen, devuelve sus IDs
    async findOrCreateTagsByNames(rawNames: string[]): Promise<number[]> {
        if (!rawNames?.length) return [];
        const names = Array.from(new Set(rawNames.map(n => n.trim().toLowerCase()).filter(Boolean)));
        const conn = await this.dbService.getPool().getConnection();
        try {
            await conn.beginTransaction();

            for (const name of names) {
            await conn.query(`INSERT IGNORE INTO tag (name) VALUES (?)`, [name]);
            }
            const [rows] = await conn.query(`SELECT id FROM tag WHERE name IN (${names.map(()=>'?').join(',')})`, names);
            await conn.commit();
            return (rows as Array<{id:number}>).map(r => r.id);
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    // Asocia tags a un reporte (inserta en tabla intermedia report_tag)
    async addTagsToReport(reportId: number, tagIds: number[]): Promise<void> {
        if (!tagIds?.length) return;
        const values = tagIds.map(() => '(?, ?)').join(',');
        await this.dbService.getPool().query(
            `INSERT IGNORE INTO report_tag (report_id, tag_id) VALUES ${values}`,
            tagIds.flatMap(id => [reportId, id])
        );
    }

    // --- GETS ---

    // Obtener todos los reportes
    async findAllReports(): Promise<Report[]> {
        const sql = `SELECT * FROM report`;
        const [rows] = await this.dbService.getPool().query(sql);
        return rows as Report[];
    }

    // Obtener reportes con nombre del status (JOIN)
    async findAllReportsWithStatus(): Promise<ReportWithStatus[]> {
        const sql = `
            SELECT r.*, rs.name as status_name, rs.description as status_description 
            FROM report r 
            LEFT JOIN report_status rs ON r.status_id = rs.id
        `;
        const [rows] = await this.dbService.getPool().query(sql);
        return rows as ReportWithStatus[];
    }

    async findById(id: number): Promise<Report> {
        const sql = `SELECT * FROM report WHERE id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [id]);
        const result = rows as Report[];
        return result[0];
    }

    async findByIdWithStatus(id: number): Promise<ReportWithStatus> {
        const sql = `
            SELECT r.*, rs.name as status_name, rs.description as status_description 
            FROM report r 
            LEFT JOIN report_status rs ON r.status_id = rs.id 
            WHERE r.id = ? LIMIT 1
        `;
        const [rows] = await this.dbService.getPool().query(sql, [id]);
        const result = rows as ReportWithStatus[];
        return result[0];
    }

    async findTagsByReportId(reportId: number): Promise<Tag[]> {
        const sql = `
            SELECT t.id, t.name
            FROM tag t
            INNER JOIN report_tag rt ON t.id = rt.tag_id
            WHERE rt.report_id = ?
        `;
        const [rows] = await this.dbService.getPool().query(sql, [reportId]);
        return rows as Tag[];
    }

    async findCategoryByReportId(reportId: number): Promise<string> {
        const sql = `
                    SELECT c.name 
                    FROM report r 
                    INNER JOIN category c ON r.category_id = c.id 
                    WHERE r.id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [reportId]);
        const result = rows as {name: string}[];
        return result[0]?.name;
    }

    async findReportByUrl(url: string): Promise<Report> {
        const sql = `SELECT * FROM report WHERE url = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [url]);
        const result = rows as Report[];
        return result[0];
    }

    async findActiveReportsByUserId(userId: number): Promise<Report[]> {
        const sql = `SELECT * FROM report WHERE user_id = ? AND status_id IN (1, 2)`;
        const [rows] = await this.dbService.getPool().query(sql, [userId]);
        return rows as Report[];
    }

    async findCompletedReportsByUserId(userId: number): Promise<Report[]> {
        const sql = `SELECT * FROM report WHERE user_id = ? AND status_id IN (3, 4)`;
        const [rows] = await this.dbService.getPool().query(sql, [userId]);
        return rows as Report[];
    }

    async findReportsByCategory(categoryId: number): Promise<Report[]> {
        const sql = `SELECT * FROM report WHERE category_id = ?`;
        const [rows] = await this.dbService.getPool().query(sql, [categoryId]);
        return rows as Report[];
    }

    async findReportsByStatusId(statusId: number): Promise<Report[]> {
        const sql = `SELECT * FROM report WHERE status_id = ?`;
        const [rows] = await this.dbService.getPool().query(sql, [statusId]);
        return rows as Report[];
    }

    async findPopularReports(limit: number = 10): Promise<Report[]> {
        const sql = `SELECT * FROM report ORDER BY vote_count DESC, created_at DESC LIMIT ?`;
        const [rows] = await this.dbService.getPool().query(sql, [limit]);
        return rows as Report[];
    }

    async findLatestReportByUserAndUrl(userId: number, url: string): Promise<Report> {
        const sql = `SELECT * FROM report WHERE user_id = ? AND url = ? ORDER BY created_at DESC LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [userId, url]);
        const result = rows as Report[];
        return result[0];
    }

    async findUserVoteOnReport(reportId: number, userId: number): Promise<{id: number, report_id: number, user_id: number} | null> {
        const sql = `SELECT * FROM report_vote WHERE report_id = ? AND user_id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [reportId, userId]);
        const result = rows as Array<{id: number, report_id: number, user_id: number}>;
        return result[0] || null;
    }

    async checkUserVoteOnReport(reportId: number, userId: number): Promise<boolean> {
        const vote = await this.findUserVoteOnReport(reportId, userId);
        return vote !== null;
    }

    // --- PUTS ---

    async updateReportStatus(id: number, statusId: number): Promise<void> {
        const sql = `UPDATE report SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await this.dbService.getPool().query(sql, [statusId, id]);
    }

    async updateReport(
        id: number,
        title: string,
        description: string,
        url: string,
        categoryId: number,
        imageUrl?: string
    ): Promise<void> {
        const sql = `
            UPDATE report 
            SET title = ?, description = ?, url = ?, category_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        await this.dbService.getPool().query(sql, [title, description, url, categoryId, imageUrl || null, id]);
    }
    
    async addUserVoteOnReport(reportId: number, userId: number): Promise<void> {
        const sql = `INSERT INTO report_vote (report_id, user_id) VALUES (?, ?)`;
        const sqlUpdate = `UPDATE report SET vote_count = vote_count + 1 WHERE id = ?`;
        await this.dbService.getPool().query(sql, [reportId, userId]);
        await this.dbService.getPool().query(sqlUpdate, [reportId]);
    }

    async removeUserVoteOnReport(reportId: number, userId: number): Promise<void> {
        const sql = `DELETE FROM report_vote WHERE report_id = ? AND user_id = ?`;
        const sqlUpdate = `UPDATE report SET vote_count = vote_count - 1 WHERE id = ?`;
        await this.dbService.getPool().query(sql, [reportId, userId]);
        await this.dbService.getPool().query(sqlUpdate, [reportId]);
    }

    async incrementCommentCount(reportId: number): Promise<void> {
        const sql = `UPDATE report SET comment_count = comment_count + 1 WHERE id = ?`;
        await this.dbService.getPool().query(sql, [reportId]);
    }

    async decrementCommentCount(reportId: number): Promise<void> {
        const sql = `UPDATE report SET comment_count = comment_count - 1 WHERE id = ?`;
        await this.dbService.getPool().query(sql, [reportId]);
    }

    // --- DELETES ---

    async deleteReport(id: number): Promise<void> {
        const sql = `DELETE FROM report WHERE id = ?`;
        await this.dbService.getPool().query(sql, [id]);
    }

    // --- REPORT STATUS HELPERS ---

    async getAllReportStatuses(): Promise<{id: number, name: string, description?: string}[]> {
        const sql = `SELECT * FROM report_status ORDER BY id`;
        const [rows] = await this.dbService.getPool().query(sql);
        return rows as {id: number, name: string, description?: string}[];
    }

    async getReportStatusById(statusId: number): Promise<{id: number, name: string, description?: string}> {
        const sql = `SELECT * FROM report_status WHERE id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [statusId]);
        const result = rows as {id: number, name: string, description?: string}[];
        return result[0];
    }

    // ===== MÉTODOS PARA ACTUALIZAR STATUS =====

    async updateReportStatusWithModeration(
        reportId: number, 
        newStatusId: number, 
        moderatorId: number,
        moderationNote?: string
    ): Promise<void> {
        const connection = await this.dbService.getPool().getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Actualizar el status del reporte
            const updateReportSql = `
                UPDATE report 
                SET status_id = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            const [updateResult] = await connection.query(updateReportSql, [newStatusId, reportId]);
            
            if ((updateResult as any).affectedRows === 0) {
                throw new Error(`No se pudo actualizar el reporte con ID ${reportId}`);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async findStatusById(statusId: number): Promise<{ id: number; name: string; description: string } | null> {
        const sql = `SELECT id, name, description FROM report_status WHERE id = ? LIMIT 1`;
        const [rows] = await this.dbService.getPool().query(sql, [statusId]);
        const result = rows as Array<{ id: number; name: string; description: string }>;
        return result[0] || null;
    }

    async addStatusHistoryEntry(
        reportId: number,
        fromStatusId: number,
        toStatusId: number,
        note: string,
        changeReason: string,
        changedByUserId: number
    ): Promise<void> {
        const sql = `
            INSERT INTO report_status_history 
            (report_id, from_status_id, to_status_id, note, change_reason, changed_by_user_id, changed_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        await this.dbService.getPool().query(sql, [
            reportId, 
            fromStatusId, 
            toStatusId, 
            note, 
            changeReason, 
            changedByUserId
        ]);
    }

    async searchReports(filters: {
        userId?: number;
        categoryId?: number;
        url?: string;
        statusIds?: number[];
        sort?: "popular" | "recent";
        includeStatus?: boolean;
        includeCategory?: boolean;
        includeUser?: boolean;
        includeTags?: boolean; // ← NUEVO
        limit: number;
        offset: number;
    }): Promise<any[]> {
        const selects: string[] = [
            "r.id", "r.user_id", "r.category_id", "r.title", "r.description", "r.url",
            "r.status_id", "r.image_url", "r.vote_count", "r.comment_count", "r.created_at", "r.updated_at"
        ];
        const joins: string[] = [];

        if (filters.includeStatus) {
            selects.push("rs.name AS status_name", "rs.description AS status_description");
            joins.push("LEFT JOIN report_status rs ON r.status_id = rs.id");
        }
        if (filters.includeCategory) {
            selects.push("c.name AS category_name"); // ← seleccionar nombre de categoría
            joins.push("LEFT JOIN category c ON r.category_id = c.id");
        }
        if (filters.includeUser) {
            joins.push("LEFT JOIN user u ON r.user_id = u.id");
        }
        if (filters.includeTags) {
            // ← NUEVO: agregar los tags por reporte usando JSON_ARRAYAGG
            selects.push("COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'name', t.name)), JSON_ARRAY()) AS tags_json");
            joins.push("LEFT JOIN report_tag rt ON rt.report_id = r.id");
            joins.push("LEFT JOIN tag t ON t.id = rt.tag_id");
        }

        const where: string[] = [];
        const params: any[] = [];
        if (filters.userId) { where.push("r.user_id = ?"); params.push(filters.userId); }
        if (filters.categoryId) { where.push("r.category_id = ?"); params.push(filters.categoryId); }
        if (filters.url) { where.push("r.url = ?"); params.push(filters.url); }
        if (filters.statusIds?.length) {
            where.push(`r.status_id IN (${filters.statusIds.map(() => "?").join(",")})`);
            params.push(...filters.statusIds);
        }

        let orderBy = "ORDER BY r.created_at DESC";
        if (filters.sort === "popular") orderBy = "ORDER BY r.vote_count DESC, r.created_at DESC";
        else if (filters.sort === "recent") orderBy = "ORDER BY r.created_at DESC";

        const groupBy = filters.includeTags ? "GROUP BY r.id" : ""; // ← NUEVO

        const sql = `
            SELECT ${selects.join(", ")}
            FROM report r
            ${joins.join(" ")}
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ${groupBy}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        params.push(filters.limit, filters.offset);

        const [rows] = await this.dbService.getPool().query(sql, params);
        return rows as any[];
    }
}