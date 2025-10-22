import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { AuthModule } from "../auth/auth.module";
import { ReportModule } from "src/reports/report.module";
import { NotificationModule } from "src/notifications/notification.module";

@Module({
  imports: [AuthModule, ReportModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserService, UserRepository]
})
export class UserModule {}