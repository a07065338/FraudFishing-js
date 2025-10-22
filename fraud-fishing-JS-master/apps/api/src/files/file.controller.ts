/* eslint-disable prettier/prettier */
import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { Request } from 'express';
import { ImageFileValidator } from "src/common/validators/image-file.validator";


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
import { FileUploadDto } from './file.dto';

@ApiTags('Files')
@Controller('files')
export class FileController {
    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Subir una imagen para un reporte',
        description:
            'Sube un archivo de imagen (JPG, PNG, GIF). Tamaño máximo: 5MB. Requiere autenticación.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Archivo de imagen a subir',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Archivo subido exitosamente.',
        type: FileUploadDto,
    })
    @ApiResponse({ status: 400, description: 'Archivo inválido (tipo o tamaño).' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './public/uploads',
                filename: (req, file, cb) => {
                    const randomName = uuidv4();
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    uploadFile(
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new ImageFileValidator({}), // ✅ usa tu validador personalizado
            ],
        }),
        )
        file: Express.Multer.File,
        @Req() req: AuthenticatedRequest,
    ): FileUploadDto {
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const filePath = `/public/uploads/${file.filename}`;
        return {
            filename: file.filename,
            path: `${serverUrl}${filePath}`,
            mimetype: file.mimetype,
            size: file.size,
        };
    }
}