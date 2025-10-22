import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CategoryDto {
    @ApiProperty({ example: 1, description: "ID de la categoría" })
    @IsNumber()
    id: number;
    
    @ApiProperty({ example: "Phishing", description: "Nombre de la categoría" })
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @ApiProperty({ example: "Reportes de sitios de phishing", description: "Descripción de la categoría" })
    @IsString()
    @IsNotEmpty()
    description: string;
}

export class CreateCategoryDto {
    @ApiProperty({ example: "Phishing", description: "Nombre de la categoría" })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: "Reportes de sitios de phishing", description: "Descripción de la categoría" })
    @IsString()
    @IsNotEmpty()
    description: string;
}

export class UpdateCategoryDto {
    @ApiProperty({ example: "Phishing", description: "Nuevo nombre de la categoría", required: false })
    @IsString()
    @IsOptional()
    name?: string;
    
    @ApiProperty({ example: "Reportes de sitios de phishing", description: "Nueva descripción de la categoría", required: false })
    @IsString()
    @IsOptional()
    description?: string;
}

export class DeleteCategoryDto {
    @ApiProperty({ example: 1, description: "ID de la categoría a eliminar" })
    @IsNumber()
    @IsNotEmpty()
    id: number;
}