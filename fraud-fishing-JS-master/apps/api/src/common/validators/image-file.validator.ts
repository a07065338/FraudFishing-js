import { FileValidator } from "@nestjs/common";

export class ImageFileValidator extends FileValidator {
  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
    return allowed.includes(file.mimetype);
  }

  buildErrorMessage(file: Express.Multer.File): string {
    return `Tipo de archivo no permitido: ${file?.mimetype || "desconocido"}. Solo se permiten PNG, JPEG, JPG o GIF.`;
  }
}
