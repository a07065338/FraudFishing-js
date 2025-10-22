import { Body, Controller, Post, Put, Get, Param, Delete, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { ApiBody, ApiResponse, ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"; 
import { UpdateUserDto, UserDto } from "../users/dto/user.dto";
import { CreateAdminDto } from "./dto/admin.dto";
import { UserStatsDto, UserStatsResponseDto } from "./dto/user-stats.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";

@ApiTags("Endpoints de Administrador")
@Controller("admin")
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    //  POSTs

    // Registro de administradores 
    @Post("register")
    @UseGuards(JwtAuthGuard, AdminGuard) 
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registrar un nuevo administrador' }) 
    @ApiBody({ type: CreateAdminDto })
    @ApiResponse({ status: 201, description: "Administrador registrado exitosamente", type: UserDto }) 
    @ApiResponse({ status: 400, description: "El correo electrónico ya está en uso" })
    async registerAdmin(@Body() adminDto: CreateAdminDto): Promise<UserDto | void> {
        return this.adminService.registerAdmin(adminDto.email, adminDto.name, adminDto.password);
    }

    // Registro de superadministrador 
    @Post("register-super")
    @UseGuards(JwtAuthGuard, AdminGuard) 
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registrar un nuevo superadministrador' }) 
    @ApiBody({ type: CreateAdminDto })
    @ApiResponse({ status: 201, description: "Superadministrador registrado exitosamente", type: UserDto }) 
    @ApiResponse({ status: 400, description: "El correo electrónico ya está en uso" })
    async registerSuperAdmin(@Body() adminDto: CreateAdminDto): Promise<UserDto | void> {
        return this.adminService.registerSuperAdmin(adminDto.email, adminDto.name, adminDto.password);
    }

    // Inicializar el primer superadministrador (sin autenticación, solo si no existe ninguno)
    @Post("init-super")
    @ApiOperation({ summary: 'Inicializar el primer superadministrador (solo si no existe ninguno)' }) 
    @ApiBody({ type: CreateAdminDto })
    @ApiResponse({ status: 201, description: "Superadministrador inicializado exitosamente", type: UserDto })
    @ApiResponse({ status: 400, description: "El correo electrónico ya está en uso" })
    async initSuperAdmin(@Body() adminDto: CreateAdminDto): Promise<UserDto | void> {
        return this.adminService.registerSuperAdmin(adminDto.email, adminDto.name, adminDto.password);
    }

    //  GETs

    // Obtener estadísticas de usuarios con comments y votes y report count
    @Get("user/stats")
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth() 
    @ApiOperation({ summary: "Obtener estadísticas de usuarios (solo administradores)" })
    @ApiResponse({ status: 200, description: "Estadísticas de usuarios obtenidas exitosamente" })
    async getUserWithStats(): Promise<UserStatsResponseDto> {
        return this.adminService.getUsersWithStats();
    }

    // Obtener lista de todos los usuarios
    @Get('user/list')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth() 
    @ApiOperation({ summary: 'Obtener lista de todos los usuarios (solo administradores)' }) 
    @ApiResponse({ status: 200, description: "Lista de usuarios obtenida exitosamente", type: [UserDto] }) 
    async findAllUsers(): Promise<UserDto[]> {
        return this.adminService.findAllUsers();
    }

    // Obtener usuario por ID
    @Get('user/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth() 
    @ApiOperation({ summary: 'Obtener un usuario por ID (solo administradores)' }) 
    @ApiResponse({ status: 200, description: "Usuario obtenido exitosamente", type: UserDto }) 
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    async findUserById(@Param('id') id: string): Promise<UserDto> {
        return this.adminService.findUserById(Number.parseInt(id, 10));
    }

    //  PUTs

    // Actualizar usuario por ID (Nombre y/o contraseña)
    @Put("user/:id")
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar un usuario por ID (solo administradores)' }) 
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: "Usuario actualizado exitosamente", type: UserDto }) 
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    async updateUserById(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserDto | void> {
        return this.adminService.updateUserById(Number.parseInt(id, 10), updateUserDto);
    }

    // DELETEs

    // Eliminar usuario por ID
    @Delete("user/:id")
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiOperation({ summary: 'Eliminar un usuario por ID (solo administradores)' }) 
    @ApiBearerAuth() 
    @ApiResponse({ status: 200, description: "Usuario eliminado exitosamente" }) 
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    async deleteUserById(@Param('id') id: string): Promise<void> {
        return this.adminService.deleteUserById(Number.parseInt(id, 10));
    }
}