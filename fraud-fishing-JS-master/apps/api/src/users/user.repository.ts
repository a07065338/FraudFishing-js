import { Injectable } from "@nestjs/common";
import { DbService } from "src/db/db.service";

export type User = {
    id: number;
    email: string;
    name: string;
    password_hash: string;
    salt: string;
    is_admin: boolean; 
    is_super_admin: boolean;
    created_at: Date; 
}

@Injectable()
export class UserRepository {
    constructor(private readonly dbService: DbService) {}

    // --- POSTS ---

    // Registra un usuario normal o admin según el flag isAdmin
    async registerUser(email: string, name: string, hashedPassword: string, salt: string, isAdmin: boolean = false): Promise<void> {
        const sql = `
            INSERT INTO user (name, email, password_hash, salt, is_admin) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await this.dbService.getPool().query(sql, [name, email, hashedPassword, salt, isAdmin]);
    }

    // Registra un super admin (solo para el primer usuario)
    async registerSuperAdmin(email: string, name: string, hashedPassword: string, salt: string): Promise<void> {
        const sql = `
            INSERT INTO user (name, email, password_hash, salt, is_admin, is_super_admin) 
            VALUES (?, ?, ?, ?, TRUE, TRUE)
        `;
        await this.dbService.getPool().query(sql, [name, email, hashedPassword, salt]);
    }

    // --- GETS ---

    // Obtener todos los usuarios
    async findAll(): Promise<User[]> {
        const sql = `SELECT * FROM user`;
        const [rows] = await this.dbService.getPool().query(sql);
        const result = rows as User[];
        return result;
    }

    // Obtener un usuario por email
    async findByEmail(email: string): Promise<User> {
        const sql = `SELECT * FROM user WHERE email = ? LIMIT 1`;  
        const [rows] = await this.dbService.getPool().query(sql, [email]);
        const result = rows as User[];
        return result[0];
    }

    // Obtener un usuario por ID
    async findById(id: number): Promise<User> {
        const sql = `SELECT * FROM user WHERE id = ? LIMIT 1`; 
        const [rows] = await this.dbService.getPool().query(sql, [id]);
        const result = rows as User[];
        return result[0];
    }

    async findUserWithStats(userId: number): Promise<any> {
        const sql = `
            SELECT u.id, u.name, u.email, u.is_admin, u.is_super_admin, u.created_at,
            COUNT(DISTINCT r.id) as reportCount, COUNT(DISTINCT c.id) as commentCount, COUNT(DISTINCT rv.id) as likeCount
            FROM user u
            LEFT JOIN report r ON u.id = r.user_id
            LEFT JOIN comment c ON u.id = c.user_id
            LEFT JOIN report_vote rv ON u.id = rv.user_id
            GROUP BY u.id, u.name, u.email, u.is_admin, u.is_super_admin, u.created_at
            HAVING u.id = ?
        `;
        const [rows] = await this.dbService.getPool().query(sql, [userId]);
        const result = rows as any[];
        return result[0];
    }

    // Obtener todos los usuarios con estadísticas (Para admin)
    async findAllUsersWithStats(): Promise<any[]> {
        const sql = `
            SELECT u.id, u.name, u.email, u.is_admin, u.is_super_admin, u.created_at,
            COUNT(DISTINCT r.id) as reportCount, COUNT(DISTINCT c.id) as commentCount, COUNT(DISTINCT rv.id) as likeCount
            FROM user u
            LEFT JOIN report r ON u.id = r.user_id
            LEFT JOIN comment c ON u.id = c.user_id
            LEFT JOIN report_vote rv ON u.id = rv.user_id
            GROUP BY u.id, u.name, u.email, u.is_admin, u.created_at
            ORDER BY u.created_at DESC`;
        const [rows] = await this.dbService.getPool().query(sql);
        return rows as any[];
    }

    // --- PUTS ---

    // Actualiza el nombre, correo o contraseña de un usuario
    async updateUser(user: User): Promise<void> {
        const sql = `UPDATE user SET name = ?, email = ?, password_hash = ? WHERE id = ?`;
        await this.dbService.getPool().query(sql, [user.name, user.email, user.password_hash, user.id]);
    }

    // --- DELETES ---

    // Elimina un usuario por ID
    async deleteUser(id: number): Promise<void> {
        const sql = `DELETE FROM user WHERE id = ?`;
        await this.dbService.getPool().query(sql, [id]);
    }
}