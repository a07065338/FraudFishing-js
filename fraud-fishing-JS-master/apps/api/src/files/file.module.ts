import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { AuthModule } from "../auth/auth.module";


@Module({
    imports: [AuthModule],
    controllers: [FileController],
})
export class FilesModule{}