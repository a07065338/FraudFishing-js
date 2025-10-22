/* eslint-disable prettier/prettier */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("API de Gestión de Usuarios")
    .setDescription("API para gestionar usuarios con autenticación JWT")
    .setVersion("1.0")
    .addBearerAuth() // Añadir esta línea para habilitar la autenticación Bearer en Swagger UI
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, doc);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();