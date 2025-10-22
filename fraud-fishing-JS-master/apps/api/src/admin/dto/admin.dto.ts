import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateAdminDto {
    @ApiProperty({ example: "admin@example.com", description: "Email del administrador" })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "Admin Name", description: "Nombre del administrador" })
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @ApiProperty({ example: "adminPassword", description: "Contraseña del administrador" })
    @IsString()
    @IsNotEmpty()
    password: string;
}