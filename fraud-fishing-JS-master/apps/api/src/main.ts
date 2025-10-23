/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Crear la app directamente con top-level await
const app = await NestFactory.create(AppModule);

// Habilitar CORS para permitir peticiones desde el frontend
app.enableCors({
  origin: '*',
  credentials: true,
});

// Configurar Swagger
const config = new DocumentBuilder()
  .setTitle("API de Gestión de Usuarios")
  .setDescription("API para gestionar usuarios con autenticación JWT")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const doc = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("docs", app, doc);

// Iniciar servidor
await app.listen(3000, '0.0.0.0');
console.log(` Servidor iniciado en http://localhost:3000`);
