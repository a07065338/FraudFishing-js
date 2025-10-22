import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class UserDto {
    
    @ApiProperty({ example: "user@example.com", description: "Email del usuario" })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ApiProperty({ example: "Nombre de Usuario", description: "Nombre del usuario" })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateUserDto {
    @ApiProperty({ example: "user@example.com", description: "Email del usuario" })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ApiProperty({ example: "Juan Pérez", description: "Nombre completo del usuario" })
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @ApiProperty({ example: "password123", description: "Contraseña del usuario" })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class UpdateUserDto {
    @ApiProperty({ example: "Juan Pérez", description: "Nuevo nombre del usuario", required: false })
    @IsString()
    @IsOptional()
    name?: string;
    
    @ApiProperty({ example: "newpassword123", description: "Nueva contraseña", required: false })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiProperty({ example: "nuevo@correo.com", description: "Nuevo correo del usuario", required: false })
    @IsEmail()
    @IsOptional()
    email?: string;
}

export class LoginDto {
    @ApiProperty({ example: "user@example.com", description: "Email del usuario" })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ApiProperty({ example: "password123", description: "Contraseña del usuario" })
    @IsString()
    @IsNotEmpty()
    password: string;
}