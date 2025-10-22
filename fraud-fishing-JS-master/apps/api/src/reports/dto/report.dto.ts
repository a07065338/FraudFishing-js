import { ApiProperty } from "@nestjs/swagger";

export class TagDto {
    @ApiProperty({ example: 1, description: "ID del tag" })
    id: number;

    @ApiProperty({ example: "Phishing", description: "Nombre del tag" })
    name: string;
}

export class ReportDto {
    @ApiProperty({ example: 1, description: "ID del reporte" })
    id: number;

    @ApiProperty({ example: 1, description: "ID del usuario que creó el reporte" })
    userId: number;

    @ApiProperty({ example: 1, description: "ID de la categoría" })
    categoryId: number;

    @ApiProperty({ 
        type: [TagDto], 
        description: "Lista de tags asociados al reporte", 
        required: false,
        example: [
            { id: 1, name: "Phishing", color: "#FF5733" },
            { id: 2, name: "Banco", color: "#33FF57" }
        ]
    })
    tags?: TagDto[];

    @ApiProperty({ example: "Sitio de phishing detectado", description: "Título del reporte" })
    title: string;

    @ApiProperty({ example: "Este sitio está suplantando a un banco", description: "Descripción del reporte" })
    description: string;

    @ApiProperty({ example: "https://fake-bank.com", description: "URL reportada" })
    url: string;

    @ApiProperty({ example: 1, description: "ID del status del reporte" })
    statusId: number;

    @ApiProperty({ example: "pending", description: "Nombre del status", required: false })
    statusName?: string;

    @ApiProperty({ example: "En espera de revisión", description: "Descripción del status", required: false })
    statusDescription?: string;

    @ApiProperty({ example: "Phishing", description: "Nombre de la categoría", required: false })
    categoryName?: string;
    @ApiProperty({ example: "https://example.com/image.jpg", description: "URL de la imagen", required: false })
    imageUrl?: string;

    @ApiProperty({ example: 5, description: "Cantidad de votos" })
    voteCount: number;

    @ApiProperty({ example: 3, description: "Cantidad de comentarios" })
    commentCount: number;

    @ApiProperty({ example: true, description: "Indica si el usuario actual ha votado este reporte", required: false })
    hasVoted?: boolean;

    @ApiProperty({ example: "2023-01-01T00:00:00Z", description: "Fecha de creación" })
    createdAt: Date;

    @ApiProperty({ example: "2023-01-01T00:00:00Z", description: "Fecha de última actualización" })
    updatedAt: Date;
}

export class CreateReportDto {
    @ApiProperty({ example: 1, description: "ID de la categoría" })
    categoryId: number;

    @ApiProperty({ example: "Sitio de phishing detectado", description: "Título del reporte" })
    title: string;

    @ApiProperty({ example: "Este sitio está suplantando a un banco", description: "Descripción del reporte" })
    description: string;

    @ApiProperty({ example: "https://fake-bank.com", description: "URL a reportar" })
    url: string;

    @ApiProperty({
        type: [String],
        required: false,
        description: "Nombres de tags (se crean automáticamente si no existen)",
        example: ["phishing", "banco", "malware", "estafa"]
    })
    tagNames?: string[];

    @ApiProperty({ example: "https://example.com/image.jpg", description: "URL de la imagen", required: false })
    imageUrl?: string;
    
    userId?: number;
}

export class UpdateReportDto {
    @ApiProperty({ example: "Sitio de phishing actualizado", description: "Nuevo título", required: false })
    title?: string;

    @ApiProperty({ example: "Descripción actualizada", description: "Nueva descripción", required: false })
    description?: string;

    @ApiProperty({ example: "https://new-fake-site.com", description: "Nueva URL", required: false })
    url?: string;

    @ApiProperty({ example: 2, description: "Nuevo ID de categoría", required: false })
    categoryId?: number;

    @ApiProperty({
        type: [String],
        required: false,
        description: "Reemplazar todos los tags con estos nombres",
        example: ["phishing", "actualizado", "verificado"]
    })
    tagNames?: string[];

    @ApiProperty({ example: "https://example.com/new-image.jpg", description: "Nueva URL de imagen", required: false })
    imageUrl?: string;
}

export class UpdateReportStatusDto {
    @ApiProperty({ example: 3, description: "ID del nuevo status" })
    statusId: number;

    @ApiProperty({ example: "El reporte ha sido verificado y las acciones correspondientes han sido tomadas", description: "Nota opcional del moderador",})
    moderationNote?: string;
}

export class ReportStatusDto {
    @ApiProperty({ example: 1, description: "ID del status" })
    id: number;

    @ApiProperty({ example: "pending", description: "Nombre del status" })
    name: string;

    @ApiProperty({ example: "En espera de revisión", description: "Descripción del status", required: false })
    description?: string;
}

export class VoteResponseDto {
    @ApiProperty({ example: 5, description: "Nuevo conteo de votos" })
    voteCount: number;

    @ApiProperty({ example: true, description: "Estado de votación del usuario" })
    hasVoted: boolean;
}

