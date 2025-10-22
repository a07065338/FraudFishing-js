

import { forwardRef, Module } from "@nestjs/common";
import { ReportController } from "./report.controller";
import { ReportService } from "./report.service";
import { ReportRepository } from "./report.repository";
import { AuthModule } from "src/auth/auth.module";
import { CommentModule } from "src/comments/comment.module";
import { NotificationModule } from "src/notifications/notification.module";

@Module({
    imports: [AuthModule, forwardRef(() => CommentModule), NotificationModule],
    controllers: [ReportController],
    providers: [ReportService, ReportRepository],
    exports: [ReportService, ReportRepository]
})
export class ReportModule {}
