import { Injectable } from '@nestjs/common';
import { UserRepository } from '../users/user.repository';
import { UserDto, UpdateUserDto } from '../users/dto/user.dto';
import { ReportRepository } from '../reports/report.repository';
import { sha256, generateSalt } from 'src/util/crypto/hash.util';
import { UserStatsDto, UserStatsResponseDto } from './dto/user-stats.dto';


@Injectable()
export class AdminService {
    constructor(private readonly userRepository: UserRepository, private readonly reportRepository: ReportRepository) {}

    //  --- POSTs ---

    // Registro de administradores 
    async registerAdmin(email: string, name: string, password: string): Promise<UserDto | void> {
        const existingAdmin = await this.userRepository.findByEmail(email);
        if (existingAdmin) {
            throw new Error('El correo electrónico ya está en uso');
        }
        const salt = generateSalt();
        const hashedPassword = sha256(password + salt);
        return this.userRepository.registerUser(email, name, hashedPassword, salt, true);
    }

    // Registro de superadministradores (init y register)
    async registerSuperAdmin(email: string, name: string, password: string): Promise<UserDto | void> {
        const existingAdmin = await this.userRepository.findByEmail(email);
        if (existingAdmin) {
            throw new Error('El correo electrónico ya está en uso');
        }
        const salt = generateSalt();
        const hashedPassword = sha256(password + salt);
        return this.userRepository.registerSuperAdmin(email, name, hashedPassword, salt);
    }

    //  --- GETs ---

    // Obtener lista de todos los usuarios (solo administradores)
    async findAllUsers(): Promise<UserDto[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => ({id: user.id, email: user.email, name: user.name, is_admin: user.is_admin ? 1 : 0 }));
    }

    // Obtener usuario por ID (Nombre y correo)
    async findUserById(id: number): Promise<UserDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        return { email: user.email, name: user.name };
    }

    // Obtener estadísticas de usuarios con comments y votes y report count
    async getUsersWithStats(): Promise<UserStatsResponseDto> {
        const usersData = await this.userRepository.findAllUsersWithStats();

        const userStats: UserStatsDto[] = usersData.map(user => ({
            id: Number(user.id),
            name: user.name,
            email: user.email,
            is_admin: Boolean(user.is_admin),
            is_super_admin: Boolean(user.is_super_admin),
            created_at: user.created_at,
            reportCount: Number(user.reportCount) || 0,
            commentCount: Number(user.commentCount) || 0,
            likeCount: Number(user.likeCount) || 0,
        }));

        const totalUsers = userStats.length;
        const totalAdmins = userStats.filter(u => u.is_admin).length;
        const totalRegularUsers = totalUsers - totalAdmins;

        return {
            users: userStats,
            totalUsers,
            totalAdmins,
            totalRegularUsers,
        };
    }

    //  --- PUTs ---

    // Actualizar usuario por ID (Nombre y/o contraseña)
    async updateUserById(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (updateUserDto.name !== undefined) {
            user.name = updateUserDto.name;
        }
        if (updateUserDto.password !== undefined) {
            user.password_hash = sha256(updateUserDto.password);
        }
        if (updateUserDto.email !== undefined) {
            user.email = updateUserDto.email;
        }
        
        await this.userRepository.updateUser(user);
        
        return { email: user.email, name: user.name };
    }

    // DELETEs

    // Eliminar usuario por ID
    async deleteUserById(id: number): Promise<void> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        await this.userRepository.deleteUser(id);
    }

}