import { UserService } from "../users/user.service";
import { TokenService } from "./tokens.service";
import { Body, Controller, Get, Post, Req, UseGuards, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "../common/interfaces/authenticated-request";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "../users/dto/user.dto";
import { RefreshDto, LoginResponseDto, ProfileResponseDto } from "./dto/auth.dto";

@ApiTags("Autenticación")
@Controller("auth")
export class AuthController {
    constructor( private readonly tokenService: TokenService, private readonly userService: UserService) {}

    // ===== AUTH =======

    // Login de usuario y generación de tokens

    @Post("login")
    @ApiOperation({ summary: 'Iniciar sesión y obtener tokens de acceso y refresco' })
    @ApiResponse({ status: 200, description: "Inicio de sesión exitoso", type: LoginResponseDto })
    @ApiResponse({ status: 401, description: "Credenciales inválidas" })
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    @ApiBody({ type: LoginDto })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
        try {
            const userDto = await this.userService.login(loginDto);
            const user = await this.userService.getUserByEmail(userDto.email);
            const userProfile = {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                is_admin: user.is_admin,
                is_super_admin: user.is_super_admin
            };
            const accessToken = await this.tokenService.generateAccess(userProfile);
            const refreshToken = await this.tokenService.generateRefresh(user.id.toString());
            return { 
                accessToken, 
                refreshToken, 
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    is_admin: user.is_admin,
                    is_super_admin: user.is_super_admin
                }
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException("Credenciales inválidas");
        }
    }

    // Obtener perfil del usuario autenticado

    @Get("profile")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: "Perfil obtenido exitosamente", type: ProfileResponseDto })
    @ApiResponse({ status: 401, description: "Token inválido" })
    getProfile(@Req() req: AuthenticatedRequest): ProfileResponseDto {
        return { profile: req.user.profile };
    }

    // Refrescar token de acceso usando token de refresco

    @Post("refresh")
    @ApiOperation({ summary: 'Refrescar token de acceso' })
    @ApiBody({ type: RefreshDto })
    @ApiResponse({ status: 200, description: "Token refrescado exitosamente" })
    @ApiResponse({ status: 401, description: "Token de refresco inválido" })
    async refresh(@Body() dto: RefreshDto) {
        const profile = await this.tokenService.verifyRefresh(dto.refreshToken);
        const user = await this.userService.findById(Number(profile.sub));
        const fullUser = await this.userService.getUserByEmail(user.email);
        const newAccessToken = await this.tokenService.generateAccess({
            id: fullUser.id.toString(), 
            email: fullUser.email, 
            name: fullUser.name,
            is_admin: fullUser.is_admin,
            is_super_admin: fullUser.is_super_admin
        });
        return { accessToken: newAccessToken };
    }
}