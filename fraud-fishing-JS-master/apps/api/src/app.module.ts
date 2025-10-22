// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { JwtModule } from '@nestjs/jwt';
import { DbModule } from './db/db.module';
import { UserModule } from './users/user.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './reports/report.module';
import { CategoryModule } from './categories/category.module';
import { FilesModule } from './files/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_TTL: Joi.string().default('10m'),
        JWT_REFRESH_TTL: Joi.string().default('1d'),
        DB_HOST: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().allow(''),
        DB_NAME: Joi.string().required(),
      }),
    }),
    JwtModule.register({ global: true }), // sin secret aquí
    DbModule,
    UserModule,
    AuthModule,
    AdminModule,
    ReportModule,
    CategoryModule,
    FilesModule,
  ],
})
export class AppModule {}
