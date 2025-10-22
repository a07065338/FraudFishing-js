import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, IsNotEmpty, IsBoolean } from "class-validator";

// ===== DTOs PARA ENDPOINTS INTERNOS =====

export class CreateNotificationDto {
    @ApiProperty({ example: 1, description: "ID del usuario que recibirá la notificación" })
    @IsNotEmpty()
    @IsInt()
    userId: number;

    @ApiProperty({ example: 101, description: "ID del reporte relacionado" })
    @IsNotEmpty()
    @IsInt()
    reportId: number;

    @ApiProperty({ example: "Reporte de fraude", description: "Título del reporte" })
    @IsNotEmpty()
    @IsString()
    reportTitle: string;

    @ApiProperty({ example: "Aprobado", description: "Nuevo estado del reporte" })
    @IsNotEmpty()
    @IsString()
    newStatus: string;
}

export class ReportStatusChangeDto {
    @ApiProperty({ example: 2, description: "ID del usuario" })
    @IsNotEmpty()
    @IsInt()
    userId: number;

    @ApiProperty({ example: 5, description: "ID del reporte" })
    @IsNotEmpty()
    @IsInt()
    reportId: number;

    @ApiProperty({ example: "Phishing de banco falso", description: "Título del reporte" })
    @IsNotEmpty()
    @IsString()
    reportTitle: string;

    @ApiProperty({ example: "approved", description: "Nuevo estado del reporte" })
    @IsNotEmpty()
    @IsString()
    newStatus: string;
}

export class NotificationDto {
    @ApiProperty({ example: 1001, description: "ID de la notificación" })
    @IsNotEmpty()
    @IsInt()
    id: number;

    @ApiProperty({ example: 42, description: "ID del usuario que recibe la notificación" })
    @IsNotEmpty()
    @IsInt()
    userId: number;

    @ApiProperty({ example: "Estado de reporte actualizado", description: "Título de la notificación" })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ example: "Tu reporte \"Phishing de banco\" ahora está: approved", description: "Mensaje de la notificación" })
    @IsNotEmpty()
    @IsString()
    message: string;

    @ApiProperty({ example: 555, description: "ID relacionado (por ejemplo, el reporte)", required: false })
    @IsOptional()
    @IsInt()
    relatedId?: number;

    @ApiProperty({ example: false, description: "Si la notificación fue leída" })
    @IsNotEmpty()
    @IsBoolean()
    isRead: boolean;

    @ApiProperty({ example: "2024-09-30T12:34:56.000Z", description: "Fecha de creación (ISO)" })
    @IsNotEmpty()
    createdAt: string;

    @ApiProperty({ example: "2024-09-30T12:35:56.000Z", description: "Fecha de actualización (ISO)" })
    @IsNotEmpty()
    updatedAt: string;
}

export class UnreadCountDto {
    @ApiProperty({ example: 3, description: "Cantidad de notificaciones no leídas" })
    @IsNotEmpty()
    @IsInt()
    count: number;
}

