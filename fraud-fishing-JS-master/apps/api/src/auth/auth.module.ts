import { Module, forwardRef } from "@nestjs/common";
import { UserModule } from "../users/user.module";
import { AuthController } from "./auth.controller";
import { TokenService } from "./tokens.service";


@Module({
    imports: [forwardRef(() => UserModule)],
    controllers: [AuthController],
    providers: [TokenService],
    exports: [TokenService]
})
export class AuthModule {}