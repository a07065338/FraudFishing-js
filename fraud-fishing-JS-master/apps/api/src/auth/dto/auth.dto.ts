import { ApiProperty } from "@nestjs/swagger";

export class RefreshDto {
    @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description: "Token de refresco" })
    refreshToken: string;
}

export class LoginResponseDto {
    @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description: "Token de acceso" })
    accessToken: string;
    
    @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description: "Token de refresco" })
    refreshToken: string;
    
    // user
    @ApiProperty({ example:  { id: 1, email: "user@example.com", name: "Juan Pérez", is_admin: false }, description: "Información del usuario" })
    user: {
        id: number;
        email: string;
        name: string;
        is_admin: boolean;
        is_super_admin?: boolean;
    };
}

export class ProfileResponseDto {
    @ApiProperty({ 
        example: {
            id: "1",
            email: "user@example.com",
            name: "Juan Pérez",
            is_admin: false,
            is_super_admin: false
        },
        description: "Perfil del usuario"
    })
    profile: {
        id: string;
        email: string;
        name: string;
        is_admin: boolean;
        is_super_admin?: boolean;
    };
}