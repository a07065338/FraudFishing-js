import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef.png',
        description: 'El nombre único del archivo guardado en el servidor.',
    })
    filename: string;

    @ApiProperty({
        example: 'http://localhost:3000/public/uploads/a1b2c3d4-e5f6-7890-1234-567890abcdef.png',
        description: 'La URL completa para acceder al archivo.',
    })
    path: string;

    @ApiProperty({
        example: 'image/png',
        description: 'El tipo MIME del archivo.',
    })
    mimetype: string;

    @ApiProperty({
        example: 102400,
        description: 'El tamaño del archivo en bytes.',
    })
    size: number;
}