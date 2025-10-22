import { Body, Controller, Post, Put, Req, UseGuards, NotFoundException, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "../common/interfaces/authenticated-request"; 
import { CreateUserDto, UpdateUserDto, UserDto } from "./dto/user.dto";

@ApiTags("Endpoints de Usuarios")
@Controller("users")
export class UserController{
    constructor(private readonly userService: UserService) {}

    // ===== GETS =======

    @Get("me")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
    @ApiResponse({status: 200, description: "Usuario obtenido exitosamente", type: UserDto})
    @ApiResponse({status: 401, description: "Token inválido"})
    @ApiResponse({status: 404, description: "Usuario no encontrado"})
    async getOwnUser(@Req() req: AuthenticatedRequest): Promise<UserDto> {
        const userId = req.user.profile.id;
        return this.userService.findById(Number(userId));
    }

    @Get("me/stats")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener estadísticas del usuario autenticado' })
    @ApiResponse({status: 200, description: "Estadísticas obtenidas exitosamente", type: Object})
    @ApiResponse({status: 401, description: "Token inválido"})
    @ApiResponse({status: 404, description: "Usuario no encontrado"})
    async getOwnUserStats(@Req() req: AuthenticatedRequest): Promise<{ totalReports: number; openReports: number; closedReports: number }> {
        const userId = req.user.profile.id;
        return this.userService.findUserWithStats(Number(userId));
    }

    // ===== POSTS =======

    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({status: 201, description: "Usuario creado exitosamente", type: UserDto})
    @ApiResponse({status: 400, description: "Datos inválidos o correo ya existe"})
    @ApiResponse({status: 500, description: "Error interno del servidor"})
    async registerUser(@Body() userDto: CreateUserDto): Promise<UserDto> {
        return this.userService.registerUser(userDto);
    }

    // ===== PUTS =======

    @Put("me")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Actualizar la información del usuario autenticado' })
    @ApiBearerAuth()
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({status: 200, description: "Usuario actualizado exitosamente", type: UserDto})
    @ApiResponse({status: 400, description: "Datos inválidos"})
    @ApiResponse({status: 401, description: "Token inválido"})
    @ApiResponse({status: 404, description: "Usuario no encontrado"})
    async updateOwnUser(@Req() req: AuthenticatedRequest, @Body() userDto: UpdateUserDto): Promise<UserDto> {
        const userId = req.user.profile.id; 
        const updated = await this.userService.updateUserById(Number(userId), userDto);
        if (!updated) throw new NotFoundException("Usuario no encontrado");
        return updated;
    }


}