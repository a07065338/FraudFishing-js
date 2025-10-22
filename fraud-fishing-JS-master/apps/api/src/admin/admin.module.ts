import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service"; // Importar AdminService
import { UserRepository } from "../users/user.repository";
import { ReportRepository } from "../reports/report.repository";
import { NotificationModule } from "src/notifications/notification.module";
import { UserModule } from "src/users/user.module";
import { ReportModule } from "../reports/report.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [NotificationModule, UserModule, ReportModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, UserRepository, ReportRepository], 
  exports: [AdminService] 
})
export class AdminModule {}