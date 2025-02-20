import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as fastifyCookie from '@fastify/cookie';
import * as fastifySession from '@fastify/secure-session'; // or @fastify/session if preferred
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  // Register necessary Fastify plugins
  await fastifyAdapter.register(fastifyCookie);
  await fastifyAdapter.register(fastifySession, {
    key: Buffer.from('11ac4b87b3b27b5d0b15ba4596abf6cc784a22440539369239c94b8d7bf52b23', 'hex'),
    cookie: {
      path: '/',
      httpOnly: true,
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // Enable CORS if needed
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix and configuration if needed
  app.setGlobalPrefix('api');

  // Use session middleware if not already handled by Fastify plugins
  // For Passport to work, the session must be available
  app.use((req, res, next) => {
    // For Fastify with secure-session, req.session should be already attached.
    next();
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
