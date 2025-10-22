import { Module } from "@nestjs/common";
import { CategoryController } from "./category.controller";
import { CategoryRepository } from "./category.repository";
import { CategoryService } from "./category.service";
import { AuthModule } from "src/auth/auth.module";


@Module({
    imports: [AuthModule],
    controllers: [CategoryController],
    providers: [CategoryService, CategoryRepository],
    exports: [CategoryService]
})
export class CategoryModule {}