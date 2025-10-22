import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsInt } from "class-validator";
export class CommentDto {
    @ApiProperty({ example: 1, description: "ID del comentario" })
    @IsInt()
    @IsNotEmpty()
    id: number;

    @ApiProperty({ example: 1, description: "ID del reporte" })
    @IsInt()
    @IsNotEmpty()
    reportId: number;

    @ApiProperty({ example: 1, description: "ID del usuario" })
    @IsInt()
    @IsNotEmpty()
    userId: number;

    @ApiProperty({ example: "Mi experiencia con este sitio", description: "Título del comentario" })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: "Este sitio también me estafó con el mismo método", description: "Contenido del comentario" })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: "2023-01-01T00:00:00Z", description: "Fecha de creación" })
    @IsString()
    @IsNotEmpty()
    createdAt: Date;
}

export class CreateCommentDto {
    @ApiProperty({ example: 1, description: "ID del reporte" })
    @IsInt()
    @IsNotEmpty()
    reportId: number;
    
    @ApiProperty({ example: "Mi experiencia con este sitio", description: "Título del comentario" })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: "Este sitio también me estafó con el mismo método", description: "Contenido del comentario" })
    @IsString()
    @IsNotEmpty()
    content: string;
}
