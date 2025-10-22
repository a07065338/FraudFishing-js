import { forwardRef, Module } from "@nestjs/common";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";
import { CommentRepository } from "./comment.repository";
import { AuthModule } from "src/auth/auth.module";
import { ReportModule } from "src/reports/report.module";

@Module({
    imports: [AuthModule, forwardRef(() => ReportModule)],
    controllers: [CommentController],
    providers: [CommentService, CommentRepository],
    exports: [CommentService, CommentRepository] 
})
export class CommentModule {}