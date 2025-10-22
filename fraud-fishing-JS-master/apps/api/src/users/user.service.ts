import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from "@nestjs/common";
import { User, UserRepository } from "./user.repository";
import { sha256, generateSalt } from "../util/crypto/hash.util";
import { ReportRepository } from "../reports/report.repository";
import { UserDto, CreateUserDto, UpdateUserDto, LoginDto } from "./dto/user.dto";


@Injectable()
export class UserService {
    constructor( private readonly userRepository: UserRepository, private readonly reportRepository: ReportRepository) {}

    // --- POSTS ---

    // Registro de usuario normal
    async registerUser(createUserDto: CreateUserDto): Promise<UserDto> {
        const { email, name, password } = createUserDto;
                const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new BadRequestException("El usuario ya existe con este email");
        }
        const salt = generateSalt();
        const hashedPassword = sha256(password + salt);

        await this.userRepository.registerUser(email, name, hashedPassword, salt, false);
        return { email, name };
    }

    async login(loginDto: LoginDto): Promise<UserDto> {
        const { email, password } = loginDto;
        
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundException("Usuario no encontrado");
        }

        const hashedInputPassword = sha256(password + user.salt);
        if (user.password_hash !== hashedInputPassword) {
            throw new UnauthorizedException("Contraseña incorrecta");
        }

        return { email: user.email, name: user.name };
    }

    // --- GETS ---

    async findById(id: number): Promise<UserDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de usuario inválido");
        }
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException("Usuario no encontrado");
        }
        return { email: user.email, name: user.name };
    }

    async getUserByEmail(email: string): Promise<User> {
        if (!email) {
            throw new BadRequestException("Email inválido");
        }
        return this.userRepository.findByEmail(email);
    }

    async getUsers(): Promise<UserDto[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => ({ 
            email: user.email, 
            name: user.name 
        }));
    }

    async findUserWithStats(userId: number): Promise<any> {
        const user = await this.userRepository.findUserWithStats(userId);
        
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        // Excluir información sensible
        const { password_hash, salt, ...userStats } = user;
        
        return {
            ...userStats,
            reportCount: Number(userStats.reportCount) || 0,
            commentCount: Number(userStats.commentCount) || 0,
            likeCount: Number(userStats.likeCount) || 0,
        };
    }   

    // --- UPDATES ---

    async updateUserById(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
        if (!id || id <= 0) {
            throw new BadRequestException("ID de usuario inválido");
        }
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException("Usuario no encontrado");
        }
        
        // Validar si el email ya está en uso por otro usuario
        if (updateUserDto.email !== undefined && updateUserDto.email !== user.email) {
            const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
            if (existingUser && existingUser.id !== id) {
                throw new BadRequestException("El email ya está en uso por otro usuario");
            }
            user.email = updateUserDto.email;
        }
        
        if (updateUserDto.name !== undefined) {
            user.name = updateUserDto.name;
        }
        if (updateUserDto.password !== undefined) {
            const salt = generateSalt();
            user.salt = salt;
            user.password_hash = sha256(updateUserDto.password + salt);
        }
        
        await this.userRepository.updateUser(user);
        
        return { email: user.email, name: user.name };
    }

}